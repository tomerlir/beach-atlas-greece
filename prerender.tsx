/**
 * Prerender entry for vite-prerender-plugin.
 *
 * Renders the full React app to static HTML for each route, seeding the
 * React Query cache from prerender-data.json so pages have content (and
 * crawlable internal links) without client-side JS execution. The dehydrated
 * cache is inlined as a <script> so the browser hydrates without re-fetching.
 *
 * Why this matters: previously the body was empty and only <head> metadata
 * was emitted, leaving crawlers (Ahrefs, non-JS Googlebot pass) with zero
 * outlinks and no content to index.
 */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import {
  generateBeachMetaTitle,
  generateBeachMetaDescription,
  generateAreaMetaTitle,
  generateAreaMetaDescription,
  generateHomeMetaTitle,
  generateHomeMetaDescription,
} from "./src/lib/seo";
import {
  generateBeachWebPageSchema,
  generateBeachFAQSchema,
  generateAreaWebPageSchema,
  generateHomeWebPageSchema,
  generateBestListWebPageSchema,
  generateBestListFAQSchema,
  generateBestListsIndexSchema,
} from "./src/lib/structured-data";
import { getBestListBySlug, rankBeachesForList, BEST_LISTS } from "./src/lib/best-lists";
import { AppProviders, AppCoreContent } from "./src/App";
import type { Tables } from "./src/integrations/supabase/types";
import type { Area } from "./src/types/area";

interface BeachMetadata {
  slug: string;
  name: string;
  area: string;
  blue_flag: boolean;
  amenities: string[] | null;
  type: string;
  wave_conditions: string;
  organized: boolean;
  parking: string;
  description: string | null;
}

interface AreaMetadata {
  name: string;
  description: string | null;
  beachCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullBeach = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullArea = Record<string, any> & { beach_count?: number };

interface PrerenderData {
  routes: string[];
  beachMetadata: Record<string, BeachMetadata>;
  areaMetadata: Record<string, AreaMetadata>;
  allBeaches: FullBeach[];
  allAreas: FullArea[];
  beachByPath: Record<string, FullBeach>;
  areaByPath: Record<string, FullArea>;
  beachesByAreaId: Record<string, FullBeach[]>;
}

let prerenderDataCache: PrerenderData | null = null;

async function loadPrerenderData(): Promise<PrerenderData | null> {
  if (prerenderDataCache) return prerenderDataCache;
  try {
    const data = await import("./src/prerender-data.json");
    prerenderDataCache = data.default as PrerenderData;
    console.warn(
      `✅ Prerender data: ${prerenderDataCache!.allBeaches?.length ?? 0} beaches, ${
        prerenderDataCache!.allAreas?.length ?? 0
      } areas`
    );
    return prerenderDataCache;
  } catch (error) {
    console.warn("⚠️  Could not load prerender-data.json:", error);
    return null;
  }
}

const SITE_URL = "https://beachesofgreece.com";

/**
 * Build a QueryClient pre-seeded with ONLY the data the requested route renders.
 *
 * Why route-aware: seeding the global ["beaches"] (~280KB inlined JSON) for
 * pages that don't render the full grid (e.g. /about, /faq, beach detail,
 * area pages) wastes bytes on every page. We narrow per-route so static pages
 * carry no data and per-area/per-beach pages only carry their own slice.
 *
 * Keys MUST match what page components use via useQuery — see Index.tsx,
 * Map.tsx, Area.tsx, Areas.tsx, BeachDetail.tsx, useAreas.ts.
 */
function buildSeededQueryClient(url: string, data: PrerenderData): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Seeded data is treated as fresh for the duration of this render.
        staleTime: Infinity,
        retry: false,
        // gcTime must be FINITE — Infinity schedules timers that prevent the
        // Node build process from exiting (multiplied across 222 routes).
        gcTime: 0,
      },
    },
  });

  // Routes that render the full beaches grid client-side (need ["beaches"]).
  // Index, Map, and Best (which filters all beaches to rank a subset) all
  // need the full beaches list seeded so SSR renders real <a> links.
  const NEEDS_ALL_BEACHES = url === "/" || url === "/map" || url.startsWith("/best/");

  // Routes that render the area listing page (need ["areas-with-beach-count"]).
  const NEEDS_AREAS_LIST = url === "/areas";

  if (NEEDS_ALL_BEACHES) {
    client.setQueryData(["beaches"], data.allBeaches);
  }

  if (NEEDS_AREAS_LIST) {
    client.setQueryData(["areas-with-beach-count"], data.allAreas);
  }

  // Area detail page: ["beaches", area.id] + area lookup.
  const areaData = data.areaByPath[url];
  if (areaData) {
    const areaBeaches = data.beachesByAreaId[areaData.id] || [];
    client.setQueryData(["beaches", areaData.id], areaBeaches);
    client.setQueryData(["area", areaData.slug], areaData);
    client.setQueryData(["area-by-slug", areaData.slug], areaData);
  }

  // Beach detail page: ["beach", slug] + parent area context + siblings.
  const beachData = data.beachByPath[url];
  if (beachData) {
    client.setQueryData(["beach", beachData.slug], beachData);
    const parentArea = data.allAreas.find((a) => a.id === beachData.area_id);
    if (parentArea) {
      client.setQueryData(["area-by-slug", parentArea.slug], parentArea);
      // Seed sibling beaches so the "More in {area}" section emits real
      // <a href> links in the prerendered HTML — otherwise crawlers see
      // an empty siblings array and beach pages have no beach↔beach links.
      // Key shape must match BeachDetail.tsx: ["more-in-area", areaSlug, beachSlug].
      const siblings = (data.beachesByAreaId[beachData.area_id] || [])
        .filter((b) => b.slug !== beachData.slug)
        .slice()
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .slice(0, 8);
      client.setQueryData(["more-in-area", parentArea.slug, beachData.slug], siblings);
    }
  }

  // Static pages (/about, /faq, /guide, /privacy, /ontology, /404) seed nothing.
  return client;
}

interface HeadElement {
  type: "meta" | "link" | "script";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
}

function buildHeadElements(
  url: string,
  data: PrerenderData | null,
  dehydratedState: unknown
): { title: string; elements: Set<HeadElement> } {
  const elements = new Set<HeadElement>();
  let title = "Beaches of Greece";
  let description = "Discover the best beaches in Greece with verified data and smart search.";
  let jsonLdData: unknown = null;
  // Additional JSON-LD blocks to emit alongside the main schema (e.g. FAQPage).
  const extraJsonLd: unknown[] = [];

  if (data) {
    // Prefer the full beach row (beachByPath) over the narrow beachMetadata —
    // schema generation needs verified_at, latitude, longitude, photo fields,
    // none of which are in BeachMetadata.
    const fullBeach = data.beachByPath[url];
    const beachData = data.beachMetadata[url];
    const areaData = data.areaMetadata[url];

    if (fullBeach && beachData) {
      const beach = fullBeach as Tables<"beaches">;
      title = generateBeachMetaTitle(beach);
      description = generateBeachMetaDescription(beach);
      const canonicalUrl = `${SITE_URL}${url}`;
      jsonLdData = generateBeachWebPageSchema(beach, canonicalUrl);
      // Pull the embedded beach_content (set by generate-routes.ts) so the
      // FAQPage schema uses AI-generated Q&A from the DB rather than the
      // local template fallback.
      const embeddedContent = (fullBeach as { beach_content?: { faqs?: unknown } }).beach_content;
      const dbFaqs = Array.isArray(embeddedContent?.faqs)
        ? (embeddedContent!.faqs as Array<{ question: string; answer: string }>)
        : undefined;
      extraJsonLd.push(generateBeachFAQSchema(beach, canonicalUrl, dbFaqs));
    } else if (areaData) {
      const area: Area = {
        id: "",
        name: areaData.name,
        slug: url.replace("/", ""),
        description: areaData.description,
        hero_photo_url: null,
        hero_photo_source: null,
        status: "ACTIVE",
        created_at: null,
        updated_at: null,
      };
      title = generateAreaMetaTitle(area, areaData.beachCount);
      description = areaData.description || generateAreaMetaDescription(area, areaData.beachCount);
      const canonicalUrl = `${SITE_URL}${url}`;
      const areaBeaches = Object.values(data.beachByPath).filter((b) => b.area === areaData.name);
      jsonLdData = generateAreaWebPageSchema(
        area,
        areaBeaches as Tables<"beaches">[],
        canonicalUrl
      );
    } else if (url === "/") {
      const allBeaches = data.allBeaches as Tables<"beaches">[];
      jsonLdData = generateHomeWebPageSchema(allBeaches);
      title = generateHomeMetaTitle();
      description = generateHomeMetaDescription();
    } else if (url === "/best") {
      title = "Best Beach Lists in Greece — Ranked by Verified Criteria";
      description =
        "Curated, methodology-backed lists of the best Greek beaches by use case: family-friendly, Blue Flag, snorkeling, calm water, sandy, wild, and easy-access.";
      jsonLdData = generateBestListsIndexSchema(BEST_LISTS, `${SITE_URL}${url}`);
    } else if (url.startsWith("/best/")) {
      const slug = url.slice("/best/".length);
      const list = getBestListBySlug(slug);
      if (list) {
        title = list.metaTitle;
        description = list.metaDescription;
        const canonicalUrl = `${SITE_URL}${url}`;
        const allBeaches = data.allBeaches as Tables<"beaches">[];
        const ranked = rankBeachesForList(allBeaches, list);
        jsonLdData = generateBestListWebPageSchema(list, ranked, canonicalUrl);
        extraJsonLd.push(generateBestListFAQSchema(list, canonicalUrl));
      }
    } else if (url === "/about") {
      title = "About Us | Verified Greek Beach Data & Smart Search";
      description =
        "Beaches of Greece is a comprehensive platform that helps travelers find the perfect Greek beach through natural language search and verified data.";
    } else if (url === "/areas") {
      title = "Greek Beach Areas";
      description = "Browse all Greek beach areas and discover the perfect destination.";
    } else if (url === "/faq") {
      title = "Frequently Asked Questions | Beaches of Greece";
      description = "Common questions about using Beaches of Greece.";
    } else if (url === "/guide") {
      title = "How to Choose the Perfect Greek Beach | Beaches of Greece";
      description = "A guide to choosing the right beach in Greece based on your preferences.";
    } else if (url === "/privacy") {
      title = "Privacy Policy | Beaches of Greece";
      description = "Privacy policy for Beaches of Greece.";
    } else if (url === "/map") {
      title = "Map of Greek Beaches - Explore on an Interactive Map";
      description = "Explore Greek beaches on an interactive map.";
    } else if (url === "/ontology") {
      title = "Beach Ontology | Beaches of Greece";
      description = "How we classify and describe Greek beaches.";
    } else if (url === "/404") {
      title = "Page Not Found | Beaches of Greece";
      description = "The page you're looking for could not be found.";
    }
  }

  const canonicalHref = url === "/" ? SITE_URL : `${SITE_URL}${url}`;
  const isNotFoundPage = url === "/404";

  elements.add({ type: "meta", props: { name: "description", content: description } });
  elements.add({ type: "meta", props: { property: "og:title", content: title } });
  elements.add({ type: "meta", props: { property: "og:description", content: description } });
  elements.add({ type: "meta", props: { property: "og:type", content: "website" } });
  elements.add({ type: "meta", props: { property: "og:site_name", content: "Beaches of Greece" } });
  elements.add({ type: "meta", props: { name: "twitter:card", content: "summary_large_image" } });
  elements.add({ type: "meta", props: { name: "twitter:title", content: title } });
  elements.add({ type: "meta", props: { name: "twitter:description", content: description } });

  if (isNotFoundPage) {
    // Don't emit canonical or og:url on the 404 shell — it's served for
    // many different unknown URLs. noindex prevents the 404 from being indexed.
    elements.add({ type: "meta", props: { name: "robots", content: "noindex" } });
  } else {
    elements.add({ type: "meta", props: { property: "og:url", content: canonicalHref } });
    elements.add({ type: "link", props: { rel: "canonical", href: canonicalHref } });
  }

  if (jsonLdData) {
    elements.add({
      type: "script",
      props: {
        type: "application/ld+json",
        children: JSON.stringify(jsonLdData),
      },
    });
  }

  for (const extra of extraJsonLd) {
    elements.add({
      type: "script",
      props: {
        type: "application/ld+json",
        children: JSON.stringify(extra),
      },
    });
  }

  // Inline dehydrated React Query state for client hydration.
  // We escape `<` to prevent any embedded JSON from terminating the script tag.
  const stateJson = JSON.stringify(dehydratedState).replace(/</g, "\\u003c");
  elements.add({
    type: "script",
    props: {
      children: `window.__REACT_QUERY_STATE__=${stateJson};`,
    },
  });

  return { title, elements };
}

export async function prerender(data: { url: string }) {
  const { url } = data;

  try {
    const prerenderData = await loadPrerenderData();
    if (!prerenderData) {
      // No data — fall back to empty body, head-only.
      return { html: "", head: { lang: "en", title: "Beaches of Greece" } };
    }

    const queryClient = buildSeededQueryClient(url, prerenderData);
    const helmetContext: Record<string, unknown> = {};

    // Render the full app for this URL into static HTML. AppCoreContent has
    // no router; StaticRouter provides location for the server pass.
    const html = renderToString(
      <AppProviders queryClient={queryClient} helmetContext={helmetContext}>
        <StaticRouter location={url}>
          <AppCoreContent />
        </StaticRouter>
      </AppProviders>
    );

    const dehydratedState = dehydrate(queryClient);
    // Drop the cache so any remaining gc timers are released and the build
    // process can exit cleanly after all routes are rendered.
    queryClient.clear();
    const { title, elements } = buildHeadElements(url, prerenderData, dehydratedState);

    return { html, head: { lang: "en", title, elements } };
  } catch (error) {
    console.error(`❌ Prerender error for ${url}:`, error);
    return {
      html: "",
      head: { lang: "en", title: "Beaches of Greece" },
    };
  }
}

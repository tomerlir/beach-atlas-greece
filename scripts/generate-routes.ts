#!/usr/bin/env tsx

/**
 * Route List Generator for Pre-rendering
 *
 * Generates a list of all routes to be pre-rendered by the vite-prerender-plugin.
 * Reuses the logic from generate-sitemap.ts to ensure consistency.
 *
 * Usage:
 *   npm run generate-routes
 *   or
 *   tsx scripts/generate-routes.ts
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// Load environment variables from .env file if it exists
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Utility function to generate area slug (shared with generate-sitemap.ts and utils.ts)
// Note: Keeping local copy to avoid ESM/CommonJS issues in build scripts
const slugify = (input: string | undefined | null): string => {
  if (!input) return "unknown";

  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s_-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base) return base;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return `beach-${Math.abs(hash).toString(36)}`;
};

const generateAreaSlug = (area: string): string => {
  return slugify(area);
};

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase credentials. Make sure .env file exists with:");
  console.error("   VITE_SUPABASE_URL=...");
  console.error("   VITE_SUPABASE_PUBLISHABLE_KEY=...");
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Metadata structure for prerendering (subset of Tables<"beaches"> fields needed for SEO)
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

// Full row shapes used for SSR seeding (matches what page components select).
// Stored in prerender-data.json for prerender.tsx to consume.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullBeach = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullArea = Record<string, any> & { beach_count?: number };

interface PrerenderPayload {
  routes: string[];
  // Legacy SEO metadata (still used by prerender head generation)
  beachMetadata: Record<string, BeachMetadata>;
  areaMetadata: Record<string, AreaMetadata>;
  // Full data for React Query SSR seeding
  allBeaches: FullBeach[];
  allAreas: FullArea[];
  beachByPath: Record<string, FullBeach>;
  areaByPath: Record<string, FullArea>;
  beachesByAreaId: Record<string, FullBeach[]>;
}

async function generateRoutes(): Promise<PrerenderPayload> {
  const routes: string[] = [];
  const beachMetadata: Record<string, BeachMetadata> = {};
  const areaMetadata: Record<string, AreaMetadata> = {};
  const beachByPath: Record<string, FullBeach> = {};
  const areaByPath: Record<string, FullArea> = {};
  const beachesByAreaId: Record<string, FullBeach[]> = {};

  // Static pages.
  // "/404" is included so vite-prerender-plugin emits a real 404.html that
  // nginx can serve via `error_page 404 /404.html;`. It is intentionally NOT
  // added to sitemap.xml (see scripts/generate-sitemap.ts).
  routes.push("/", "/about", "/areas", "/map", "/ontology", "/faq", "/guide", "/privacy", "/404");

  // Fetch all active areas — full row
  const { data: areas, error: areasError } = await supabase
    .from("areas")
    .select("*")
    .eq("status", "ACTIVE")
    .order("name");

  if (areasError) {
    throw new Error(`Failed to fetch areas: ${areasError.message}`);
  }

  // Fetch all active beaches — full row (page components SELECT * or wide subsets)
  const { data: beaches, error: beachesError } = await supabase
    .from("beaches")
    .select("*")
    .eq("status", "ACTIVE")
    .order("name");

  if (beachesError) {
    throw new Error(`Failed to fetch beaches: ${beachesError.message}`);
  }

  // Fetch AI-generated content (overview, amenities summary, FAQs, keywords).
  // Embedded onto beachByPath rows so beach-detail prerendering can read it
  // without a second round trip. Missing content is fine — the renderer falls
  // back to template generators in src/lib/beach-faq.ts.
  const { data: contents, error: contentsError } = await supabase
    .from("beach_content")
    .select("beach_id, overview, amenities_summary, faqs, keywords");
  if (contentsError) {
    throw new Error(`Failed to fetch beach_content: ${contentsError.message}`);
  }
  const contentByBeachId = new Map<string, FullBeach>();
  for (const c of contents || []) {
    contentByBeachId.set((c as { beach_id: string }).beach_id, c as FullBeach);
  }

  const safeAreas: FullArea[] = areas || [];
  const safeBeaches: FullBeach[] = (beaches || []).map((b) => {
    const content = contentByBeachId.get(b.id);
    if (!content) return b;
    return {
      ...b,
      beach_content: {
        overview: content.overview,
        amenities_summary: content.amenities_summary,
        faqs: content.faqs,
        keywords: content.keywords,
      },
    };
  });

  // Group beaches by area_id for fast SSR seeding of area pages
  safeBeaches.forEach((beach) => {
    if (beach.area_id) {
      if (!beachesByAreaId[beach.area_id]) beachesByAreaId[beach.area_id] = [];
      beachesByAreaId[beach.area_id].push(beach);
    }
  });

  // Attach beach_count to each area for the Areas listing page
  const areasWithCount: FullArea[] = safeAreas.map((area) => ({
    ...area,
    beach_count: beachesByAreaId[area.id]?.length || 0,
  }));

  if (!safeAreas.length) {
    console.warn("⚠️  No areas found in database");
  } else {
    areasWithCount.forEach((area) => {
      const areaPath = `/${area.slug}`;
      routes.push(areaPath);
      areaMetadata[areaPath] = {
        name: area.name,
        description: area.description,
        beachCount: area.beach_count || 0,
      };
      areaByPath[areaPath] = area;
    });
  }

  if (!safeBeaches.length) {
    console.warn("⚠️  No beaches found in database");
  } else {
    safeBeaches.forEach((beach) => {
      const area = safeAreas.find((a) => a.id === beach.area_id);
      const areaSlug = area?.slug || generateAreaSlug(beach.area);
      const beachSlug = beach.slug || slugify(beach.name);
      const routePath = `/${areaSlug}/${beachSlug}`;

      routes.push(routePath);

      beachMetadata[routePath] = {
        slug: beachSlug,
        name: beach.name,
        area: beach.area,
        blue_flag: beach.blue_flag || false,
        amenities: beach.amenities,
        type: beach.type || "OTHER",
        wave_conditions: beach.wave_conditions || "MODERATE",
        organized: beach.organized || false,
        parking: beach.parking || "NONE",
        description: beach.description,
      };
      beachByPath[routePath] = beach;
    });
  }

  return {
    routes,
    beachMetadata,
    areaMetadata,
    allBeaches: safeBeaches,
    allAreas: areasWithCount,
    beachByPath,
    areaByPath,
    beachesByAreaId,
  };
}

async function main() {
  try {
    console.warn("🚀 Generating route list for pre-rendering...");

    const data = await generateRoutes();

    if (data.routes.length === 0) {
      console.warn("⚠️  No routes generated");
      return;
    }

    console.warn(`📊 Found ${data.routes.length} routes to pre-render`);
    console.warn(`📊 Collected metadata for ${Object.keys(data.beachMetadata).length} beaches`);
    console.warn(`📊 Collected metadata for ${Object.keys(data.areaMetadata).length} areas`);

    // Write complete data to JSON file (root and src for different uses)
    const dataPath = join(process.cwd(), "prerender-data.json");
    const srcDataPath = join(process.cwd(), "src", "prerender-data.json");
    writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
    writeFileSync(srcDataPath, JSON.stringify(data, null, 2), "utf8");

    // Also write simple routes array for backwards compatibility
    const routesPath = join(process.cwd(), "prerender-routes.json");
    writeFileSync(routesPath, JSON.stringify(data.routes, null, 2), "utf8");

    console.warn(`✅ Routes and metadata generated successfully!`);
    console.warn(`📁 Data location: ${dataPath} and ${srcDataPath}`);
    console.warn(`📁 Routes location: ${routesPath}`);
    console.warn(`📄 Contains ${data.routes.length} routes with full metadata`);
  } catch (error) {
    console.error("❌ Error generating routes:", error);
    process.exit(1);
  }
}

// Run the script
main();

export { generateRoutes, main };

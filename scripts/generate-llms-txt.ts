#!/usr/bin/env tsx

/**
 * llms.txt Generator for Beaches of Greece
 *
 * Generates /public/llms.txt — a curated, markdown-formatted map of the site
 * for LLM crawlers (ChatGPT, Claude, Perplexity, etc.). The convention
 * (https://llmstxt.org) gives AI engines a high-trust shortcut over sitemap.xml:
 * they get titles, descriptions, and groupings in natural language, not just
 * a list of URLs.
 *
 * Pulled from Supabase so it stays in sync with the live beach/area set.
 *
 * Usage:
 *   npm run generate-llms-txt
 *   or
 *   tsx scripts/generate-llms-txt.ts
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

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

const SITE_URL = "https://beachesofgreece.com";
const MAX_DESC_LEN = 140;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase credentials. Make sure .env file exists with:");
  console.error("   VITE_SUPABASE_URL=...");
  console.error("   VITE_SUPABASE_PUBLISHABLE_KEY=...");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface AreaRow {
  name: string;
  slug: string;
  description: string | null;
  beach_count?: number;
}

interface BeachRow {
  name: string;
  slug: string;
  area: string;
  area_id: string | null;
}

function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[,;:.\-—\s]+$/, "")}…`;
}

function buildLlmsTxt(areas: AreaRow[], beaches: BeachRow[]): string {
  const beachCount = beaches.length;
  const areaCount = areas.length;

  const lines: string[] = [];

  lines.push("# Beaches of Greece");
  lines.push("");
  lines.push(
    `> Verified directory of ${beachCount} Greek beaches across ${areaCount} regions, with structured data on amenities, parking, wave conditions, Blue Flag status, beach type (sandy/pebbly/mixed), and organized vs. unorganized classification. Designed to answer "best beach for X" questions with cited, comparable facts.`
  );
  lines.push("");

  lines.push("## Methodology");
  lines.push("");
  lines.push(
    "- Data sourced from OpenStreetMap (geolocation), official tourism boards, the Blue Flag Foundation (https://www.blueflag.global), and on-site verification."
  );
  lines.push("- Each beach record carries a `verified_at` timestamp shown on its detail page.");
  lines.push(
    "- The full ontology — field definitions, enums, and allowed values — is published at `/ontology`."
  );
  lines.push(
    "- Photo credits and Creative Commons licenses are preserved per Wikimedia Commons attribution requirements."
  );
  lines.push("");

  lines.push("## Core pages");
  lines.push("");
  lines.push(
    `- [Beaches of Greece — homepage](${SITE_URL}): natural-language search across the full directory`
  );
  lines.push(`- [Beach selection guide](${SITE_URL}/guide): how to choose by use case`);
  lines.push(`- [FAQ](${SITE_URL}/faq): common questions about Greek beaches and the directory`);
  lines.push(`- [Beach ontology](${SITE_URL}/ontology): field definitions, enums, and schema`);
  lines.push(`- [Browse all areas](${SITE_URL}/areas): index of regions`);
  lines.push(`- [Interactive map](${SITE_URL}/map): all beaches plotted geographically`);
  lines.push(`- [About](${SITE_URL}/about): mission and data philosophy`);
  lines.push("");

  lines.push("## Best-of lists (ranked category pages)");
  lines.push("");
  lines.push(
    'Each list is a ranked, methodology-backed cut of the directory for a specific intent. Direct, citable source for "best X beaches in Greece" queries.'
  );
  lines.push("");
  lines.push(
    `- [Best family-friendly beaches in Greece](${SITE_URL}/best/family-friendly-beaches-greece): calm water + lifeguards + amenities scoring`
  );
  lines.push(
    `- [Blue Flag beaches in Greece](${SITE_URL}/best/blue-flag-beaches-greece): verified registry from the FEE Blue Flag programme`
  );
  lines.push(
    `- [Best snorkeling beaches in Greece](${SITE_URL}/best/snorkeling-beaches-greece): clear water, rocky shorelines, snorkeling-listed amenity`
  );
  lines.push(
    `- [Best calm-water beaches in Greece for swimming](${SITE_URL}/best/calm-water-beaches-greece): sheltered bays, leeward coasts, protected coves`
  );
  lines.push(
    `- [Best sandy beaches in Greece](${SITE_URL}/best/sandy-beaches-greece): SANDY beach-type classification, ranked by amenity completeness`
  );
  lines.push(
    `- [Best wild & unspoiled beaches in Greece](${SITE_URL}/best/unspoiled-beaches-greece): unorganized, remote-access, minimal facilities`
  );
  lines.push(
    `- [Easy-access Greek beaches with parking](${SITE_URL}/best/easy-access-beaches-greece): large parking lots, organized facilities, short walks`
  );
  lines.push("");

  lines.push("## Regions");
  lines.push("");
  const sortedAreas = [...areas].sort((a, b) => a.name.localeCompare(b.name));
  for (const area of sortedAreas) {
    const count = area.beach_count ?? beaches.filter((b) => b.area === area.name).length;
    const desc = (area.description || "").replace(/\s+/g, " ").trim();
    const tagline = desc ? ` — ${truncateAtWord(desc, MAX_DESC_LEN)}` : "";
    lines.push(`- [${area.name}](${SITE_URL}/${area.slug}): ${count} beaches${tagline}`);
  }
  lines.push("");

  lines.push("## Beaches");
  lines.push("");
  lines.push(
    "Full beach inventory, grouped by region. Each link resolves to a detail page with full schema.org `Beach`+`TouristAttraction` JSON-LD, amenities, parking, wave conditions, and a per-beach FAQ block."
  );
  lines.push("");

  const beachesByArea = new Map<string, BeachRow[]>();
  for (const beach of beaches) {
    const list = beachesByArea.get(beach.area) || [];
    list.push(beach);
    beachesByArea.set(beach.area, list);
  }

  for (const area of sortedAreas) {
    const areaBeaches = beachesByArea.get(area.name) || [];
    if (areaBeaches.length === 0) continue;
    lines.push(`### ${area.name}`);
    lines.push("");
    const sorted = [...areaBeaches].sort((a, b) => a.name.localeCompare(b.name));
    for (const beach of sorted) {
      lines.push(`- [${beach.name.trim()}](${SITE_URL}/${area.slug}/${beach.slug})`);
    }
    lines.push("");
  }

  lines.push("## Machine-readable indexes");
  lines.push("");
  lines.push(`- [sitemap.xml](${SITE_URL}/sitemap.xml): full URL inventory with lastmod`);
  lines.push(
    `- [robots.txt](${SITE_URL}/robots.txt): crawler permissions — GPTBot, ClaudeBot, PerplexityBot, Google-Extended are explicitly allowed`
  );
  lines.push("");

  return lines.join("\n");
}

async function main() {
  console.warn("🚀 Generating llms.txt for Beaches of Greece...");

  const { data: areas, error: areasError } = await supabase
    .from("areas")
    .select("name, slug, description, status")
    .eq("status", "ACTIVE")
    .order("name");

  if (areasError) {
    throw new Error(`Failed to fetch areas: ${areasError.message}`);
  }

  const { data: beaches, error: beachesError } = await supabase
    .from("beaches")
    .select("name, slug, area, area_id, status")
    .eq("status", "ACTIVE")
    .order("name");

  if (beachesError) {
    throw new Error(`Failed to fetch beaches: ${beachesError.message}`);
  }

  if (!areas || areas.length === 0) {
    console.error("❌ No active areas found in database — refusing to overwrite llms.txt.");
    process.exit(1);
  }

  if (!beaches || beaches.length === 0) {
    console.error("❌ No active beaches found in database — refusing to overwrite llms.txt.");
    process.exit(1);
  }

  const content = buildLlmsTxt(areas as AreaRow[], beaches as BeachRow[]);
  const outPath = join(process.cwd(), "public", "llms.txt");
  writeFileSync(outPath, content, "utf8");

  const sizeKB = (content.length / 1024).toFixed(1);
  console.warn(`✅ llms.txt generated successfully!`);
  console.warn(`📁 Location: ${outPath}`);
  console.warn(`🔗 URL: ${SITE_URL}/llms.txt`);
  console.warn(`📊 ${beaches.length} beaches across ${areas.length} regions`);
  console.warn(`📈 ${sizeKB} KB`);
}

main().catch((error) => {
  console.error("❌ Error generating llms.txt:", error);
  process.exit(1);
});

export { buildLlmsTxt, main };

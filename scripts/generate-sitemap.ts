#!/usr/bin/env tsx

/**
 * Comprehensive Sitemap Generator for Greek Beaches Directory
 *
 * This script generates a complete sitemap.xml file that includes:
 * - Main pages and content sections
 * - All area overview pages
 * - All beach detail pages
 * - Image sitemap extensions
 * - Proper priority and change frequency settings
 * - Last modified dates from database
 *
 * Usage:
 *   npm run generate-sitemap
 *   or
 *   tsx scripts/generate-sitemap.ts
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { generateBeachMetaTitle } from "../src/lib/seo-utils.js";

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

// Utility function to generate area slug (shared with generate-routes.ts and utils.ts)
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

// XML escaping function to handle special characters
const escapeXml = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

// Configuration
const SITE_URL = "https://beachesofgreece.com";
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

interface Beach {
  id: string;
  name: string;
  slug: string;
  description?: string;
  photo_url?: string;
  updated_at: string;
  status: string;
  area: string;
  area_id: string;
  blue_flag: boolean;
  organized: boolean;
  amenities: string[];
  type: string;
  wave_conditions: string;
  latitude?: number;
  longitude?: number;
}

interface Area {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hero_photo_url?: string;
  hero_photo_source?: string;
  status: "DRAFT" | "HIDDEN" | "ACTIVE";
  updated_at: string;
}

/**
 * Calculate priority for a beach based on its features and importance
 */
function calculateBeachPriority(beach: Beach): number {
  let priority = 0.7; // Base priority for beach pages

  // Boost priority for premium features
  if (beach.blue_flag) priority += 0.1;
  if (beach.organized) priority += 0.05;
  if (beach.amenities?.includes("lifeguard")) priority += 0.05;
  if (beach.amenities?.includes("family_friendly")) priority += 0.05;

  // Cap at 0.9 to leave room for more important pages
  return Math.min(priority, 0.9);
}

/**
 * Generate comprehensive sitemap with proper prioritization and metadata
 */
function generateSitemap(beaches: Beach[], areas: Area[]): string {
  const currentDate = new Date().toISOString().split("T")[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- HIGH PRIORITY: Core Pages -->
  <url>
    <loc>${escapeXml(SITE_URL)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${escapeXml(`${SITE_URL}/areas`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- MEDIUM-HIGH PRIORITY: Main Content Sections -->
  <url>
    <loc>${escapeXml(`${SITE_URL}/map`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${escapeXml(`${SITE_URL}/about`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- "BEST" RANKED LIST PAGES — high priority for AI citations -->
  <url>
    <loc>${escapeXml(`${SITE_URL}/best/family-friendly-beaches-greece`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${escapeXml(`${SITE_URL}/best/blue-flag-beaches-greece`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${escapeXml(`${SITE_URL}/best/snorkeling-beaches-greece`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${escapeXml(`${SITE_URL}/best/calm-water-beaches-greece`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${escapeXml(`${SITE_URL}/best/sandy-beaches-greece`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${escapeXml(`${SITE_URL}/best/unspoiled-beaches-greece`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${escapeXml(`${SITE_URL}/best/easy-access-beaches-greece`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- MEDIUM PRIORITY: Content Pages -->
  <url>
    <loc>${escapeXml(`${SITE_URL}/guide`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${escapeXml(`${SITE_URL}/faq`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${escapeXml(`${SITE_URL}/ontology`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- LOW PRIORITY: Utility Pages -->
  <url>
    <loc>${escapeXml(`${SITE_URL}/privacy`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <!-- AREA PAGES: Geographic Content Hubs -->
  `;

  // Add area pages with rich metadata and hero images
  areas.forEach((area) => {
    const lastmod = new Date(area.updated_at).toISOString().split("T")[0];
    const priority = 0.8; // Areas are important content hubs

    sitemap += `<url>
    <loc>${escapeXml(`${SITE_URL}/${area.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>`;

    // Add hero image if available
    if (area.hero_photo_url) {
      const imageTitle = `${area.name} - Greek Beaches`;
      const imageCaption = area.description
        ? `${area.name}, Greece - ${area.description}`
        : `${area.name} beaches in Greece - Discover beautiful beaches and coastal destinations`;

      sitemap += `
    <image:image>
      <image:loc>${escapeXml(area.hero_photo_url)}</image:loc>
      <image:title>${escapeXml(imageTitle)}</image:title>
      <image:caption>${escapeXml(imageCaption)}</image:caption>
    </image:image>`;
    }

    sitemap += `
  </url>
  `;
  });

  sitemap += `<!-- BEACH DETAIL PAGES: Core Content with Rich Metadata -->
  `;

  // Add beach pages with enhanced metadata
  beaches.forEach((beach) => {
    const lastmod = new Date(beach.updated_at).toISOString().split("T")[0];
    const area = areas.find((a) => a.id === beach.area_id);
    const areaSlug = area?.slug || generateAreaSlug(beach.area);
    const priority = calculateBeachPriority(beach);

    sitemap += `<url>
    <loc>${escapeXml(`${SITE_URL}/${areaSlug}/${beach.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority.toFixed(1)}</priority>`;

    // Add comprehensive beach metadata
    const beachFeatures: string[] = [];
    if (beach.blue_flag) beachFeatures.push("Blue Flag certified");
    if (beach.organized) beachFeatures.push("Organized beach");
    if (beach.amenities?.includes("lifeguard")) beachFeatures.push("Lifeguard on duty");
    if (beach.amenities?.includes("family_friendly")) beachFeatures.push("Family-friendly");

    // Add beach type description
    const typeDescription =
      beach.type === "SANDY"
        ? "Sandy beach"
        : beach.type === "PEBBLY"
          ? "Pebble beach"
          : beach.type === "MIXED"
            ? "Mixed sand and pebble beach"
            : "Beach";

    // Add wave conditions
    const waveDescription =
      beach.wave_conditions === "CALM"
        ? "Calm waters"
        : beach.wave_conditions === "MODERATE"
          ? "Moderate waves"
          : beach.wave_conditions === "SURFABLE"
            ? "Good for surfing"
            : "";

    // Create comprehensive beach description
    const beachDescription = [
      beach.name,
      typeDescription,
      `in ${beach.area}, Greece`,
      waveDescription,
      beachFeatures.length > 0 ? `with ${beachFeatures.join(", ")}` : "",
      beach.amenities && beach.amenities.length > 0
        ? `and ${beach.amenities.length} amenities`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Add image metadata if available
    if (beach.photo_url) {
      const imageTitle = generateBeachMetaTitle(beach);
      const imageCaption = beachDescription;

      sitemap += `
    <image:image>
      <image:loc>${escapeXml(beach.photo_url)}</image:loc>
      <image:title>${escapeXml(imageTitle)}</image:title>
      <image:caption>${escapeXml(imageCaption)}</image:caption>`;

      // Add geo location if available (for enhanced image SEO)
      // Note: Could be extended with actual coordinates if available in database

      sitemap += `
    </image:image>`;
    }

    sitemap += `
  </url>
  `;
  });

  sitemap += `</urlset>`;

  return sitemap;
}

async function main() {
  try {
    console.warn("🚀 Generating sitemap for Greek Beaches Directory...");

    // Fetch all active areas from Supabase
    const { data: areas, error: areasError } = await supabase
      .from("areas")
      .select("id, name, slug, description, hero_photo_url, hero_photo_source, status, updated_at")
      .eq("status", "ACTIVE")
      .order("name");

    if (areasError) {
      throw new Error(`Failed to fetch areas: ${areasError.message}`);
    }

    // Fetch all active beaches from Supabase (with additional fields for meta title generation)
    const { data: beaches, error: beachesError } = await supabase
      .from("beaches")
      .select(
        "id, name, slug, description, photo_url, updated_at, status, area, area_id, blue_flag, organized, amenities, type, wave_conditions, latitude, longitude"
      )
      .eq("status", "ACTIVE")
      .order("name");

    if (beachesError) {
      throw new Error(`Failed to fetch beaches: ${beachesError.message}`);
    }

    if (!areas || areas.length === 0) {
      console.warn("⚠️  No areas found in database");
      return;
    }

    if (!beaches || beaches.length === 0) {
      console.warn("⚠️  No beaches found in database");
      return;
    }

    console.warn(`📊 Found ${areas.length} areas and ${beaches.length} active beaches`);

    // Generate sitemap XML
    const sitemapXml = generateSitemap(beaches, areas);

    // Write sitemap to public directory
    const sitemapPath = join(process.cwd(), "public", "sitemap.xml");
    writeFileSync(sitemapPath, sitemapXml, "utf8");

    console.warn(`✅ Comprehensive sitemap generated successfully!`);
    console.warn(`📁 Location: ${sitemapPath}`);
    console.warn(`🔗 URL: ${SITE_URL}/sitemap.xml`);
    console.warn(`📊 Contains ${beaches.length + areas.length + 7} URLs:`);
    console.warn(`   • ${beaches.length} beach detail pages`);
    console.warn(`   • ${areas.length} area overview pages`);
    console.warn(`   • 7 main content pages (homepage, about, map, etc.)`);

    // Enhanced validation
    const urlCount = (sitemapXml.match(/<url>/g) || []).length;
    const imageCount = (sitemapXml.match(/<image:image>/g) || []).length;
    const highPriorityCount = (sitemapXml.match(/<priority>0\.[89]<\/priority>/g) || []).length;
    const mediumPriorityCount = (sitemapXml.match(/<priority>0\.[67]<\/priority>/g) || []).length;

    console.warn(`✅ Validation Results:`);
    console.warn(`   • Total URLs: ${urlCount}`);
    console.warn(`   • URLs with images: ${imageCount}`);
    console.warn(`   • High priority URLs (0.8-0.9): ${highPriorityCount}`);
    console.warn(`   • Medium priority URLs (0.6-0.7): ${mediumPriorityCount}`);
    console.warn(`   • XML namespaces: sitemap, image`);

    // Performance metrics
    const sizeKB = (sitemapXml.length / 1024).toFixed(1);
    console.warn(`📈 Performance: ${sizeKB} KB sitemap size`);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    process.exit(1);
  }
}

// Run the script
main();

export { generateSitemap, main };

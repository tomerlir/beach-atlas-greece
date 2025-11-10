#!/usr/bin/env tsx

/**
 * Dynamic Sitemap Generator for Greek Beaches Directory
 * 
 * This script generates a sitemap.xml file based on the actual beach data
 * from your Supabase database. Run this script to update your sitemap with
 * all current beaches.
 * 
 * Usage:
 *   npm run generate-sitemap
 *   or
 *   tsx scripts/generate-sitemap.ts
 */

import { createClient } from '@supabase/supabase-js';

// Utility function to generate area slug (same as in utils.ts)
const slugify = (input: string | undefined | null): string => {
  if (!input) return 'unknown';
  
  const base = input
    .normalize('NFKD')
    // remove diacritic marks
    .replace(/[\u0300-\u036f]/g, '')
    // keep only ascii letters, numbers, spaces, hyphens, underscores
    .replace(/[^A-Za-z0-9\s_-]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base) return base;
  // Fallback for non-latin names (e.g., Greek-only) → deterministic short id
  const rand = Math.random().toString(36).slice(2, 8);
  return `beach-${rand}`;
};

const generateAreaSlug = (area: string): string => {
  return slugify(area);
};

// XML escaping function to handle special characters
const escapeXml = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

import { writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const SITE_URL = 'https://beachesofgreece.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials. Make sure .env file exists with:');
  console.error('   VITE_SUPABASE_URL=...');
  console.error('   VITE_SUPABASE_PUBLISHABLE_KEY=...');
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
}

interface Area {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hero_photo_url?: string;
  hero_photo_source?: string;
  status: 'DRAFT' | 'HIDDEN' | 'ACTIVE';
  updated_at: string;
}

function generateSitemap(beaches: Beach[], areas: Area[]): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  
  <!-- Main Pages -->
  <url>
    <loc>${escapeXml(SITE_URL)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${escapeXml(`${SITE_URL}/about`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${escapeXml(`${SITE_URL}/areas`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${escapeXml(`${SITE_URL}/map`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${escapeXml(`${SITE_URL}/ontology`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${escapeXml(`${SITE_URL}/faq`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${escapeXml(`${SITE_URL}/guide`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${escapeXml(`${SITE_URL}/privacy`)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Area Pages -->`;

  // Add area pages
  areas.forEach(area => {
    const lastmod = new Date(area.updated_at).toISOString().split('T')[0];
    sitemap += `
  <url>
    <loc>${escapeXml(`${SITE_URL}/${area.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  sitemap += `
  
  <!-- Beach Detail Pages -->`;

  // Add beach pages
  beaches.forEach(beach => {
    const lastmod = new Date(beach.updated_at).toISOString().split('T')[0];
    const area = areas.find(a => a.id === beach.area_id);
    const areaSlug = area?.slug || generateAreaSlug(beach.area);
    
    sitemap += `
  <url>
    <loc>${escapeXml(`${SITE_URL}/${areaSlug}/${beach.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;
    
    // Add image if available
    if (beach.photo_url) {
      sitemap += `
    <image:image>
      <image:loc>${escapeXml(beach.photo_url)}</image:loc>
      <image:title>${escapeXml(beach.name)} - Greek Beach</image:title>
      <image:caption>${escapeXml(beach.description || `Beautiful beach in Greece: ${beach.name}`)}</image:caption>
    </image:image>`;
    }
    
    sitemap += `
  </url>`;
  });

  sitemap += `
  
</urlset>`;

  return sitemap;
}

async function main() {
  try {
    console.warn('🚀 Generating sitemap for Greek Beaches Directory...');
    
    // Fetch all active areas from Supabase
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id, name, slug, description, hero_photo_url, hero_photo_source, status, updated_at')
      .eq('status', 'ACTIVE')
      .order('name');

    if (areasError) {
      throw new Error(`Failed to fetch areas: ${areasError.message}`);
    }

    // Fetch all active beaches from Supabase
    const { data: beaches, error: beachesError } = await supabase
      .from('beaches')
      .select('id, name, slug, description, photo_url, updated_at, status, area, area_id')
      .eq('status', 'ACTIVE')
      .order('name');

    if (beachesError) {
      throw new Error(`Failed to fetch beaches: ${beachesError.message}`);
    }

    if (!areas || areas.length === 0) {
      console.warn('⚠️  No areas found in database');
      return;
    }

    if (!beaches || beaches.length === 0) {
      console.warn('⚠️  No beaches found in database');
      return;
    }

    console.warn(`📊 Found ${areas.length} areas and ${beaches.length} active beaches`);

    // Generate sitemap XML
    const sitemapXml = generateSitemap(beaches, areas);

    // Write sitemap to public directory
    const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml');
    writeFileSync(sitemapPath, sitemapXml, 'utf8');

    console.warn(`✅ Sitemap generated successfully!`);
    console.warn(`📁 Location: ${sitemapPath}`);
    console.warn(`🔗 URL: ${SITE_URL}/sitemap.xml`);
    console.warn(`📄 Contains ${beaches.length + areas.length + 5} URLs (${beaches.length} beaches + ${areas.length} areas + 5 main pages)`);

    // Validate XML structure
    const urlCount = (sitemapXml.match(/<url>/g) || []).length;
    console.warn(`✅ Validation: Found ${urlCount} URL entries in sitemap`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
main();

export { generateSitemap, main };
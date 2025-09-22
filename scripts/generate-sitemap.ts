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
import { writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const SITE_URL = 'https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://xnkyfxvncpawqpqccdby.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_epB4aWmCm1xwnJgnnwvVZQ_8umvX3v2";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Beach {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  updated_at: string;
  status: string;
}

function generateSitemap(beaches: Beach[]): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  
  <!-- Main Pages -->
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Beach Detail Pages -->`;

  // Add beach pages
  beaches.forEach(beach => {
    const lastmod = new Date(beach.updated_at).toISOString().split('T')[0];
    
    sitemap += `
  <url>
    <loc>${SITE_URL}/beach/${beach.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;
    
    // Add image if available
    if (beach.image_url) {
      sitemap += `
    <image:image>
      <image:loc>${beach.image_url}</image:loc>
      <image:title>${beach.name} - Greek Beach</image:title>
      <image:caption>${beach.description || `Beautiful beach in Greece: ${beach.name}`}</image:caption>
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
    console.log('🚀 Generating sitemap for Greek Beaches Directory...');
    
    // Fetch all active beaches from Supabase
    const { data: beaches, error } = await supabase
      .from('beaches')
      .select('id, name, slug, description, image_url, updated_at, status')
      .eq('status', 'ACTIVE')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch beaches: ${error.message}`);
    }

    if (!beaches || beaches.length === 0) {
      console.warn('⚠️  No beaches found in database');
      return;
    }

    console.log(`📊 Found ${beaches.length} active beaches`);

    // Generate sitemap XML
    const sitemapXml = generateSitemap(beaches);

    // Write sitemap to public directory
    const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml');
    writeFileSync(sitemapPath, sitemapXml, 'utf8');

    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📁 Location: ${sitemapPath}`);
    console.log(`🔗 URL: ${SITE_URL}/sitemap.xml`);
    console.log(`📄 Contains ${beaches.length + 2} URLs (${beaches.length} beaches + 2 main pages)`);

    // Validate XML structure
    const urlCount = (sitemapXml.match(/<url>/g) || []).length;
    console.log(`✅ Validation: Found ${urlCount} URL entries in sitemap`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { generateSitemap, main };

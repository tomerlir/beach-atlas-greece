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

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file if it exists
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Utility function to generate area slug (shared with generate-sitemap.ts and utils.ts)
// Note: Keeping local copy to avoid ESM/CommonJS issues in build scripts
const slugify = (input: string | undefined | null): string => {
  if (!input) return 'unknown';
  
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\s_-]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base) return base;
  const rand = Math.random().toString(36).slice(2, 8);
  return `beach-${rand}`;
};

const generateAreaSlug = (area: string): string => {
  return slugify(area);
};

// Configuration
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

// Metadata structure for prerendering (subset of Tables<"beaches"> fields needed for SEO)
interface BeachMetadata {
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

interface RouteData {
  routes: string[];
  beachMetadata: Record<string, BeachMetadata>;
  areaMetadata: Record<string, AreaMetadata>;
}

async function generateRoutes(): Promise<RouteData> {
  const routes: string[] = [];
  const beachMetadata: Record<string, BeachMetadata> = {};
  const areaMetadata: Record<string, AreaMetadata> = {};

  // Add static pages
  routes.push(
    '/',
    '/about',
    '/areas',
    '/map',
    '/ontology',
    '/faq',
    '/guide',
    '/privacy'
  );

  // Fetch all active areas with full data
  const { data: areas, error: areasError } = await supabase
    .from('areas')
    .select('id, name, slug, description, status')
    .eq('status', 'ACTIVE')
    .order('name');

  if (areasError) {
    throw new Error(`Failed to fetch areas: ${areasError.message}`);
  }

  // Fetch all active beaches with SEO-relevant fields
  const { data: beaches, error: beachesError } = await supabase
    .from('beaches')
    .select('id, name, slug, status, area, area_id, blue_flag, amenities, type, wave_conditions, organized, parking, description')
    .eq('status', 'ACTIVE')
    .order('name');

  if (beachesError) {
    throw new Error(`Failed to fetch beaches: ${beachesError.message}`);
  }

  if (!areas || areas.length === 0) {
    console.warn('⚠️  No areas found in database');
  } else {
    // Add area pages and metadata
    areas.forEach(area => {
      const areaBeaches = beaches?.filter(b => b.area_id === area.id) || [];
      routes.push(`/${area.slug}`);
      areaMetadata[`/${area.slug}`] = {
        name: area.name,
        description: area.description,
        beachCount: areaBeaches.length,
      };
    });
  }

  if (!beaches || beaches.length === 0) {
    console.warn('⚠️  No beaches found in database');
  } else {
    // Add beach detail pages and metadata
    beaches.forEach(beach => {
      const area = areas?.find(a => a.id === beach.area_id);
      const areaSlug = area?.slug || generateAreaSlug(beach.area);
      const routePath = `/${areaSlug}/${beach.slug}`;
      
      routes.push(routePath);
      
      // Store metadata for SEO generation
      beachMetadata[routePath] = {
        name: beach.name,
        area: beach.area,
        blue_flag: beach.blue_flag || false,
        amenities: beach.amenities,
        type: beach.type || 'OTHER',
        wave_conditions: beach.wave_conditions || 'MODERATE',
        organized: beach.organized || false,
        parking: beach.parking || 'NONE',
        description: beach.description,
      };
    });
  }

  return {
    routes,
    beachMetadata,
    areaMetadata,
  };
}

async function main() {
  try {
    console.warn('🚀 Generating route list for pre-rendering...');
    
    const data = await generateRoutes();

    if (data.routes.length === 0) {
      console.warn('⚠️  No routes generated');
      return;
    }

    console.warn(`📊 Found ${data.routes.length} routes to pre-render`);
    console.warn(`📊 Collected metadata for ${Object.keys(data.beachMetadata).length} beaches`);
    console.warn(`📊 Collected metadata for ${Object.keys(data.areaMetadata).length} areas`);

    // Write complete data to JSON file (root and src for different uses)
    const dataPath = join(process.cwd(), 'prerender-data.json');
    const srcDataPath = join(process.cwd(), 'src', 'prerender-data.json');
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    writeFileSync(srcDataPath, JSON.stringify(data, null, 2), 'utf8');

    // Also write simple routes array for backwards compatibility
    const routesPath = join(process.cwd(), 'prerender-routes.json');
    writeFileSync(routesPath, JSON.stringify(data.routes, null, 2), 'utf8');

    console.warn(`✅ Routes and metadata generated successfully!`);
    console.warn(`📁 Data location: ${dataPath} and ${srcDataPath}`);
    console.warn(`📁 Routes location: ${routesPath}`);
    console.warn(`📄 Contains ${data.routes.length} routes with full metadata`);

  } catch (error) {
    console.error('❌ Error generating routes:', error);
    process.exit(1);
  }
}

// Run the script
main();

export { generateRoutes, main };


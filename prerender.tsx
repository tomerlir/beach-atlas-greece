// Import your actual SEO generators
import { generateBeachMetaTitle, generateBeachMetaDescription, generateAreaMetaTitle, generateAreaMetaDescription } from './src/lib/seo';
import type { Tables } from './src/integrations/supabase/types';
import type { Area } from './src/types/area';

// Metadata structure matches what's in generate-routes.ts
// Using subset of Tables<"beaches"> fields needed for SEO
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

interface PrerenderData {
  routes: string[];
  beachMetadata: Record<string, BeachMetadata>;
  areaMetadata: Record<string, AreaMetadata>;
}

// Cache for loaded data
let prerenderDataCache: PrerenderData | null = null;

/**
 * Load prerender data - import directly as JSON module
 */
async function loadPrerenderData(): Promise<PrerenderData | null> {
  if (prerenderDataCache) {
    return prerenderDataCache;
  }

  try {
    // Import JSON data directly (Vite handles this)
    const data = await import('./src/prerender-data.json');
    prerenderDataCache = data.default as PrerenderData;
    console.warn(`✅ Loaded prerender data with ${Object.keys(prerenderDataCache!.beachMetadata).length} beaches`);
    return prerenderDataCache;
  } catch (error) {
    console.warn('⚠️  Could not load prerender-data.json:', error);
    return null;
  }
}

/**
 * Prerender function for vite-prerender-plugin
 * 
 * This function generates static HTML shells with proper meta tags for SEO,
 * using your actual SEO generator logic with real beach/area data.
 */
export async function prerender(data: { url: string }) {
  const { url } = data;

  try {
    // Simple HTML shell - the React app will hydrate on the client side
    const html = '<div id="root"></div>';

    // Initialize head elements
    const headElements = new Set();
    let title = 'Beaches of Greece';
    let description = 'Discover the best beaches in Greece with verified data and smart search.';

    // Load prerender data
    const prerenderData = await loadPrerenderData();

    // Generate SEO based on route type and actual data
    if (prerenderData) {
      const beachData = prerenderData.beachMetadata[url];
      const areaData = prerenderData.areaMetadata[url];

      if (beachData) {
        // Beach page - use your actual SEO generator!
        // Cast to partial Tables<"beaches"> with the fields we have
        const beach = beachData as Partial<Tables<'beaches'>> & BeachMetadata;

        title = generateBeachMetaTitle(beach as Tables<'beaches'>);
        description = generateBeachMetaDescription(beach as Tables<'beaches'>);

      } else if (areaData) {
        // Area page - use your area SEO generator!
        const area: Area = {
          id: '', // Not needed for SEO generation
          name: areaData.name,
          slug: url.replace('/', ''),
          description: areaData.description,
          hero_photo_url: null,
          hero_photo_source: null,
          status: 'ACTIVE',
          created_at: null,
          updated_at: null,
        };

        title = generateAreaMetaTitle(area, areaData.beachCount);
        description = areaData.description || generateAreaMetaDescription(area, areaData.beachCount);

      } else {
        // Static pages - use generators where available
        if (url === '/') {
          // Import and use the actual generators
          const { generateHomeMetaTitle, generateHomeMetaDescription } = await import('./src/lib/seo');
          title = generateHomeMetaTitle();
          description = generateHomeMetaDescription();
        } else if (url === '/about') {
          title = 'About Us | Verified Greek Beach Data & Smart Search';
          description = 'Beaches of Greece is a comprehensive platform that helps travelers find the perfect Greek beach through natural language search and verified data.';
        } else if (url === '/areas') {
          title = 'Greek Beach Areas';
          description = 'Browse all Greek beach areas and discover the perfect destination for your beach vacation.';
        } else if (url === '/faq') {
          title = 'Frequently Asked Questions | Beaches of Greece';
          description = 'Common questions about using Beaches of Greece to find your perfect beach in Greece.';
        } else if (url === '/guide') {
          title = 'How to Choose the Perfect Greek Beach | Beaches of Greece';
          description = 'A comprehensive guide to choosing the right beach in Greece based on your preferences.';
        } else if (url === '/privacy') {
          title = 'Privacy Policy | Beaches of Greece';
          description = 'Our privacy policy: cookieless analytics, GDPR compliance, minimal data collection & your rights.';
        }
      }
    } else {
      // Fallback if data file not loaded (should not happen in production)
      console.warn(`No metadata for ${url}, using fallback`);
      if (url.match(/^\/[^/]+\/[^/]+$/)) {
        const parts = url.split('/').filter(Boolean);
        const beachSlug = parts[1]?.replace(/-/g, ' ');
        title = `${beachSlug} Beach | Beaches of Greece`;
        description = `Discover ${beachSlug} beach in Greece with verified information on amenities, parking, and conditions.`;
      } else if (url.match(/^\/[^/]+$/)) {
        const areaSlug = url.split('/').filter(Boolean)[0];
        const areaName = areaSlug?.replace(/-/g, ' ');
        title = `${areaName} Beaches | Greece`;
        description = `Explore verified beaches in ${areaName}, Greece with detailed information on amenities and conditions.`;
      }
    }

    // Add meta tags to head elements
    headElements.add({ 
      type: 'meta', 
      props: { name: 'description', content: description } 
    });
    
    headElements.add({ 
      type: 'meta', 
      props: { property: 'og:title', content: title } 
    });
    
    headElements.add({ 
      type: 'meta', 
      props: { property: 'og:description', content: description } 
    });
    
    headElements.add({ 
      type: 'meta', 
      props: { property: 'og:url', content: `https://beachesofgreece.com${url}` } 
    });
    
    headElements.add({ 
      type: 'meta', 
      props: { name: 'twitter:title', content: title } 
    });
    
    headElements.add({ 
      type: 'meta', 
      props: { name: 'twitter:description', content: description } 
    });
    
    headElements.add({ 
      type: 'link', 
      props: { rel: 'canonical', href: `https://beachesofgreece.com${url}` } 
    });

    return {
      html,
      head: {
        lang: 'en',
        title: title,
        elements: headElements,
      },
    };
  } catch (error) {
    console.error(`Error prerendering ${url}:`, error);
    // Return minimal HTML on error to prevent build failure
    return {
      html: '<div id="root"></div>',
      head: {
        lang: 'en',
        title: 'Beaches of Greece',
      },
    };
  }
}

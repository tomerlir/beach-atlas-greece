/**
 * Structured Data Utilities for Beach Atlas Greece
 *
 * Provides optimized schema.org markup for beaches, areas, and tourism content
 * following Google's guidelines for rich results and AI understanding.
 */

import { Tables } from "@/integrations/supabase/types";
import type { Area } from "@/types/area";
import { generateAreaSlug, slugify } from "@/lib/utils";

type Beach = Tables<"beaches">;

const BASE_URL = "https://beachesofgreece.com";

function cleanText(value: string | null | undefined, fallback = "") {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}

function getBeachSlug(beach: Beach) {
  const slug = typeof beach.slug === "string" ? beach.slug.trim() : "";
  if (slug.length > 0) {
    return slug;
  }
  return slugify(cleanText(beach.name, "beach"));
}

function buildBeachCanonicalUrl(beach: Beach, areaOverride?: string) {
  const areaInput = cleanText(areaOverride || beach.area, "unknown-area");
  const areaSlug = generateAreaSlug(areaInput);
  const beachSlug = getBeachSlug(beach);
  return `${BASE_URL}/${areaSlug}/${beachSlug}`;
}

/**
 * Generate comprehensive Beach schema
 * Uses Beach as primary type (subtype of Place) with TouristAttraction as secondary type
 * This is more specific and semantically accurate than using Place as the base type
 */
export function generateBeachPlaceSchema(beach: Beach, canonicalUrl: string) {
  // Use Beach as the primary type - it's a subtype of Place, so it inherits all Place properties
  // Add TouristAttraction as a secondary type since beaches are tourist destinations
  // This is more specific and semantically accurate than using Place as the base type
  const schemaTypes = ["Beach", "TouristAttraction"];
  const beachName = cleanText(beach.name, "Unnamed Beach");
  const beachArea = cleanText(beach.area, "Greece");

  // Convert amenities to structured format
  const amenityFeatures = generateAmenityFeatures(beach.amenities || []);

  // Generate comprehensive place schema
  const placeSchema = {
    "@type": schemaTypes,
    "@id": canonicalUrl,
    name: beachName,
    alternateName: beachName, // Could be expanded with local names
    description: beach.description || generateBeachDescription(beach),
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: beachArea,
      addressRegion: beachArea,
      addressCountry: "GR",
    },
    // Geo coordinates - only include if both are available
    ...(beach.latitude &&
      beach.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: beach.latitude,
          longitude: beach.longitude,
        },
      }),
    // Tourism-specific properties
    touristType: "Beach Goer",
    isAccessibleForFree: !beach.amenities?.some((amenity) =>
      ["sunbeds", "umbrellas"].includes(amenity)
    ), // Free entry, paid amenities
    // Image - only include if available
    ...(beach.photo_url && {
      image: [
        {
          "@type": "ImageObject",
          url: beach.photo_url,
          name: `Beach photo of ${beach.name}`,
          caption: generateBeachImageCaption(beach),
          // Could add width, height, license info if available
        },
      ],
    }),
    // Comprehensive amenity features
    amenityFeature: amenityFeatures,
    // Additional beach-specific properties
    additionalProperty: generateBeachProperties(beach),
    // Rating/review data - omitted until reviews are implemented
    // Opening hours for organized beaches - only include if organized
    ...(beach.organized && {
      openingHoursSpecification: generateBeachHours(beach),
    }),
    // Keywords for better categorization
    keywords: generateBeachKeywords(beach),
  };

  return placeSchema;
}

/**
 * Generate amenity features in proper schema.org format
 */
function generateAmenityFeatures(amenities: string[]) {
  const amenityMapping: Record<string, { name: string; category: string }> = {
    lifeguard: { name: "Lifeguard", category: "Safety" },
    beach_bar: { name: "Beach Bar", category: "Food & Drink" },
    taverna: { name: "Taverna", category: "Food & Drink" },
    sunbeds: { name: "Sunbeds", category: "Comfort" },
    umbrellas: { name: "Umbrellas", category: "Comfort" },
    water_sports: { name: "Water Sports", category: "Activities" },
    snorkeling: { name: "Snorkeling", category: "Activities" },
    family_friendly: { name: "Family Friendly", category: "Accessibility" },
    showers: { name: "Showers", category: "Facilities" },
    toilets: { name: "Toilets", category: "Facilities" },
    parking: { name: "Parking", category: "Access" },
  };

  return amenities
    .map((amenity) => {
      const mapping = amenityMapping[amenity];
      if (!mapping) return null;
      return {
        "@type": "LocationFeatureSpecification",
        name: mapping.name,
        category: mapping.category,
        value: true,
      };
    })
    .filter(
      (feature): feature is { "@type": string; name: string; category: string; value: boolean } => {
        return feature !== null;
      }
    );
}

/**
 * Generate beach-specific properties
 */
type PropertyValueSchema = {
  "@type": "PropertyValue";
  name: string;
  value: string | boolean;
};

function generateBeachProperties(beach: Beach) {
  const properties: PropertyValueSchema[] = [
    {
      "@type": "PropertyValue",
      name: "Beach Type",
      value: beach.type,
    },
    {
      "@type": "PropertyValue",
      name: "Wave Conditions",
      value: beach.wave_conditions,
    },
    {
      "@type": "PropertyValue",
      name: "Organization Status",
      value: beach.organized ? "Organized" : "Unorganized",
    },
  ];

  if (beach.parking) {
    properties.push({
      "@type": "PropertyValue",
      name: "Parking",
      value: beach.parking,
    });
  }

  if (beach.blue_flag) {
    properties.push({
      "@type": "PropertyValue",
      name: "Blue Flag Certified",
      value: true,
    });
  }

  return properties;
}

/**
 * Generate opening hours for beaches
 */
function generateBeachHours(_beach: Beach) {
  // Most Greek beaches are seasonal and don't have specific hours
  // This is a basic implementation that could be expanded
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "20:00",
      description: "Seasonal hours - typically open during daylight hours",
    },
  ];
}

/**
 * Generate keywords for better search categorization
 */
function generateBeachKeywords(beach: Beach) {
  const keywords = [
    "beach",
    "Greece",
    beach.area.toLowerCase(),
    beach.type.toLowerCase(),
    beach.wave_conditions.toLowerCase(),
  ];

  if (beach.blue_flag) keywords.push("blue flag");
  if (beach.organized) keywords.push("organized");
  if (beach.amenities?.includes("family_friendly")) keywords.push("family friendly");
  if (beach.amenities?.includes("lifeguard")) keywords.push("lifeguard");

  return keywords;
}

/**
 * Generate beach description if not available
 */
function generateBeachDescription(beach: Beach) {
  const parts = [
    `${beach.name} is a ${beach.type.toLowerCase()} beach located in ${beach.area}, Greece.`,
  ];

  if (beach.blue_flag) {
    parts.push(
      "It is certified with the prestigious Blue Flag for water quality and environmental standards."
    );
  }

  if (beach.organized) {
    parts.push("This organized beach offers various amenities and facilities.");
  }

  if (beach.amenities && beach.amenities.length > 0) {
    const amenityNames = beach.amenities.map((amenity) =>
      amenity.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
    parts.push(`Amenities include: ${amenityNames.join(", ")}.`);
  }

  return parts.join(" ");
}

/**
 * Generate image caption for beach photos
 */
function generateBeachImageCaption(beach: Beach) {
  return `${beach.name} beach in ${beach.area}, Greece - ${beach.type.toLowerCase()} beach with ${beach.wave_conditions.toLowerCase()} waves`;
}

/**
 * Generate complete WebPage schema with Place as main entity
 */
export function generateBeachWebPageSchema(beach: Beach, canonicalUrl: string) {
  const beachName = cleanText(beach.name, "Unnamed Beach");
  const beachArea = cleanText(beach.area, "Greece");

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    name: `${beachName} - ${beachArea} | Greek Beaches`,
    description: generateBeachDescription(beach),
    url: canonicalUrl,
    datePublished: beach.created_at
      ? new Date(beach.created_at).toISOString().split("T")[0]
      : "2024-01-01",
    dateModified: beach.updated_at
      ? new Date(beach.updated_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    mainEntity: generateBeachPlaceSchema(beach, canonicalUrl),
    // Add breadcrumb structured data
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://beachesofgreece.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Areas",
          item: "https://beachesofgreece.com/areas",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: beachArea,
          item: `https://beachesofgreece.com/${generateAreaSlug(beachArea)}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: beach.name,
          item: canonicalUrl,
        },
      ],
    },
  };
}

/**
 * Generate area/collection page schema
 */
export function generateAreaWebPageSchema(area: Area, beaches: Beach[], canonicalUrl: string) {
  const areaSlugOverride = area.slug || area.name;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    name: `${area.name} Beaches | Greek Beaches`,
    description: area.description || `Explore beaches in ${area.name}, Greece`,
    url: canonicalUrl,
    datePublished: area.created_at
      ? new Date(area.created_at).toISOString().split("T")[0]
      : "2024-01-01",
    dateModified: area.updated_at
      ? new Date(area.updated_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    mainEntity: {
      "@type": "ItemList",
      name: `Beaches in ${area.name}`,
      description: `Curated collection of ${beaches.length} beaches in ${area.name}, Greece`,
      numberOfItems: beaches.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: beaches.slice(0, 20).map((beach, index) => {
        const beachCanonical = buildBeachCanonicalUrl(beach, areaSlugOverride || beach.area);
        return {
          "@type": "ListItem",
          position: index + 1,
          item: generateBeachPlaceSchema(beach, beachCanonical),
        };
      }),
    },
    // Breadcrumb structured data
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://beachesofgreece.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Areas",
          item: "https://beachesofgreece.com/areas",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: area.name,
          item: canonicalUrl,
        },
      ],
    },
  };
}

/**
 * Generate homepage schema with collection overview
 */
export function generateHomeWebPageSchema(beaches: Beach[]) {
  const canonicalUrl = BASE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    name: "Find Greek Beaches by Area & Amenities | Smart Search",
    description:
      "Tired of beach disappointment? Our verified data & AI search finds beaches matching YOUR needs - calm waters, parking, facilities. No more guesswork.",
    url: canonicalUrl,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    mainEntity: {
      "@type": "ItemList",
      name: "Greek Beaches Directory",
      description: "Comprehensive directory of beaches across Greece",
      numberOfItems: beaches.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: beaches.slice(0, 20).map((beach, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: generateBeachPlaceSchema(beach, buildBeachCanonicalUrl(beach)),
      })),
    },
  };
}

/**
 * Generate Map page schema with ItemList of beaches
 */
export function generateMapWebPageSchema(beaches: Beach[], canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    name: "Map of Greek Beaches - Explore on an Interactive Map",
    description:
      "Explore Greek beaches on an interactive map. Use powerful search and filters to find exactly what you want, then zoom to matching beaches automatically.",
    url: canonicalUrl,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    mainEntity: {
      "@type": "ItemList",
      name: "Greek Beaches on Map",
      description: "Interactive map showing beaches across Greece",
      numberOfItems: beaches.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: beaches.slice(0, 20).map((beach, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: generateBeachPlaceSchema(beach, buildBeachCanonicalUrl(beach)),
      })),
    },
  };
}

/**
 * Structured Data Utilities for Beach Atlas Greece
 *
 * Provides optimized schema.org markup for beaches, areas, and tourism content
 * following Google's guidelines for rich results and AI understanding.
 */

import { Tables } from "@/integrations/supabase/types";
import type { Area } from "@/types/area";

type Beach = Tables<"beaches">;

/**
 * Generate comprehensive Place schema for a beach
 * Uses Place as base type with tourism-specific extensions
 */
export function generateBeachPlaceSchema(beach: Beach, canonicalUrl: string) {
  // Determine the most appropriate schema type based on beach characteristics
  const isCommercial =
    beach.organized &&
    (beach.amenities?.includes("beach_bar") || beach.amenities?.includes("taverna"));
  const hasActivities = beach.amenities?.some((amenity) =>
    ["water_sports", "snorkeling", "cliff_jumping"].includes(amenity)
  );

  let schemaType = "Place";
  const additionalTypes: string[] = [];

  if (isCommercial) {
    schemaType = "LocalBusiness";
    additionalTypes.push("https://schema.org/TouristAttraction");
  } else if (hasActivities) {
    schemaType = "SportsActivityLocation";
    additionalTypes.push("https://schema.org/TouristAttraction");
  } else {
    additionalTypes.push("https://schema.org/TouristAttraction");
  }

  // Add beach-specific type
  additionalTypes.push("https://schema.org/Beach");

  // Convert amenities to structured format
  const amenityFeatures = generateAmenityFeatures(beach.amenities || []);

  // Generate comprehensive place schema
  const placeSchema = {
    "@type": schemaType,
    "@id": canonicalUrl,
    name: beach.name,
    alternateName: beach.name, // Could be expanded with local names
    description: beach.description || generateBeachDescription(beach),
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: beach.area,
      addressRegion: beach.area,
      addressCountry: "GR",
      // Could add streetAddress if available
    },
    // Geo coordinates - only include if both are available
    ...(beach.latitude && beach.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: beach.latitude,
        longitude: beach.longitude,
      },
    }),
    // For LocalBusiness type beaches
    ...(schemaType === "LocalBusiness" && {
      priceRange: "$$", // Beach amenities are typically affordable
      paymentAccepted: ["Cash", "Credit Card"],
      currenciesAccepted: "EUR",
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
    // Add additional types
    additionalType: additionalTypes,
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

  return amenities.map((amenity) => {
    const mapping = amenityMapping[amenity];
    return {
      "@type": "LocationFeatureSpecification",
      name: mapping?.name || amenity,
      category: mapping?.category || "Facility",
      value: true,
    };
  });
}

/**
 * Generate beach-specific properties
 */
function generateBeachProperties(beach: Beach) {
  const properties = [
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
      value: "Yes",
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
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    name: `${beach.name} - ${beach.area} | Greek Beaches`,
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
          name: beach.area,
          item: `https://beachesofgreece.com/${beach.area.toLowerCase().replace(/\s+/g, "-")}`,
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
      itemListElement: beaches.slice(0, 20).map((beach, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: generateBeachPlaceSchema(beach, `${canonicalUrl}/${beach.slug}`),
      })),
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
  const canonicalUrl = "https://beachesofgreece.com";

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
        item: generateBeachPlaceSchema(
          beach,
          `https://beachesofgreece.com/${beach.area.toLowerCase().replace(/\s+/g, "-")}/${beach.slug}`
        ),
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
        item: generateBeachPlaceSchema(
          beach,
          `https://beachesofgreece.com/${beach.area.toLowerCase().replace(/\s+/g, "-")}/${beach.slug}`
        ),
      })),
    },
  };
}

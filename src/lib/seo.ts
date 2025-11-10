/**
 * SEO Meta Title & Description Generator
 *
 * Generates benefit-focused, conversion-optimized meta tags for beaches and areas
 * based on attribute hierarchy and SEO best practices.
 *
 * Best Practices:
 * - Title Length: 50-60 characters (max 70)
 * - Description Length: 150-160 characters (max 170)
 * - Include keywords naturally
 * - Highlight unique benefits
 * - Include platform USPs
 */

import { Tables } from "@/integrations/supabase/types";
import type { Area } from "@/types/area";

type Beach = Tables<"beaches">;

/**
 * Attribute Priority Hierarchy for SEO:
 * 1. Blue Flag (prestigious certification)
 * 2. Family Friendly (broad appeal)
 * 3. Beach Type (SANDY > MIXED > PEBBLY)
 * 4. Wave Conditions (CALM for families, SURFABLE for surfers)
 * 5. Organization Status (organized = more services)
 * 6. Top Amenities (lifeguard, beach_bar, taverna, sunbeds)
 * 7. Parking (practical necessity)
 * 8. Activities (snorkeling, water_sports, cliff_jumping)
 */

// Beach type labels for natural language
const beachTypeLabels: Record<string, string> = {
  SANDY: "Sandy",
  PEBBLY: "Pebble",
  MIXED: "Mixed Sand",
  OTHER: "Unique",
};

// Wave condition labels - simple, search-friendly terms
const waveLabels: Record<string, string> = {
  CALM: "Calm Water",
  MODERATE: "Some Waves",
  WAVY: "Big Waves",
  SURFABLE: "Surfing Waves",
};

/**
 * Get top priority amenities for a beach
 */
function getTopAmenities(amenities: string[] | null): string[] {
  if (!amenities || amenities.length === 0) return [];

  // Priority order for SEO mentions
  const priorityOrder = [
    "lifeguard",
    "family_friendly",
    "beach_bar",
    "taverna",
    "sunbeds",
    "water_sports",
    "snorkeling",
    "umbrellas",
    "showers",
  ];

  return priorityOrder.filter((amenity) => amenities.includes(amenity)).slice(0, 3);
}

/**
 * Get amenity display name for SEO
 */
function getAmenityDisplayName(amenity: string): string {
  const displayNames: Record<string, string> = {
    lifeguard: "Lifeguard",
    family_friendly: "Family-Friendly",
    beach_bar: "Beach Bar",
    taverna: "Taverna",
    sunbeds: "Sunbeds",
    water_sports: "Water Sports",
    snorkeling: "Snorkeling",
    umbrellas: "Umbrellas",
    showers: "Showers",
    toilets: "Facilities",
    food: "Food",
    music: "Entertainment",
  };

  return displayNames[amenity] || amenity;
}

/**
 * Generate benefit-focused meta title for a beach
 * Target: 50-60 characters
 */
export function generateBeachMetaTitle(beach: Beach): string {
  const parts: string[] = [];
  const maxLength = 60;

  // Always start with beach name (trim to remove any leading/trailing spaces)
  const beachName = beach.name.trim();
  parts.push(beachName);

  // Build benefit descriptors based on priority
  const benefits: string[] = [];

  // Priority 1: Blue Flag
  if (beach.blue_flag) {
    benefits.push("Blue Flag");
  }

  // Priority 2: Family Friendly
  if (beach.amenities?.includes("family_friendly")) {
    benefits.push("Family Beach");
  }

  // Priority 3: Beach Type (if sandy or interesting)
  if (beach.type === "SANDY" && !benefits.length) {
    benefits.push("Sandy Beach");
  }

  // Priority 4: Wave Conditions (if notable) - using simple search terms
  if (beach.wave_conditions === "CALM" && !benefits.includes("Family Beach")) {
    benefits.push("Calm Water");
  } else if (beach.wave_conditions === "SURFABLE") {
    benefits.push("Good for Surfing");
  }

  // Priority 5: Organization status (if organized and space allows)
  if (beach.organized && benefits.length < 2) {
    benefits.push("Organized");
  }

  // Priority 6: Top amenity (if space allows)
  if (benefits.length < 2) {
    const topAmenities = getTopAmenities(beach.amenities);
    if (topAmenities.length > 0 && !benefits.includes("Family Beach")) {
      const amenity = getAmenityDisplayName(topAmenities[0]);
      if (amenity !== "Family-Friendly") {
        benefits.push(amenity);
      }
    }
  }

  // Construct title with area
  let title = beachName;

  if (benefits.length > 0) {
    const benefitStr = benefits.slice(0, 2).join(" · ");
    title = `${beachName}: ${benefitStr}`;
  }

  // Add location context if space allows (trim area too)
  const areaName = beach.area.trim();
  const withArea = `${title} | ${areaName}`;
  if (withArea.length <= maxLength) {
    title = withArea;
  } else {
    // Try shorter version with just area
    const shortArea = `${beachName} | ${areaName}`;
    if (shortArea.length <= maxLength) {
      title = shortArea;
    }
  }

  return title;
}

/**
 * Generate benefit-focused meta description for a beach
 * Target: 150-160 characters
 */
export function generateBeachMetaDescription(beach: Beach): string {
  const maxLength = 160;
  const parts: string[] = [];

  // Start with action verb + beach name + location (trim spaces)
  const beachName = beach.name.trim();
  const areaName = beach.area.trim();
  parts.push(`Discover ${beachName} in ${areaName}`);

  // Build attribute list based on priority
  const attributes: string[] = [];

  // Blue Flag
  if (beach.blue_flag) {
    attributes.push("Blue Flag certified");
  }

  // Beach type + wave conditions combo - using simple, natural language
  const beachType = beachTypeLabels[beach.type] || beach.type.toLowerCase();
  const waveDesc = waveLabels[beach.wave_conditions] || beach.wave_conditions.toLowerCase();

  if (beach.type === "SANDY" || beach.type === "PEBBLY") {
    attributes.push(`${beachType.toLowerCase()} beach with ${waveDesc.toLowerCase()}`);
  } else {
    attributes.push(waveDesc.toLowerCase());
  }

  // Organization status + key amenities
  if (beach.organized) {
    const topAmenities = getTopAmenities(beach.amenities);
    if (topAmenities.length > 0) {
      const amenityNames = topAmenities
        .slice(0, 2)
        .map(getAmenityDisplayName)
        .map((name) => name.toLowerCase());
      attributes.push(`${amenityNames.join(" & ")}`);
    } else {
      attributes.push("full amenities");
    }
  }

  // Parking (if good parking available) - using simple language people search with
  if (beach.parking === "LARGE_LOT") {
    attributes.push("big parking lot");
  } else if (beach.parking === "SMALL_LOT") {
    attributes.push("parking available");
  }

  // Construct description
  let description = `${parts[0]} - ${attributes.slice(0, 3).join(", ")}.`;

  // Add call to action with platform USP if space allows
  const cta = " Verified data.";
  if (description.length + cta.length <= maxLength) {
    description += cta;
  } else {
    // Try shorter CTA
    const shortCta = " Verified data.";
    if (description.length + shortCta.length <= maxLength) {
      description += shortCta;
    }
  }

  // Clean up any double spaces and trim
  description = description.replace(/\s+/g, " ").trim();

  return description;
}

/**
 * Generate meta title for an area page
 * Target: 50-60 characters
 */
export function generateAreaMetaTitle(area: Area, beachCount?: number): string {
  const maxLength = 60;

  // Base title (trim area name)
  const areaName = area.name.trim();
  let title = `${areaName} Beaches`;

  // Add beach count if available and space allows
  if (beachCount && beachCount > 0) {
    const withCount = `${beachCount}+ Beaches in ${areaName}`;
    if (withCount.length <= maxLength) {
      title = withCount;
    }
  }

  // Add location context
  const withGreece = `${title} | Greece`;
  if (withGreece.length <= maxLength) {
    return withGreece.trim();
  }

  return title.trim();
}

/**
 * Generate meta description for an area page
 * Target: 150-160 characters
 */
export function generateAreaMetaDescription(area: Area, beachCount?: number): string {
  const maxLength = 160;
  const areaName = area.name.trim();

  // Use custom description if available (trim it)
  if (
    area.description &&
    area.description.trim().length > 0 &&
    area.description.trim().length <= maxLength
  ) {
    return area.description.trim();
  }

  // Generate description
  const countStr = beachCount ? `${beachCount}+ ` : "";
  let description = `Explore ${countStr}verified beaches in ${areaName}, Greece. `;

  // Add benefits
  const benefits =
    "Find sandy & pebble beaches with detailed info on amenities, parking & wave conditions.";

  if (description.length + benefits.length <= maxLength) {
    description += benefits;
  } else {
    // Shorter version
    const shortBenefits = "Detailed info on amenities, parking & conditions.";
    if (description.length + shortBenefits.length <= maxLength) {
      description += shortBenefits;
    }
  }

  // Clean up any double spaces and trim
  description = description.replace(/\s+/g, " ").trim();

  return description;
}

/**
 * Generate meta title for homepage
 */
export function generateHomeMetaTitle(): string {
  return "Find Your Perfect Greek Beach - Verified Data & Smart Search";
}

/**
 * Generate meta description for homepage
 */
export function generateHomeMetaDescription(beachCount?: number): string {
  return "Tired of beach disappointment? Our verified data & AI search finds beaches matching YOUR needs - calm waters, parking, facilities. No more guesswork.";
}

/**
 * Truncate text to max length while preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Validate meta title length
 */
export function isValidTitleLength(title: string): boolean {
  return title.length >= 30 && title.length <= 70;
}

/**
 * Validate meta description length
 */
export function isValidDescriptionLength(description: string): boolean {
  return description.length >= 120 && description.length <= 170;
}

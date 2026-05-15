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
import { generateBeachMetaTitle as _generateBeachMetaTitle } from "./seo-utils";

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
// Re-export the shared meta title generator
export const generateBeachMetaTitle = _generateBeachMetaTitle;

/**
 * Select contextual action verb based on beach attributes
 * This creates natural variety in search results and matches user intent
 */
function selectActionVerb(beach: Beach): string {
  // Family-friendly beaches → "Discover" (welcoming, safe)
  if (beach.amenities?.includes("family_friendly")) {
    return "Discover";
  }

  // Blue Flag certified → "Visit" (credible, trustworthy)
  if (beach.blue_flag) {
    return "Visit";
  }

  // Organized with amenities → "Experience" (luxury, full-service)
  if (beach.organized && beach.amenities && beach.amenities.length >= 3) {
    return "Experience";
  }

  // Remote/unorganized → "Explore" (adventure, discovery)
  if (!beach.organized) {
    return "Explore";
  }

  // Unique features (snorkeling, cliff jumping, surfable) → "Find" (specific activity)
  if (
    beach.amenities?.some((a) => ["snorkeling", "cliff_jumping", "water_sports"].includes(a)) ||
    beach.wave_conditions === "SURFABLE"
  ) {
    return "Find";
  }

  // Default fallback → "Discover" (neutral, positive)
  return "Discover";
}

/**
 * Generate benefit-focused meta description for a beach
 * Target: 150-160 characters
 */
export function generateBeachMetaDescription(beach: Beach): string {
  const maxLength = 160;
  const parts: string[] = [];

  // Start with contextual action verb + beach name + location (trim spaces)
  const actionVerb = selectActionVerb(beach);
  const beachName = beach.name.trim();
  const areaName = beach.area.trim();
  parts.push(`${actionVerb} ${beachName} in ${areaName}`);

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

  // Append the richest suffix that still fits maxLength. Sparse beaches (no
  // Blue Flag, not organized, basic type) used to produce 60-80 char meta
  // descriptions that Ahrefs flagged as too short. The tiered fallback fills
  // the snippet space (target ~140-155) without exceeding 160.
  const suffixes = [
    " Plan your visit with verified info on amenities, parking, wave conditions and what to expect.",
    " Plan your visit with verified parking, amenities & wave conditions.",
    " Verified parking, amenities & wave conditions.",
    " Verified data.",
  ];
  for (const suffix of suffixes) {
    if (description.length + suffix.length <= maxLength) {
      description += suffix;
      break;
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

  // Use custom editorial description when available. If it fits, keep it as-is.
  // If it's too long, smart-truncate at a clean sentence/clause boundary so we
  // preserve the regional flavor rather than falling through to the generic
  // template. Only fall back to the template when no clean truncation exists.
  const editorial = area.description?.trim() ?? "";
  if (editorial.length > 0) {
    if (editorial.length <= maxLength) return editorial;
    const truncated = smartTruncateForMeta(editorial, maxLength);
    if (truncated) return truncated;
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
 * Target: 50-60 characters
 */
export function generateHomeMetaTitle(): string {
  return "Find Greek Beaches by Area & Amenities | Smart Search";
}

/**
 * Generate meta description for homepage
 */
export function generateHomeMetaDescription(): string {
  return "Tired of beach disappointment? Our verified data & AI search finds beaches matching YOUR needs - calm waters, parking, facilities. No more guesswork.";
}

/**
 * Smart-truncate a description for use as a meta description. Tries clean
 * boundaries in priority order: sentence ending, then clause ending. Returns
 * null if no boundary lands the result in [minLength, maxLength] — caller
 * should then fall back to a generated template (which is region-aware and
 * search-friendly, so a better outcome than an awkward word-boundary cut).
 *
 * The output ends with `.` (sentence cut keeps existing period; clause cut
 * replaces trailing `,` / `;` with `.`). Word-boundary fallback is intentionally
 * NOT used — `centered at…` reads worse than a clean templated description.
 */
function smartTruncateForMeta(text: string, maxLength: number, minLength = 110): string | null {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);

  // Sentence boundary: keep up to and including the period.
  const lastSentence = slice.lastIndexOf(". ");
  if (lastSentence !== -1 && lastSentence + 1 >= minLength) {
    return slice.slice(0, lastSentence + 1);
  }

  // Clause boundary: replace the trailing `,` / `;` with `.`.
  const lastClause = Math.max(slice.lastIndexOf(", "), slice.lastIndexOf("; "));
  if (lastClause !== -1 && lastClause + 1 >= minLength) {
    return slice.slice(0, lastClause) + ".";
  }

  return null;
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

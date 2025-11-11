import { Tables } from "@/integrations/supabase/types";

type Beach = Tables<"beaches">;

/**
 * Get top priority amenities for a beach
 */
function getTopAmenities(amenities: string[] | null): string[] {
  if (!amenities) return [];

  const priorityOrder = [
    "lifeguard",
    "beach_bar",
    "taverna",
    "sunbeds",
    "umbrellas",
    "water_sports",
    "snorkeling",
    "family_friendly",
  ];

  return priorityOrder.filter((amenity) => amenities.includes(amenity));
}

/**
 * Get display name for amenity
 */
function getAmenityDisplayName(amenity: string): string {
  const displayNames: Record<string, string> = {
    lifeguard: "Lifeguard",
    beach_bar: "Beach Bar",
    taverna: "Taverna",
    sunbeds: "Sunbeds",
    umbrellas: "Umbrellas",
    water_sports: "Water Sports",
    snorkeling: "Snorkeling",
    family_friendly: "Family-Friendly",
  };

  return displayNames[amenity] || amenity;
}

/**
 * Generate dynamic meta title for beach pages based on attribute hierarchy
 * Shared utility for both frontend and build scripts
 */
export function generateBeachMetaTitle(beach: Beach): string {
  const maxLength = 60;
  const beachName = beach.name.trim();
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

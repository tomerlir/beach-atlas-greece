import { FilterState } from "@/hooks/useUrlState";
import { getAmenityLabel } from "@/lib/amenities";
import { getParkingNaturalLabel, ParkingType } from "@/types/common";

const waveConditionLabels: Record<string, string> = {
  CALM: "calm waters",
  MODERATE: "moderate waves",
  WAVY: "wavy conditions",
  SURFABLE: "surfable waves",
};

const beachTypeLabels: Record<string, string> = {
  SANDY: "sandy",
  PEBBLY: "pebbly",
  MIXED: "mixed sand & pebbles",
  OTHER: "rocky",
};

// Capitalize each word in a location string, preserving hyphenated parts
const capitalizeLocation = (str: string): string => {
  return str
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-")
    )
    .join(" ");
};

// Helper function to format list with proper Oxford commas
const formatList = (items: string[], conjunction = "and"): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
};

// Exported pure function for testing explainable picks outside the component
export function generateResultsExplanation(
  filters: FilterState,
  resultCount: number,
  userLocation: GeolocationPosition | null
): string[] {
  const hasActiveFilters =
    filters.search ||
    filters.location ||
    (filters.locations && filters.locations.length > 0) ||
    filters.organized.length > 0 ||
    filters.blueFlag ||
    filters.parking.length > 0 ||
    filters.amenities.length > 0 ||
    filters.waveConditions.length > 0 ||
    filters.type.length > 0;

  const generateNaturalExplanation = () => {
    const parts: string[] = [];

    if (!hasActiveFilters && resultCount > 0) {
      return ["showing all available beaches"];
    }

    if (!hasActiveFilters && resultCount === 0) {
      return ["no beaches found"];
    }

    if (filters.search) {
      const searchTerm = capitalizeLocation(filters.search);
      parts.push(`in ${searchTerm}`);
    }

    if (filters.nearMe && userLocation) {
      if (filters.search) {
        parts[0] = `near ${capitalizeLocation(filters.search)}`;
      } else {
        parts.push("near your current location");
      }
    }

    if (filters.type.length > 0) {
      const types = filters.type.map((type) => beachTypeLabels[type] || type.toLowerCase());
      if (types.length === 1) {
        parts.push(`with ${types[0]} shores`);
      } else {
        parts.push(`with ${formatList(types)} shores`);
      }
    }

    if (filters.waveConditions.length > 0) {
      const conditions = filters.waveConditions.map(
        (condition) => waveConditionLabels[condition] || condition.toLowerCase()
      );
      if (conditions.length === 1) {
        parts.push(`featuring ${conditions[0]}`);
      } else {
        parts.push(`with ${formatList(conditions, "or")}`);
      }
    }

    if (filters.parking.length > 0) {
      const parkingTypes = filters.parking.map(
        (parking) => getParkingNaturalLabel(parking as ParkingType) || parking.toLowerCase()
      );
      if (parkingTypes.includes("no parking")) {
        parts.push("no parking available");
      } else if (parkingTypes.length === 1) {
        parts.push(`with ${parkingTypes[0]}`);
      } else {
        parts.push(`with ${formatList(parkingTypes, "or")}`);
      }
    }

    if (filters.amenities.length > 0) {
      const amenityLabels = filters.amenities.map((amenity) => getAmenityLabel(amenity));
      const essentialAmenities = amenityLabels.filter((amenity) =>
        ["toilets", "showers", "lifeguard"].includes(amenity.toLowerCase())
      );
      const leisureAmenities = amenityLabels.filter((amenity) =>
        ["beach bar", "taverna", "food", "sunbeds", "umbrellas"].includes(amenity.toLowerCase())
      );
      const activityAmenities = amenityLabels.filter((amenity) =>
        ["snorkeling", "water sports", "fishing", "hiking", "cliff jumping", "boat trips"].includes(
          amenity.toLowerCase()
        )
      );

      if (essentialAmenities.length > 0) {
        parts.push(`with ${formatList(essentialAmenities)}`);
      }
      if (leisureAmenities.length > 0) {
        parts.push(`offering ${formatList(leisureAmenities)}`);
      }
      if (activityAmenities.length > 0) {
        parts.push(`perfect for ${formatList(activityAmenities)}`);
      }
      if (
        essentialAmenities.length === 0 &&
        leisureAmenities.length === 0 &&
        activityAmenities.length === 0
      ) {
        const firstThree = amenityLabels.slice(0, 3);
        parts.push(`with ${formatList(firstThree)}${amenityLabels.length > 3 ? " and more" : ""}`);
      }
    }

    if (filters.blueFlag) {
      parts.push("Blue Flag certified for quality");
    }

    if (filters.organized.length > 0) {
      const organizedTypes = filters.organized.map((org) =>
        org === "organized" ? "well-organized" : "natural and unspoiled"
      );
      if (organizedTypes.length === 1) {
        parts.push(organizedTypes[0]);
      } else {
        parts.push(`either ${formatList(organizedTypes, "or")}`);
      }
    }

    return parts;
  };

  const allParts = generateNaturalExplanation();
  if (allParts.length === 0) {
    return resultCount > 0 ? ["all beaches"] : ["no beaches"];
  }
  if (allParts.length <= 2) {
    return allParts;
  }

  const prioritizedParts = [...allParts];
  const locationIndex = prioritizedParts.findIndex(
    (part) => part.startsWith("in ") || part.startsWith("near ")
  );
  const typeIndex = prioritizedParts.findIndex((part) => part.includes("shores"));
  const optimized: string[] = [];

  if (locationIndex !== -1) {
    optimized.push(prioritizedParts[locationIndex]);
  }
  if (typeIndex !== -1 && typeIndex !== locationIndex) {
    optimized.push(prioritizedParts[typeIndex]);
  }

  const blueFlagIndex = prioritizedParts.findIndex((part) => part.includes("Blue Flag"));
  if (blueFlagIndex !== -1 && optimized.length < 3) {
    optimized.push(prioritizedParts[blueFlagIndex]);
  }
  const waveIndex = prioritizedParts.findIndex(
    (part) =>
      part.startsWith("featuring ") || part.startsWith("with calm") || part.startsWith("with wavy")
  );
  if (waveIndex !== -1 && optimized.length < 3) {
    optimized.push(prioritizedParts[waveIndex]);
  }
  for (let i = 0; i < prioritizedParts.length && optimized.length < 3; i++) {
    if (
      !optimized.includes(prioritizedParts[i]) &&
      i !== locationIndex &&
      i !== typeIndex &&
      i !== blueFlagIndex &&
      i !== waveIndex
    ) {
      optimized.push(prioritizedParts[i]);
    }
  }

  const remainingCount = allParts.length - optimized.length;
  if (remainingCount > 0) {
    return [...optimized, `and ${remainingCount} more criteria`];
  }
  return optimized;
}

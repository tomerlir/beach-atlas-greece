import { getAmenityLabel } from "@/lib/amenities";
import type { FilterState } from "@/hooks/useUrlState";

// Centralized label catalogs and small helpers used by the explanation engine

export const parkingLabels: Record<string, string> = {
  NONE: "no parking",
  ROADSIDE: "roadside parking",
  SMALL_LOT: "small parking lot",
  LARGE_LOT: "large parking lot",
};

export const waveConditionLabels: Record<string, string> = {
  CALM: "calm waters",
  MODERATE: "moderate waves",
  WAVY: "wavy conditions",
  SURFABLE: "surfable waves",
};

export const beachTypeLabels: Record<string, string> = {
  SANDY: "sandy",
  PEBBLY: "pebbly",
  MIXED: "mixed sand & pebbles",
  OTHER: "rocky",
};

export const capitalizeLocation = (str: string): string => {
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

export const formatList = (items: string[], conjunction = "and"): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
};

// Amenity grouping used for more natural phrasing
export function groupAmenityLabels(amenityIds: string[]): {
  essential: string[];
  leisure: string[];
  activity: string[];
  allLabels: string[];
} {
  const labels = amenityIds.map((id) => getAmenityLabel(id));
  const lower = (s: string) => s.toLowerCase();
  const essential = labels.filter((a) => ["toilets", "showers", "lifeguard"].includes(lower(a)));
  const leisure = labels.filter((a) =>
    ["beach bar", "taverna", "food", "sunbeds", "umbrellas", "music"].includes(lower(a))
  );
  const activity = labels.filter((a) =>
    [
      "snorkeling",
      "water sports",
      "fishing",
      "hiking",
      "cliff jumping",
      "boat trips",
      "photography",
      "birdwatching",
    ].includes(lower(a))
  );
  return { essential, leisure, activity, allLabels: labels };
}

export type FacetKey =
  | "location"
  | "type"
  | "waves"
  | "parking"
  | "amenities"
  | "blue_flag"
  | "organization"
  | "other";

export function getLocationPart(
  filters: FilterState,
  userLocation: GeolocationPosition | null
): string | null {
  // Prefer explicit extracted locations array > single location > search term
  const locations: string[] | undefined =
    filters.locations && filters.locations.length > 0
      ? filters.locations
      : filters.location
        ? [filters.location]
        : undefined;

  if (filters.nearMe && userLocation) {
    if (locations && locations.length > 0) {
      const caps = locations.map(capitalizeLocation);
      return `near ${formatList(caps)}`;
    }
    if (filters.search) return `near ${capitalizeLocation(filters.search)}`;
    return "near your current location";
  }

  if (locations && locations.length > 0) {
    const caps = locations.map(capitalizeLocation);
    return `in ${formatList(caps)}`;
  }

  if (filters.search) return `in ${capitalizeLocation(filters.search)}`;
  return null;
}

export function getTypePart(filters: FilterState): string | null {
  if (!filters.type || filters.type.length === 0) return null;
  const types = filters.type.map((t) => beachTypeLabels[t] || t.toLowerCase());
  return types.length === 1 ? `with ${types[0]} shores` : `with ${formatList(types)} shores`;
}

export function getWavesPart(filters: FilterState): string | null {
  if (!filters.waveConditions || filters.waveConditions.length === 0) return null;
  const conditions = filters.waveConditions.map((c) => waveConditionLabels[c] || c.toLowerCase());
  return conditions.length === 1
    ? `featuring ${conditions[0]}`
    : `with ${formatList(conditions, "or")}`;
}

export function getParkingPart(filters: FilterState): string | null {
  if (!filters.parking || filters.parking.length === 0) return null;
  const types = filters.parking.map((p) => parkingLabels[p] || p.toLowerCase());
  if (types.includes("no parking")) return "no parking available";
  return types.length === 1 ? `with ${types[0]}` : `with ${formatList(types, "or")}`;
}

export function getAmenitiesPart(filters: FilterState): string[] {
  if (!filters.amenities || filters.amenities.length === 0) return [];
  const grouped = groupAmenityLabels(filters.amenities);
  const parts: string[] = [];
  if (grouped.essential.length > 0) parts.push(`with ${formatList(grouped.essential)}`);
  if (grouped.leisure.length > 0) parts.push(`offering ${formatList(grouped.leisure)}`);
  if (grouped.activity.length > 0) parts.push(`perfect for ${formatList(grouped.activity)}`);
  if (parts.length === 0) {
    const firstThree = grouped.allLabels.slice(0, 3);
    parts.push(`with ${formatList(firstThree)}${grouped.allLabels.length > 3 ? " and more" : ""}`);
  }
  return parts;
}

export function getBlueFlagPart(filters: FilterState): string | null {
  return filters.blueFlag ? "Blue Flag certified for quality" : null;
}

export function getOrganizationPart(filters: FilterState): string | null {
  if (!filters.organized || filters.organized.length === 0) return null;
  const types = filters.organized.map((org) =>
    org === "organized" ? "well-organized" : "natural and unspoiled"
  );
  return types.length === 1 ? types[0] : `either ${formatList(types, "or")}`;
}

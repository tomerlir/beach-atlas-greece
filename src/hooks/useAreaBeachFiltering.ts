import { useMemo } from "react";
import { AreaFilterState } from "./useAreaUrlState";
import { Beach } from "@/types/beach";

// Define exact types based on actual database schema and usage patterns
import { BeachType, WaveCondition, ParkingType } from "@/types/common";

// Exported pure predicate to enable strict filtering tests for area-scoped pages
export function matchesAreaFilters(beach: Beach, filters: AreaFilterState): boolean {
  // Area filter (always applied and locked)
  if (!beach.area || beach.area !== filters.area) {
    return false;
  }

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();

    // For natural language queries, extract meaningful search terms
    // Remove common filter words and prepositions to get location/name terms
    const filterWords = [
      "beach",
      "beaches",
      "in",
      "on",
      "at",
      "with",
      "and",
      "or",
      "the",
      "a",
      "an",
      "i",
      "want",
      "need",
      "find",
      "show",
      "me",
      "all",
      "some",
      "any",
      "please",
      "for",
      "to",
      "from",
      "by",
      "of",
      "are",
      "is",
      "that",
      "this",
      "these",
      "those",
      "blue",
      "flag",
      "sandy",
      "sand",
      "calm",
      "parking",
      "lifeguard",
      "bar",
      "food",
      "music",
      "showers",
      "toilets",
      "umbrellas",
      "sunbeds",
      "organized",
      "pebbly",
      "pebble",
      "pebbles",
      "rocky",
      "mixed",
      "wavy",
      "waves",
      "moderate",
    ];
    const meaningfulWords = searchTerm
      .split(/\s+/)
      .filter((word) => word.length > 2 && !filterWords.includes(word))
      .filter((word) => !/^\d+$/.test(word)); // Remove pure numbers

    // If we have meaningful words, search for them
    if (meaningfulWords.length > 0) {
      const hasMatch = meaningfulWords.some(
        (word) =>
          (beach.name && beach.name.toLowerCase().includes(word)) ||
          (beach.area && beach.area.toLowerCase().includes(word))
      );
      if (!hasMatch) return false;
    } else {
      // Fallback to original search term if no meaningful words found
      const matchesName = beach.name && beach.name.toLowerCase().includes(searchTerm);
      const matchesPlace = beach.area && beach.area.toLowerCase().includes(searchTerm);
      if (!matchesName && !matchesPlace) return false;
    }
  }

  // Organized filter
  if (filters.organized.length > 0) {
    const beachOrganizedType = beach.organized ? "organized" : "unorganized";
    if (!filters.organized.includes(beachOrganizedType)) {
      return false;
    }
  }

  // Blue Flag filter
  if (filters.blueFlag && !beach.blue_flag) {
    return false;
  }

  // Parking filter
  if (filters.parking.length > 0 && !filters.parking.includes(beach.parking as ParkingType)) {
    return false;
  }

  // Amenities filter
  if (filters.amenities.length > 0) {
    const hasAllAmenities = filters.amenities.every(
      (amenity) => beach.amenities && beach.amenities.includes(amenity)
    );
    if (!hasAllAmenities) return false;
  }

  // Wave conditions filter
  if (
    filters.waveConditions.length > 0 &&
    !filters.waveConditions.includes(beach.wave_conditions as WaveCondition)
  ) {
    return false;
  }

  // Type filter (beach surface)
  if (filters.type.length > 0 && !filters.type.includes(beach.type as BeachType)) {
    return false;
  }

  return true;
}

export const useAreaBeachFiltering = (
  beaches: (Beach & { distance?: number })[],
  filters: AreaFilterState,
  userLocation: GeolocationPosition | null
): (Beach & { distance?: number })[] => {
  return useMemo(() => {
    let filtered = beaches.filter((beach) => matchesAreaFilters(beach as Beach, filters));

    // Sort beaches based on new sort format
    if (filters.sort) {
      const [sortKey, sortDir] = filters.sort.split(".");

      if (sortKey === "name") {
        // Sort by name
        filtered = [...filtered].sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return sortDir === "desc" ? -comparison : comparison;
        });
      } else if (sortKey === "distance" && userLocation && filters.nearMe) {
        // Sort by distance if location is available and nearMe is enabled
        filtered = filtered
          .map((beach) => ({
            ...beach,
            distance: beach.distance || 0,
          }))
          .sort((a, b) => {
            const comparison = (a.distance || 0) - (b.distance || 0);
            return sortDir === "desc" ? -comparison : comparison;
          });
      }
    } else {
      // Default sort by name A-Z when no sort is specified
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [beaches, filters, userLocation]);
};

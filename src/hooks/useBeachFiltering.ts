import { useMemo } from "react";
import { FilterState } from "./useUrlState";
import { AreaFilterState } from "./useAreaUrlState";
import { Beach } from "@/types/beach";
import { WaveCondition, BeachType } from "@/types/common";

// Union type for both filter states
type UnifiedFilterState = FilterState | AreaFilterState;

// Exported pure predicate to enable strict filtering tests without React/hook context
export function matchesFilters(
  beach: Beach,
  filters: UnifiedFilterState,
  areaName?: string
): boolean {
  // Area filter (for area-specific pages) - always applied and locked
  if (areaName || ("area" in filters && filters.area)) {
    const targetArea = areaName || (filters as AreaFilterState).area;
    if (!beach.area || !targetArea) {
      return false;
    }
    if (beach.area.toLowerCase() !== targetArea.toLowerCase()) {
      return false;
    }
  } else {
    // Location filter - filter by extracted location(s) (for global pages)
    const globalFilters = filters as FilterState;
    if (globalFilters.locations && globalFilters.locations.length > 0) {
      // Multiple locations: beach must match at least one location
      const matchesAnyLocation = globalFilters.locations.some((location) => {
        const locationTerm = location.toLowerCase().trim();
        return beach.area && beach.area.toLowerCase().includes(locationTerm);
      });
      if (!matchesAnyLocation) return false;
    } else if (globalFilters.location) {
      // Single location: beach must match the location
      const locationTerm = globalFilters.location.toLowerCase().trim();
      const matchesArea = beach.area && beach.area.toLowerCase().includes(locationTerm);
      if (!matchesArea) return false;
    }
  }

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();

    // For area-specific pages, use complex word filtering
    if (areaName || ("area" in filters && filters.area)) {
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
    } else {
      // For global pages, use simple search (only if no location filter)
      const globalFilters = filters as FilterState;
      if (!globalFilters.location && !globalFilters.locations) {
        const searchTermTrimmed = searchTerm.trim();
        if (searchTermTrimmed) {
          const matchesName = beach.name && beach.name.toLowerCase().includes(searchTermTrimmed);
          const matchesArea = beach.area && beach.area.toLowerCase().includes(searchTermTrimmed);
          if (!matchesName && !matchesArea) return false;
        }
      }
    }
  }

  // Organized filter (case-insensitive)
  if (filters.organized.length > 0) {
    const beachOrganizedType = beach.organized ? "organized" : "unorganized";
    // Normalize both sides to lowercase for comparison
    const normalizedFilters = filters.organized.map((f) => f.toLowerCase());
    if (!normalizedFilters.includes(beachOrganizedType.toLowerCase())) {
      return false;
    }
  }

  // Blue Flag filter
  if (filters.blueFlag && !beach.blue_flag) {
    return false;
  }

  // Parking filter (case-insensitive)
  if (filters.parking.length > 0 && beach.parking) {
    const normalizedBeachParking = beach.parking.toUpperCase();
    const normalizedFilters = filters.parking.map((p) => p.toUpperCase());
    if (!normalizedFilters.includes(normalizedBeachParking)) {
      return false;
    }
  }

  // Amenities filter (case-insensitive)
  if (filters.amenities.length > 0) {
    if (!beach.amenities || beach.amenities.length === 0) return false;

    const normalizedBeachAmenities = beach.amenities.map((a) => a.toLowerCase());
    const hasAllAmenities = filters.amenities.every((amenity) =>
      normalizedBeachAmenities.includes(amenity.toLowerCase())
    );
    if (!hasAllAmenities) return false;
  }

  // Wave conditions filter (case-insensitive comparison)
  if (filters.waveConditions.length > 0 && beach.wave_conditions) {
    const normalizedBeachCondition = (beach.wave_conditions as string).toUpperCase();
    if (!filters.waveConditions.includes(normalizedBeachCondition as WaveCondition)) {
      return false;
    }
  }

  // Type filter (beach surface) (case-insensitive comparison)
  if (filters.type.length > 0 && beach.type) {
    const normalizedBeachType = (beach.type as string).toUpperCase();
    if (!filters.type.includes(normalizedBeachType as BeachType)) {
      return false;
    }
  }

  return true;
}

export const useBeachFiltering = (
  beaches: (Beach & { distance?: number })[],
  filters: UnifiedFilterState,
  userLocation: GeolocationPosition | null,
  areaName?: string
): (Beach & { distance?: number })[] => {
  return useMemo(() => {
    let filtered = beaches.filter((beach) => matchesFilters(beach as Beach, filters, areaName));

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
  }, [beaches, filters, userLocation, areaName]);
};

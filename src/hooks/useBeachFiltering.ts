import { useMemo } from "react";
import { FilterState } from "./useUrlState";
import { Beach } from "@/types/beach";
import { WaveCondition, BeachType } from "@/types/common";

// Exported pure predicate to enable strict filtering tests without React/hook context
export function matchesFilters(beach: Beach, filters: FilterState): boolean {
  // Location filter - filter by extracted location(s)
  if (filters.locations && filters.locations.length > 0) {
    // Multiple locations: beach must match at least one location
    const matchesAnyLocation = filters.locations.some((location) => {
      const locationTerm = location.toLowerCase().trim();
      return beach.area && beach.area.toLowerCase().includes(locationTerm);
    });
    if (!matchesAnyLocation) return false;
  } else if (filters.location) {
    // Single location: beach must match the location
    const locationTerm = filters.location.toLowerCase().trim();
    const matchesArea = beach.area && beach.area.toLowerCase().includes(locationTerm);
    if (!matchesArea) return false;
  }

  // Search filter - matches beach name or area (only if no location filter)
  if (filters.search && !filters.location && !filters.locations) {
    const searchTerm = filters.search.toLowerCase().trim();

    // Direct search: check if the search term appears in beach name or area
    // The search term should already be cleaned by naturalLanguageSearch.ts
    if (searchTerm) {
      const matchesName = beach.name && beach.name.toLowerCase().includes(searchTerm);
      const matchesArea = beach.area && beach.area.toLowerCase().includes(searchTerm);
      if (!matchesName && !matchesArea) return false;
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
  if (filters.parking.length > 0 && !filters.parking.includes(beach.parking)) {
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

export const useBeachFiltering = (
  beaches: (Beach & { distance?: number })[],
  filters: FilterState,
  userLocation: GeolocationPosition | null
): (Beach & { distance?: number })[] => {
  return useMemo(() => {
    let filtered = beaches.filter((beach) => matchesFilters(beach as Beach, filters));

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

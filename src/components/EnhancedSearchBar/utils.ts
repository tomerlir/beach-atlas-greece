/**
 * Utility functions for EnhancedSearchBar component
 * Centralized filter management and helpers
 */

import { FilterState } from "@/hooks/useUrlState";

/**
 * Creates a filter reset object that clears all filters
 * Single source of truth for filter clearing logic
 */
export function createEmptyFilters(): Partial<FilterState> {
  return {
    search: "",
    originalQuery: undefined,
    location: undefined,
    locations: undefined,
    type: [],
    waveConditions: [],
    parking: [],
    amenities: [],
    organized: [],
    blueFlag: false,
    page: 1,
  };
}

/**
 * Checks if any filters are currently active
 * Used to determine if auto-clear should trigger
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    filters.search ||
    filters.originalQuery ||
    filters.location ||
    (filters.locations && filters.locations.length > 0) ||
    filters.type.length > 0 ||
    filters.waveConditions.length > 0 ||
    filters.parking.length > 0 ||
    filters.amenities.length > 0 ||
    filters.organized.length > 0 ||
    filters.blueFlag
  );
}

/**
 * Gets the display value for the search input
 * Prefers originalQuery (user's raw input) over search (cleaned term)
 */
export function getDisplayValue(filters: FilterState): string {
  return filters.originalQuery || filters.search;
}

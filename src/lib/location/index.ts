/**
 * Location Processing Module
 * Exports all location-related functionality
 */

export { LocationMatcher, type LocationMatch, type LocationFilter } from "./LocationMatcher";
export {
  GeographicFilter,
  type GeographicSearchResult,
  type ProximitySearchOptions,
} from "./GeographicFilter";

// Re-export for convenience
export { LocationMatcher as LocationMatcherClass } from "./LocationMatcher";
export { GeographicFilter as GeographicFilterClass } from "./GeographicFilter";

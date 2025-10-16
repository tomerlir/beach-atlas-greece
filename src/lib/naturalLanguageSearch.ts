import { FilterState } from "@/hooks/useUrlState";
import { EnhancedNaturalLanguageSearch, EnhancedExtractionResult, SearchContext } from "./nlp";

// Re-export the enhanced types for convenience
export type { EnhancedExtractionResult, SearchContext } from "./nlp";

// Enhanced NLP processor instance
const enhancedNLP = EnhancedNaturalLanguageSearch.getInstance();

/**
 * Main natural language extraction function using the enhanced NLP system
 * This is the primary function that should be used throughout the application
 */
export async function extractFromNaturalLanguage(query: string): Promise<EnhancedExtractionResult> {
  return await enhancedNLP.processQuery(query);
}

/**
 * Enhanced natural language extraction with context support
 */
export async function extractFromNaturalLanguageWithContext(
  query: string,
  context?: SearchContext
): Promise<EnhancedExtractionResult> {
  return await enhancedNLP.processQuery(query, context);
}

/**
 * Apply extracted filters to current filter state (for homepage context)
 */
export function applyExtractedFilters(
  currentFilters: FilterState,
  extracted: EnhancedExtractionResult
): FilterState {
  const baseline: FilterState = {
    ...currentFilters,
    search: "",
    location: undefined,
    locations: undefined,
    organized: [],
    blueFlag: false,
    parking: [],
    amenities: [],
    waveConditions: [],
    type: [],
    page: 1,
  };

  const newFilters: FilterState = {
    ...baseline,
    ...extracted.filters,
  };

  // Set location(s) if extracted
  if (extracted.locationExtraction.allLocations.length > 0) {
    const allLocationNames = extracted.locationExtraction.allLocations.map((loc) => loc.place);

    // Set primary location (first one)
    newFilters.location = allLocationNames[0];

    // Set all locations if there are multiple
    if (allLocationNames.length > 1) {
      newFilters.locations = allLocationNames;
    }
  } else if (extracted.place) {
    // Fallback to single place for backward compatibility
    newFilters.location = extracted.place;
  }

  // Only set search term if it contains meaningful content and we don't have specific filters
  const hasSpecificFilters =
    (newFilters.type && newFilters.type.length > 0) ||
    (newFilters.waveConditions && newFilters.waveConditions.length > 0) ||
    (newFilters.parking && newFilters.parking.length > 0) ||
    (newFilters.amenities && newFilters.amenities.length > 0) ||
    (newFilters.organized && newFilters.organized.length > 0) ||
    newFilters.blueFlag ||
    newFilters.nearMe ||
    newFilters.location ||
    (newFilters.locations && newFilters.locations.length > 0); // Include multiple locations as specific filters

  // Only use search term if it's meaningful and we don't have specific filters
  if (
    !hasSpecificFilters &&
    extracted.cleanedSearchTerm &&
    extracted.cleanedSearchTerm.length >= 2
  ) {
    newFilters.search = extracted.cleanedSearchTerm;
  } else {
    newFilters.search = "";
  }

  return newFilters;
}

/**
 * Apply extracted filters to current filter state (for area page context)
 */
export function applyExtractedFiltersForArea(
  currentFilters: FilterState,
  extracted: EnhancedExtractionResult
): FilterState {
  const baseline: FilterState = {
    ...currentFilters,
    search: "",
    location: undefined,
    locations: undefined,
    organized: [],
    blueFlag: false,
    parking: [],
    amenities: [],
    waveConditions: [],
    type: [],
    page: 1,
  };

  const newFilters: FilterState = {
    ...baseline,
    ...extracted.filters,
  };

  // Set location(s) if extracted
  if (extracted.locationExtraction.allLocations.length > 0) {
    const allLocationNames = extracted.locationExtraction.allLocations.map((loc) => loc.place);

    // Set primary location (first one)
    newFilters.location = allLocationNames[0];

    // Set all locations if there are multiple
    if (allLocationNames.length > 1) {
      newFilters.locations = allLocationNames;
    }
  } else if (extracted.place) {
    // Fallback to single place for backward compatibility
    newFilters.location = extracted.place;
  }

  // Only set search term if it contains meaningful content and we don't have specific filters
  const hasSpecificFilters =
    (newFilters.type && newFilters.type.length > 0) ||
    (newFilters.waveConditions && newFilters.waveConditions.length > 0) ||
    (newFilters.parking && newFilters.parking.length > 0) ||
    (newFilters.amenities && newFilters.amenities.length > 0) ||
    (newFilters.organized && newFilters.organized.length > 0) ||
    newFilters.blueFlag ||
    newFilters.nearMe ||
    newFilters.location ||
    (newFilters.locations && newFilters.locations.length > 0); // Include multiple locations as specific filters

  // Only use search term if it's meaningful and we don't have specific filters
  if (
    !hasSpecificFilters &&
    extracted.cleanedSearchTerm &&
    extracted.cleanedSearchTerm.length >= 2
  ) {
    newFilters.search = extracted.cleanedSearchTerm;
  } else {
    newFilters.search = "";
  }

  return newFilters;
}

/**
 * Check if a place matches the current area context using enhanced location matching
 */
export function doesPlaceMatchArea(place: string | undefined, areaName: string): boolean {
  if (!place) return true;

  // Use the enhanced location extractor for better matching
  const locationExtractor = enhancedNLP["locationExtractor"];
  return locationExtractor.doesLocationMatchArea(place, areaName);
}

/**
 * Update known places for better place recognition
 */
export function setKnownPlaces(places: string[]) {
  enhancedNLP.setKnownPlaces(places);
}

/**
 * Get NLP processing statistics
 */
export function getNLPStats() {
  return enhancedNLP.getStats();
}

/**
 * Clear NLP caches to free memory
 */
export function clearNLPCaches() {
  enhancedNLP.clearCaches();
}

/**
 * Create search context for enhanced processing
 */
export function createSearchContext(options: {
  userPreferences?: string[];
  searchHistory?: string[];
  location?: string;
  timeOfDay?: "morning" | "afternoon" | "evening";
  season?: "spring" | "summer" | "autumn" | "winter";
}): SearchContext {
  return {
    userPreferences: options.userPreferences,
    searchHistory: options.searchHistory,
    location: options.location,
    timeOfDay: options.timeOfDay,
    season: options.season,
  };
}

import { FilterState } from '@/hooks/useUrlState';

// Utility function to normalize quality adjectives and descriptive words
const normalizeQualityAdjectives = (query: string): string => {
  const qualityAdjectives = [
    'good', 'great', 'excellent', 'awesome', 'amazing', 'fantastic', 'wonderful', 'perfect',
    'decent', 'okay', 'ok', 'fine', 'nice', 'beautiful', 'stunning', 'breathtaking',
    'incredible', 'outstanding', 'superb', 'magnificent', 'spectacular', 'gorgeous',
    'terrible', 'bad', 'awful', 'horrible', 'poor', 'mediocre', 'average'
  ];
  
  const descriptiveWords = [
    'opportunities', 'spots', 'areas', 'places', 'locations', 'sites', 'zones',
    'chances', 'options', 'possibilities', 'facilities', 'services', 'features',
    'activities', 'experiences', 'destinations', 'venues', 'settings', 'environments'
  ];
  
  let normalizedQuery = query;
  
  // Remove quality adjectives completely
  qualityAdjectives.forEach(adjective => {
    const regex = new RegExp(`\\b${adjective}\\b`, 'gi');
    normalizedQuery = normalizedQuery.replace(regex, ' ');
  });
  
  // Remove descriptive words that don't add search value
  descriptiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalizedQuery = normalizedQuery.replace(regex, ' ');
  });
  
  // Clean up multiple spaces and trim
  normalizedQuery = normalizedQuery.replace(/\s+/g, ' ').trim();
  
  return normalizedQuery;
};

export interface ExtractedFilters {
  type?: string[];
  waveConditions?: string[];
  parking?: string[];
  amenities?: string[];
  blueFlag?: boolean;
  place?: string;
}

export interface NaturalLanguageResult {
  filters: Partial<FilterState>;
  place?: string;
  originalQuery: string;
  cleanedSearchTerm: string; // Remaining text after filter extraction, suitable for name/location search
}

// Type mappings
const TYPE_MAPPINGS: Record<string, string> = {
  'sandy': 'SANDY',
  'sand': 'SANDY',
  'pebbly': 'PEBBLY',
  'pebble': 'PEBBLY',
  'pebbles': 'PEBBLY',
  'mixed': 'MIXED',
  'rocky': 'OTHER',
  'rock': 'OTHER',
  'rocks': 'OTHER',
};

// Wave condition mappings (sorted by length descending to match longer phrases first)
const WAVE_MAPPINGS: Record<string, string> = {
  'calm waters': 'CALM',
  'big waves': 'WAVY',
  'body surf': 'SURFABLE',
  'bodysurf': 'SURFABLE',
  'surfable': 'SURFABLE',
  'surfing': 'SURFABLE',
  'peaceful': 'CALM',
  'moderate': 'MODERATE',
  'wavy': 'WAVY',
  'waves': 'WAVY',
  'still': 'CALM',
  'calm': 'CALM',
  'surf': 'SURFABLE',
};

// Parking mappings (sorted by length descending to match longer phrases first)
const PARKING_MAPPINGS: Record<string, string> = {
  'roadside parking': 'ROADSIDE',
  'street parking': 'ROADSIDE',
  'large parking': 'LARGE_LOT',
  'small parking': 'SMALL_LOT',
  'parking lot': 'LARGE_LOT',
  'no parking': 'NONE',
  'large lot': 'LARGE_LOT',
  'small lot': 'SMALL_LOT',
  'roadside': 'ROADSIDE',
  'parking': 'LARGE_LOT', // Default to large lot when just "parking" is mentioned (should match last)
};

// Organized mappings (sorted by length descending to match longer phrases first)
const ORGANIZED_MAPPINGS: Record<string, string> = {
  'not organized': 'unorganized',
  'not organised': 'unorganized',
  'unorganised': 'unorganized',
  'unorganized': 'unorganized',
  'organized': 'organized',
  'organised': 'organized',
};

// Amenity mappings - multi-word phrases first, then single words
const AMENITY_MAPPINGS: Record<string, string> = {
  // Multi-word phrases (check these first)
  'beach bar': 'beach_bar',
  'beach bars': 'beach_bar',
  'water sports': 'water_sports',
  'family friendly': 'family_friendly',
  'blue flag': 'blue_flag', // Special case - also sets blueFlag boolean
  'boat trips': 'boat_trips',
  'cliff jumping': 'cliff_jumping',
  'instagram photos': 'photography',
  'instagram photo': 'photography',
  'photo opportunities': 'photography',
  'photo spots': 'photography',
  'photography spots': 'photography',
  'picture perfect': 'photography',
  'instagram worthy': 'photography',
  'traditional greek tavernas': 'taverna',
  'traditional greek taverna': 'taverna',
  'greek tavernas': 'taverna',
  'greek taverna': 'taverna',
  'traditional tavernas': 'taverna',
  'traditional taverna': 'taverna',
  
  // Single words
  'sunbeds': 'sunbeds',
  'umbrellas': 'umbrellas',
  'showers': 'showers',
  'toilets': 'toilets',
  'lifeguard': 'lifeguard',
  'taverna': 'taverna',
  'food': 'food',
  'music': 'music',
  'snorkeling': 'snorkeling',
  'fishing': 'fishing',
  'photography': 'photography',
  'photos': 'photography',
  'pictures': 'photography',
  'hiking': 'hiking',
  'birdwatching': 'birdwatching',
};

// Common Greek place names and variations
const PLACE_PATTERNS = [
  // Islands
  'crete', 'corfu', 'mykonos', 'santorini', 'rhodes', 'zakynthos', 'kefalonia',
  'paros', 'naxos', 'ios', 'milos', 'sifnos', 'folegandros', 'amorgos',
  'skiathos', 'skopelos', 'alonissos', 'lesbos', 'chios', 'samos',
  'kos', 'patmos', 'syros', 'tinos', 'andros', 'kea', 'kythnos',
  
  // Areas/regions - this will be expanded as needed
  'paleokastritsa', 'oia', 'fira', 'lindos', 'myrtos', 'navagio',
  'balos', 'elafonisi', 'falassarna', 'gramvousa',
];

/**
 * Extract structured filters and place information from natural language query
 */
export function extractFromNaturalLanguage(query: string): NaturalLanguageResult {
  const originalQuery = query;
  // Normalize quality adjectives before processing
  const normalizedQuery = normalizeQualityAdjectives(query);
  let workingQuery = normalizedQuery.toLowerCase().trim();
  
  const result: NaturalLanguageResult = {
    filters: {},
    originalQuery,
    cleanedSearchTerm: '', // Will be set at the end
  };

  // Extract type (beach surface)
  const types: string[] = [];
  for (const [phrase, type] of Object.entries(TYPE_MAPPINGS)) {
    if (workingQuery.includes(phrase)) {
      types.push(type);
      workingQuery = workingQuery.replace(phrase, '').trim();
      break; // Only match first type found
    }
  }
  if (types.length > 0) {
    result.filters.type = types as ('SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER')[];
  }

  // Extract wave conditions (only take the first match to avoid duplicates)
  const waveConditions: string[] = [];
  for (const [phrase, condition] of Object.entries(WAVE_MAPPINGS)) {
    if (workingQuery.includes(phrase)) {
      // Only add if we haven't already matched a wave condition
      if (waveConditions.length === 0) {
        waveConditions.push(condition);
      }
      workingQuery = workingQuery.replace(phrase, '').trim();
      break; // Stop after first match to avoid picking up multiple related terms
    }
  }
  if (waveConditions.length > 0) {
    result.filters.waveConditions = waveConditions as ('CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE')[];
  }

  // Extract parking (only take the first match to avoid duplicates like "roadside" + "parking")
  const parking: string[] = [];
  for (const [phrase, parkingType] of Object.entries(PARKING_MAPPINGS)) {
    if (workingQuery.includes(phrase)) {
      parking.push(parkingType);
      workingQuery = workingQuery.replace(phrase, '').trim();
      break; // Stop after first match to avoid picking up "roadside" and then "parking" separately
    }
  }
  if (parking.length > 0) {
    result.filters.parking = parking;
  }

  // Extract organized (only take the first match to avoid duplicates)
  const organized: string[] = [];
  for (const [phrase, organizedType] of Object.entries(ORGANIZED_MAPPINGS)) {
    if (workingQuery.includes(phrase)) {
      organized.push(organizedType);
      workingQuery = workingQuery.replace(phrase, '').trim();
      break; // Stop after first match to avoid picking up multiple related terms
    }
  }
  if (organized.length > 0) {
    result.filters.organized = organized;
  }

  // Extract amenities (check multi-word phrases first, then single words)
  const amenities: string[] = [];
  let blueFlag = false;
  
  // Sort by length descending to check longer phrases first
  const amenityEntries = Object.entries(AMENITY_MAPPINGS)
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [phrase, amenityId] of amenityEntries) {
    if (workingQuery.includes(phrase)) {
      if (amenityId === 'blue_flag') {
        blueFlag = true;
      } else {
        amenities.push(amenityId);
      }
      workingQuery = workingQuery.replace(phrase, '').trim();
    }
  }
  
  if (amenities.length > 0) {
    result.filters.amenities = amenities;
  }
  if (blueFlag) {
    result.filters.blueFlag = true;
  }

  // Extract place - STRICT MATCHING ONLY for known Greek places
  let place: string | undefined;
  for (const placeName of PLACE_PATTERNS) {
    if (workingQuery.includes(placeName)) {
      place = placeName;
      workingQuery = workingQuery.replace(placeName, '').trim();
      break; // Only match first place found
    }
  }
  
  if (place) {
    result.place = place;
  }

  // Clean the remaining query by removing ALL natural language fluff
  // Use a more comprehensive approach with word boundaries to avoid leaving fragments
  const nlFluffWords = [
    // Common verbs and auxiliaries
    'show', 'find', 'get', 'give', 'search', 'looking', 'want', 'need', 'would', 'could', 'should',
    'like', 'love', 'prefer', 'wish', 'hope',
    // Pronouns and determiners
    'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your',
    'a', 'an', 'the', 'some', 'any', 'all', 'every', 'each',
    'this', 'that', 'these', 'those',
    // Prepositions
    'in', 'on', 'at', 'to', 'from', 'for', 'with', 'by', 'of', 'about', 'near', 'around',
    // Conjunctions
    'and', 'or', 'but', 'so', 'yet',
    // Forms of "to be"
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    // Forms of "to have"
    'have', 'has', 'had', 'having',
    // Common words
    'please', 'thank', 'thanks',
    // Filter-related words that should never be in search term (already extracted as filters)
    'beach', 'beaches', 'flag', 'blue',
    // Beach type keywords (already extracted)
    'sandy', 'sand', 'pebbly', 'pebble', 'pebbles', 'mixed', 'rocky', 'rock', 'rocks',
    // Wave condition keywords (already extracted) - including plural forms
    'calm', 'still', 'peaceful', 'moderate', 'wavy', 'waves', 'water', 'waters', 'surfable', 'surf', 'surfing',
    // Parking keywords (already extracted)
    'parking', 'lot', 'roadside', 'street',
    // Organized keywords (already extracted)
    'organized', 'unorganized', 'organised', 'unorganised', 'not',
    // Common amenity keywords (already extracted)
    'bar', 'taverna', 'food', 'music', 'sunbeds', 'umbrellas', 'showers', 'toilets',
    'lifeguard', 'snorkeling', 'sports', 'family', 'friendly', 'boat', 'trips',
    'fishing', 'photography', 'hiking', 'birdwatching', 'jumping', 'cliff'
  ];
  
  // Split by whitespace and filter out fluff words, then rejoin
  const cleanedWords = workingQuery
    .split(/\s+/)
    .filter(word => {
      const trimmedWord = word.trim();
      // Keep the word only if it's not in the fluff list and has meaningful length
      return trimmedWord.length > 0 && !nlFluffWords.includes(trimmedWord);
    })
    .join(' ')
    .trim();
  
  // Determine the cleaned search term:
  // - If we have cleaned words remaining, use them (e.g., beach names)
  // - Otherwise, if we extracted a known place, use that (place was removed from query)
  // - Otherwise, empty string (search is empty, only filters apply)
  result.cleanedSearchTerm = cleanedWords || place || '';

  return result;
}

/**
 * Apply extracted filters to existing filter state
 */
export function applyExtractedFilters(
  currentFilters: FilterState,
  extracted: NaturalLanguageResult
): FilterState {
  const newFilters: FilterState = {
    ...currentFilters,
    ...extracted.filters,
    page: 1, // Reset to first page when applying new filters
  };
  
  // Use the cleaned search term for filtering
  // This contains only location/name keywords, with filter words and NL fluff removed
  newFilters.search = extracted.cleanedSearchTerm;
  
  return newFilters;
}

/**
 * Apply extracted filters for area page context (filters only, no place search)
 */
export function applyExtractedFiltersForArea(
  currentFilters: FilterState,
  extracted: NaturalLanguageResult
): FilterState {
  const newFilters: FilterState = {
    ...currentFilters,
    ...extracted.filters,
    page: 1, // Reset to first page when applying new filters
  };
  
  // For area context, use cleaned search term for beach name matching
  // The place will still be used for mismatch detection if needed
  newFilters.search = extracted.cleanedSearchTerm;
  
  return newFilters;
}

/**
 * Check if extracted place matches current area context
 * Uses word-boundary matching to avoid false positives like "Cor" matching "Corfu"
 */
export function doesPlaceMatchArea(place: string | undefined, areaName: string): boolean {
  if (!place) return true; // No place specified, so no mismatch
  
  const normalizedPlace = place.toLowerCase().trim();
  const normalizedArea = areaName.toLowerCase().trim();
  
  // Exact match
  if (normalizedPlace === normalizedArea) return true;
  
  // Word boundary match - check if words from place appear as complete words in area
  const placeWords = normalizedPlace.split(/\s+/);
  const areaWords = normalizedArea.split(/\s+/);
  
  // Check if any complete word from place matches any complete word from area
  const hasWordMatch = placeWords.some(placeWord => 
    areaWords.some(areaWord => 
      areaWord === placeWord || // Exact word match
      areaWord.startsWith(placeWord) && placeWord.length >= 4 // Prefix match for longer words (e.g., "myk" in "mykonos")
    )
  );
  
  return hasWordMatch;
}

/**
 * Generate relaxation steps for zero results
 */
export interface RelaxationStep {
  type: 'waveConditions' | 'parking' | 'amenities';
  label: string;
}

export function generateRelaxationSteps(filters: FilterState): RelaxationStep[] {
  const steps: RelaxationStep[] = [];
  
  if (filters.waveConditions && filters.waveConditions.length > 0) {
    steps.push({
      type: 'waveConditions',
      label: 'wave conditions'
    });
  }
  
  if (filters.parking && filters.parking.length > 0) {
    steps.push({
      type: 'parking',
      label: 'parking requirements'
    });
  }
  
  if (filters.amenities && filters.amenities.length > 0) {
    steps.push({
      type: 'amenities',
      label: 'non-essential amenities'
    });
  }
  
  return steps;
}

/**
 * Apply relaxation step to filters
 */
export function applyRelaxationStep(
  filters: FilterState,
  step: RelaxationStep
): FilterState {
  const relaxedFilters = { ...filters };
  
  switch (step.type) {
    case 'waveConditions':
      relaxedFilters.waveConditions = [];
      break;
    case 'parking':
      relaxedFilters.parking = [];
      break;
    case 'amenities':
      relaxedFilters.amenities = [];
      break;
  }
  
  return relaxedFilters;
}

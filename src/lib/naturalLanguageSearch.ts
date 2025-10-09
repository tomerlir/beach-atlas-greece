import { FilterState } from '@/hooks/useUrlState';

// Enhanced utility function to normalize natural language queries
const normalizeQuery = (query: string): string => {
  const removePatterns = [
    /\b(?:show|find|get|give|search|looking|want|need|would|could|should|like|love|prefer|wish|hope)\s+(?:me|us)?\b/gi,
    /\b(?:i|me|my|we|us|our|you|your)\b/gi,
    /\b(?:what|which|where|when|how|who|why)\b/gi,
    /\b(?:a|an|the|some|any|all|every|each)\b/gi,
    /\b(?:this|that|these|those)\b/gi,
    /\b(?:in|on|at|to|from|for|with|by|of|about|near|around)\b/gi,
    /\b(?:and|or|but|so|yet)\b/gi,
    /\b(?:is|am|are|was|were|be|been|being)\b/gi,
    /\b(?:have|has|had|having)\b/gi,
    /\b(?:please|thank|thanks)\b/gi,
    
    // Quality adjectives and superlatives
    /\b(?:good|great|excellent|awesome|amazing|fantastic|wonderful|perfect|decent|okay|ok|fine|nice|beautiful|stunning|breathtaking|incredible|outstanding|superb|magnificent|spectacular|gorgeous|terrible|bad|awful|horrible|poor|mediocre|average)\b/gi,
    
    // Intent words
    /\b(?:best|top|popular|famous|must-see|must see|most|greatest|recommended|suggested)\b/gi,
    
    // Generic descriptive words
    /\b(?:opportunities|spots|areas|places|locations|sites|zones|chances|options|possibilities|facilities|services|features|activities|experiences|destinations|venues|settings|environments)\b/gi,
  ];

  let normalized = query.toLowerCase();
  
  removePatterns.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });
  
  return normalized.replace(/\s+/g, ' ').trim();
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
  cleanedSearchTerm: string;
}

// Enhanced type mappings with word boundary protection
const TYPE_MAPPINGS: { pattern: RegExp; type: string }[] = [
  { pattern: /\bwhite\s+sand\b/, type: 'SANDY' },
  { pattern: /\bgolden\s+sand\b/, type: 'SANDY' },
  { pattern: /\bsandy\s+beach\b/, type: 'SANDY' },
  { pattern: /\bsand\s+beach\b/, type: 'SANDY' },
  { pattern: /\bsandy\b/, type: 'SANDY' },
  { pattern: /\bsand\b/, type: 'SANDY' },
  
  { pattern: /\bpebble\s+beach\b/, type: 'PEBBLY' },
  { pattern: /\bstone\s+beach\b/, type: 'PEBBLY' },
  { pattern: /\bstony\s+beach\b/, type: 'PEBBLY' },
  { pattern: /\bpebbly\b/, type: 'PEBBLY' },
  { pattern: /\bpebble\b/, type: 'PEBBLY' },
  { pattern: /\bpebbles\b/, type: 'PEBBLY' },
  { pattern: /\bstony\b/, type: 'PEBBLY' },
  
  { pattern: /\bmixed\s+sand\b/, type: 'MIXED' },
  { pattern: /\bsand\s+and\s+pebbles\b/, type: 'MIXED' },
  { pattern: /\bmixed\b/, type: 'MIXED' },
  
  { pattern: /\brocky\s+beach\b/, type: 'OTHER' },
  { pattern: /\bconcrete\s+beach\b/, type: 'OTHER' },
  { pattern: /\bman\s+made\b/, type: 'OTHER' },
  { pattern: /\bartificial\s+beach\b/, type: 'OTHER' },
  { pattern: /\brocky\b/, type: 'OTHER' },
  { pattern: /\brocks\b/, type: 'OTHER' },
  { pattern: /\brock\b/, type: 'OTHER' },
];

// Enhanced wave condition mappings
const WAVE_MAPPINGS: { pattern: RegExp; condition: string }[] = [
  { pattern: /\bcalm\s+water\b/, condition: 'CALM' },
  { pattern: /\bcalm\s+waters\b/, condition: 'CALM' },
  { pattern: /\bcalm\s+sea\b/, condition: 'CALM' },
  { pattern: /\bstill\s+water\b/, condition: 'CALM' },
  { pattern: /\bpeaceful\s+water\b/, condition: 'CALM' },
  { pattern: /\bquiet\s+water\b/, condition: 'CALM' },
  { pattern: /\bgentle\s+water\b/, condition: 'CALM' },
  { pattern: /\bflat\s+water\b/, condition: 'CALM' },
  { pattern: /\bshallow\s+water\b/, condition: 'CALM' },
  { pattern: /\bshallow\s+waters\b/, condition: 'CALM' },
  { pattern: /\bprotected\s+beach\b/, condition: 'CALM' },
  { pattern: /\bsheltered\s+beach\b/, condition: 'CALM' },
  { pattern: /\bcalm\b/, condition: 'CALM' },
  { pattern: /\bstill\b/, condition: 'CALM' },
  { pattern: /\bpeaceful\b/, condition: 'CALM' },
  { pattern: /\bquiet\b/, condition: 'CALM' },
  { pattern: /\bgentle\b/, condition: 'CALM' },
  { pattern: /\bflat\b/, condition: 'CALM' },
  { pattern: /\bshallow\b/, condition: 'CALM' },
  
  { pattern: /\bmoderate\s+waves\b/, condition: 'MODERATE' },
  { pattern: /\bmedium\s+waves\b/, condition: 'MODERATE' },
  { pattern: /\bmoderate\b/, condition: 'MODERATE' },
  { pattern: /\bmedium\b/, condition: 'MODERATE' },
  
  { pattern: /\bbig\s+waves\b/, condition: 'WAVY' },
  { pattern: /\blarge\s+waves\b/, condition: 'WAVY' },
  { pattern: /\bstrong\s+waves\b/, condition: 'WAVY' },
  { pattern: /\brough\s+sea\b/, condition: 'WAVY' },
  { pattern: /\bchoppy\s+water\b/, condition: 'WAVY' },
  { pattern: /\bwavy\b/, condition: 'WAVY' },
  { pattern: /\bwaves\b/, condition: 'WAVY' },
  { pattern: /\bwave\b/, condition: 'WAVY' },
  { pattern: /\bchoppy\b/, condition: 'WAVY' },
  { pattern: /\brough\b/, condition: 'WAVY' },
  { pattern: /\bwindy\b/, condition: 'WAVY' },
  
  { pattern: /\bgood\s+for\s+surfing\b/, condition: 'SURFABLE' },
  { pattern: /\bwaves\s+for\s+surfing\b/, condition: 'SURFABLE' },
  { pattern: /\bsurfing\s+beach\b/, condition: 'SURFABLE' },
  { pattern: /\bbody\s+surf\b/, condition: 'SURFABLE' },
  { pattern: /\bbodysurf\b/, condition: 'SURFABLE' },
  { pattern: /\bsurf\b/, condition: 'SURFABLE' },
  { pattern: /\bsurfing\b/, condition: 'SURFABLE' },
  { pattern: /\bsurfable\b/, condition: 'SURFABLE' },
];

// Enhanced parking mappings
const PARKING_MAPPINGS: { pattern: RegExp; parking: string }[] = [
  { pattern: /\bno\s+parking\b/, parking: 'NONE' },
  { pattern: /\bwithout\s+parking\b/, parking: 'NONE' },
  { pattern: /\blimited\s+parking\b/, parking: 'SMALL_LOT' },
  { pattern: /\bsmall\s+parking\b/, parking: 'SMALL_LOT' },
  { pattern: /\bfew\s+spaces\b/, parking: 'SMALL_LOT' },
  { pattern: /\bparking\s+lot\b/, parking: 'LARGE_LOT' },
  { pattern: /\blarge\s+parking\b/, parking: 'LARGE_LOT' },
  { pattern: /\bample\s+parking\b/, parking: 'LARGE_LOT' },
  { pattern: /\bplenty\s+of\s+parking\b/, parking: 'LARGE_LOT' },
  { pattern: /\beasy\s+parking\b/, parking: 'LARGE_LOT' },
  { pattern: /\broadside\s+parking\b/, parking: 'ROADSIDE' },
  { pattern: /\bstreet\s+parking\b/, parking: 'ROADSIDE' },
  { pattern: /\bon\s+street\s+parking\b/, parking: 'ROADSIDE' },
  { pattern: /\bfree\s+parking\b/, parking: 'LARGE_LOT' },
  { pattern: /\bparking\b/, parking: 'LARGE_LOT' },
];

// Organized mappings
const ORGANIZED_MAPPINGS: { pattern: RegExp; organized: string }[] = [
  { pattern: /\borganized\s+beach\b/, organized: 'organized' },
  { pattern: /\bunorganized\s+beach\b/, organized: 'unorganized' },
  { pattern: /\bnot\s+organized\b/, organized: 'unorganized' },
  { pattern: /\bwild\s+beach\b/, organized: 'unorganized' },
  { pattern: /\bnatural\s+beach\b/, organized: 'unorganized' },
  { pattern: /\bundeveloped\s+beach\b/, organized: 'unorganized' },
  { pattern: /\borganized\b/, organized: 'organized' },
  { pattern: /\borganised\b/, organized: 'organized' },
  { pattern: /\bunorganized\b/, organized: 'unorganized' },
  { pattern: /\bunorganised\b/, organized: 'unorganized' },
  { pattern: /\bwild\b/, organized: 'unorganized' },
  { pattern: /\bnatural\b/, organized: 'unorganized' },
];

// Enhanced amenity mappings with regex patterns
const AMENITY_MAPPINGS: { pattern: RegExp; amenity: string }[] = [
  { pattern: /\bbeach\s+bar\b/, amenity: 'beach_bar' },
  { pattern: /\bbeachside\s+bar\b/, amenity: 'beach_bar' },
  { pattern: /\bseaside\s+bar\b/, amenity: 'beach_bar' },
  { pattern: /\bwater\s+sports\b/, amenity: 'water_sports' },
  { pattern: /\bfamily\s+friendly\b/, amenity: 'family_friendly' },
  { pattern: /\bfamily-friendly\b/, amenity: 'family_friendly' },
  { pattern: /\bgood\s+for\s+families\b/, amenity: 'family_friendly' },
  { pattern: /\bboat\s+trips\b/, amenity: 'boat_trips' },
  { pattern: /\bboat\s+tour\b/, amenity: 'boat_trips' },
  { pattern: /\bcliff\s+jumping\b/, amenity: 'cliff_jumping' },
  { pattern: /\bcliff\s+dive\b/, amenity: 'cliff_jumping' },
  { pattern: /\bcliff\s+diving\b/, amenity: 'cliff_jumping' },
  { pattern: /\bgreek\s+taverna\b/, amenity: 'taverna' },
  { pattern: /\btraditional\s+taverna\b/, amenity: 'taverna' },
  { pattern: /\bsun\s+loungers\b/, amenity: 'sunbeds' },
  { pattern: /\bbeach\s+beds\b/, amenity: 'sunbeds' },
  { pattern: /\bsun\s+umbrella\b/, amenity: 'umbrellas' },
  { pattern: /\bbeach\s+umbrella\b/, amenity: 'umbrellas' },
  { pattern: /\bfresh\s+water\s+shower\b/, amenity: 'showers' },
  { pattern: /\blifeguard\s+on\s+duty\b/, amenity: 'lifeguard' },
  { pattern: /\blifeguard\s+service\b/, amenity: 'lifeguard' },
  { pattern: /\bsnorkel\s+gear\b/, amenity: 'snorkeling' },
  { pattern: /\bfishing\s+spot\b/, amenity: 'fishing' },
  { pattern: /\bgood\s+for\s+fishing\b/, amenity: 'fishing' },
  { pattern: /\bhiking\s+trails\b/, amenity: 'hiking' },
  { pattern: /\bwalking\s+trails\b/, amenity: 'hiking' },
  { pattern: /\bbird\s+spotting\b/, amenity: 'birdwatching' },
  
  // Single word amenities (with word boundaries)
  { pattern: /\bsunbeds\b/, amenity: 'sunbeds' },
  { pattern: /\bsunbed\b/, amenity: 'sunbeds' },
  { pattern: /\bumbrellas\b/, amenity: 'umbrellas' },
  { pattern: /\bumbrella\b/, amenity: 'umbrellas' },
  { pattern: /\bshowers\b/, amenity: 'showers' },
  { pattern: /\bshower\b/, amenity: 'showers' },
  { pattern: /\btoilets\b/, amenity: 'toilets' },
  { pattern: /\btoilet\b/, amenity: 'toilets' },
  { pattern: /\brestroom\b/, amenity: 'toilets' },
  { pattern: /\brestrooms\b/, amenity: 'toilets' },
  { pattern: /\bbathroom\b/, amenity: 'toilets' },
  { pattern: /\bbathrooms\b/, amenity: 'toilets' },
  { pattern: /\blifeguard\b/, amenity: 'lifeguard' },
  { pattern: /\blifeguards\b/, amenity: 'lifeguard' },
  { pattern: /\btaverna\b/, amenity: 'taverna' },
  { pattern: /\btavernas\b/, amenity: 'taverna' },
  { pattern: /\brestaurant\b/, amenity: 'taverna' },
  { pattern: /\brestaurants\b/, amenity: 'taverna' },
  { pattern: /\bfood\b/, amenity: 'food' },
  { pattern: /\bsnacks\b/, amenity: 'food' },
  { pattern: /\brefreshments\b/, amenity: 'food' },
  { pattern: /\bcafe\b/, amenity: 'food' },
  { pattern: /\bcafé\b/, amenity: 'food' },
  { pattern: /\bmusic\b/, amenity: 'music' },
  { pattern: /\bsnorkeling\b/, amenity: 'snorkeling' },
  { pattern: /\bsnorkel\b/, amenity: 'snorkeling' },
  { pattern: /\bsnorkelling\b/, amenity: 'snorkeling' },
  { pattern: /\bfishing\b/, amenity: 'fishing' },
  { pattern: /\bfish\b/, amenity: 'fishing' },
  { pattern: /\bphotography\b/, amenity: 'photography' },
  { pattern: /\bphotos\b/, amenity: 'photography' },
  { pattern: /\bphoto\b/, amenity: 'photography' },
  { pattern: /\bpictures\b/, amenity: 'photography' },
  { pattern: /\bpicture\b/, amenity: 'photography' },
  { pattern: /\binstagram\b/, amenity: 'photography' },
  { pattern: /\bselfie\b/, amenity: 'photography' },
  { pattern: /\bselfies\b/, amenity: 'photography' },
  { pattern: /\binstagrammable\b/, amenity: 'photography' },
  { pattern: /\bscenic\b/, amenity: 'photography' },
  { pattern: /\bpicturesque\b/, amenity: 'photography' },
  { pattern: /\bhiking\b/, amenity: 'hiking' },
  { pattern: /\bhike\b/, amenity: 'hiking' },
  { pattern: /\bbirdwatching\b/, amenity: 'birdwatching' },
  { pattern: /\bbird\s+watch\b/, amenity: 'birdwatching' },
  { pattern: /\bbirds\b/, amenity: 'birdwatching' },
];

// Enhanced blue flag patterns with better coverage
const BLUE_FLAG_PATTERNS: RegExp[] = [
  /\bblue\s+flag\s+certified\b/i,
  /\bblue\s+flag\s+certification\b/i,
  /\bblue\s+flag\s+award\b/i,
  /\bblue\s+flag\s+status\b/i,
  /\bblue\s+flag\s+beach\b/i,
  /\bblue-flag\s+certified\b/i,
  /\bblue-flag\s+beach\b/i,
  /\bawarded\s+blue\s+flag\b/i,
  /\bblue\s+flag\b/i, // Keep this as last resort since it's the most general
];

// Dynamic place dictionary
let KNOWN_PLACES: string[] = [
  'crete', 'corfu', 'mykonos', 'santorini', 'rhodes', 'zakynthos', 'kefalonia',
  'paros', 'naxos', 'ios', 'milos', 'sifnos', 'folegandros', 'amorgos',
  'skiathos', 'skopelos', 'alonissos', 'lesbos', 'chios', 'samos',
  'kos', 'patmos', 'syros', 'tinos', 'andros', 'kea', 'kythnos',
  'paleokastritsa', 'oia', 'fira', 'lindos', 'myrtos', 'navagio',
  'balos', 'elafonisi', 'falassarna', 'gramvousa',
];

export function setKnownPlaces(placeNames: string[]) {
  try {
    const normalized = Array.from(
      new Set(
        (placeNames || [])
          .map((n) => (n || '')
            .toString()
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
          )
          .filter((n) => n.length > 0)
      )
    );
    if (normalized.length > 0) {
      KNOWN_PLACES = normalized;
    }
  } catch {
    // Keep existing list on error
  }
}

// Enhanced matching function that uses regex patterns
function extractWithPatterns<T>(
  query: string, 
  patterns: { pattern: RegExp; [key: string]: any }[], 
  extractKey: string
): { matches: any[]; remainingQuery: string } {
  let remainingQuery = query;
  const matches: any[] = [];
  
  for (const { pattern, [extractKey]: value } of patterns) {
    if (pattern.test(remainingQuery)) {
      matches.push(value);
      // Replace the matched pattern with space to avoid breaking words
      remainingQuery = remainingQuery.replace(pattern, ' ').trim();
    }
  }
  
  return { matches, remainingQuery: remainingQuery.replace(/\s+/g, ' ').trim() };
}

// Enhanced place detection
function detectPlace(query: string): { place?: string; remainingQuery: string } {
  let remainingQuery = query;
  let detectedPlace: string | undefined;
  
  // First try exact matches
  for (const place of KNOWN_PLACES) {
    const placePattern = new RegExp(`\\b${place}\\b`, 'i');
    if (placePattern.test(remainingQuery)) {
      detectedPlace = place;
      remainingQuery = remainingQuery.replace(placePattern, ' ').trim();
      break;
    }
  }
  
  // If no exact match, try fuzzy matching
  if (!detectedPlace) {
    const words = query.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      
      for (const place of KNOWN_PLACES) {
        // Check if word is similar to place
        if (place.includes(word) || word.includes(place) || 
            levenshtein(word, place) <= Math.min(2, Math.floor(place.length / 3))) {
          detectedPlace = place;
          const wordPattern = new RegExp(`\\b${word}\\b`, 'i');
          remainingQuery = remainingQuery.replace(wordPattern, ' ').trim();
          break;
        }
      }
      if (detectedPlace) break;
    }
  }
  
  return { place: detectedPlace, remainingQuery: remainingQuery.replace(/\s+/g, ' ').trim() };
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  const n = s.length;
  const m = t.length;
  if (n === 0) return m;
  if (m === 0) return n;
  const dp = new Array(m + 1);
  for (let j = 0; j <= m; j++) dp[j] = j;
  for (let i = 1; i <= n; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const temp = dp[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + cost
      );
      prev = temp;
    }
  }
  return dp[m];
}

/**
 * Fixed natural language extraction with proper blue flag detection
 */
export function extractFromNaturalLanguage(query: string): NaturalLanguageResult {
  const originalQuery = query;
  
  // Normalize the query first
  const normalizedQuery = normalizeQuery(query);
  let workingQuery = normalizedQuery;
  
  const result: NaturalLanguageResult = {
    filters: {},
    originalQuery,
    cleanedSearchTerm: '',
  };

  // Extract place first
  const placeResult = detectPlace(workingQuery);
  if (placeResult.place) {
    result.place = placeResult.place;
    workingQuery = placeResult.remainingQuery;
  }

  // Check for blue flag EARLY - before other extractions that might interfere
  let blueFlagDetected = false;
  for (const pattern of BLUE_FLAG_PATTERNS) {
    if (pattern.test(workingQuery)) {
      blueFlagDetected = true;
      workingQuery = workingQuery.replace(pattern, ' ').trim();
      break; // Stop after first match
    }
  }
  if (blueFlagDetected) {
    result.filters.blueFlag = true;
  }

  // Extract beach type using regex patterns
  const typeResult = extractWithPatterns(workingQuery, TYPE_MAPPINGS, 'type');
  if (typeResult.matches.length > 0) {
    result.filters.type = typeResult.matches;
    workingQuery = typeResult.remainingQuery;
  }

  // Extract wave conditions using regex patterns
  const waveResult = extractWithPatterns(workingQuery, WAVE_MAPPINGS, 'condition');
  if (waveResult.matches.length > 0) {
    result.filters.waveConditions = waveResult.matches;
    workingQuery = waveResult.remainingQuery;
  }

  // Extract parking using regex patterns
  const parkingResult = extractWithPatterns(workingQuery, PARKING_MAPPINGS, 'parking');
  if (parkingResult.matches.length > 0) {
    result.filters.parking = parkingResult.matches;
    workingQuery = parkingResult.remainingQuery;
  }

  // Extract organized status using regex patterns
  const organizedResult = extractWithPatterns(workingQuery, ORGANIZED_MAPPINGS, 'organized');
  if (organizedResult.matches.length > 0) {
    result.filters.organized = organizedResult.matches;
    workingQuery = organizedResult.remainingQuery;
  }

  // Extract amenities using regex patterns (AFTER blue flag)
  const amenityResult = extractWithPatterns(workingQuery, AMENITY_MAPPINGS, 'amenity');
  if (amenityResult.matches.length > 0) {
    result.filters.amenities = amenityResult.matches;
    workingQuery = amenityResult.remainingQuery;
  }

  // Final cleanup of common beach-related words that shouldn't be in search term
  const finalCleanupPatterns = [
    /\bbeach\b/gi,
    /\bbeaches\b/gi,
    /\bsea\b/gi,
    /\bocean\b/gi,
    /\bcoast\b/gi,
    /\bcoastal\b/gi,
    /\blocation\b/gi,
    /\bspot\b/gi,
    /\bplace\b/gi,
    /\barea\b/gi,
  ];

  finalCleanupPatterns.forEach(pattern => {
    workingQuery = workingQuery.replace(pattern, ' ').trim();
  });

  // Clean up extra spaces and determine search term
  let cleanedSearchTerm = workingQuery.replace(/\s+/g, ' ').trim();

  // If we have a meaningful cleaned term, use it; otherwise use place or empty
  if (cleanedSearchTerm && cleanedSearchTerm.length >= 2) {
    result.cleanedSearchTerm = cleanedSearchTerm;
  } else if (result.place) {
    result.cleanedSearchTerm = result.place;
  } else {
    result.cleanedSearchTerm = '';
  }

  return result;
}

// Keep your existing utility functions unchanged:
export function applyExtractedFilters(
  currentFilters: FilterState,
  extracted: NaturalLanguageResult
): FilterState {
  const baseline: FilterState = {
    ...currentFilters,
    search: '',
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
  
  newFilters.search = extracted.cleanedSearchTerm;
  
  return newFilters;
}

export function applyExtractedFiltersForArea(
  currentFilters: FilterState,
  extracted: NaturalLanguageResult
): FilterState {
  const baseline: FilterState = {
    ...currentFilters,
    search: '',
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
  
  newFilters.search = extracted.cleanedSearchTerm;
  
  return newFilters;
}

export function doesPlaceMatchArea(place: string | undefined, areaName: string): boolean {
  if (!place) return true;
  
  const normalizedPlace = place.toLowerCase().trim();
  const normalizedArea = areaName.toLowerCase().trim();
  
  if (normalizedPlace === normalizedArea) return true;
  
  const placeWords = normalizedPlace.split(/\s+/);
  const areaWords = normalizedArea.split(/\s+/);
  
  const hasWordMatch = placeWords.some(placeWord => 
    areaWords.some(areaWord => 
      areaWord === placeWord || 
      (areaWord.startsWith(placeWord) && placeWord.length >= 4)
    )
  );
  
  return hasWordMatch;
}

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
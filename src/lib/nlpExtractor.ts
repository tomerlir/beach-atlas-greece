// Natural language query extraction for beach search
// Extracts structured filters and place information from user input

export interface ExtractedQuery {
  type?: ('SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER')[];
  waveConditions?: ('CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE')[];
  parking?: ('NONE' | 'ROADSIDE' | 'SMALL_LOT' | 'LARGE_LOT')[];
  amenities?: string[];
  blueFlag?: boolean;
  place?: string; // For location matching
}

// Type mappings
const TYPE_MAPPINGS: Record<string, 'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER'> = {
  'sandy': 'SANDY',
  'sand': 'SANDY',
  'pebbly': 'PEBBLY',
  'pebble': 'PEBBLY',
  'pebbles': 'PEBBLY',
  'rocky': 'PEBBLY',
  'mixed': 'MIXED',
};

// Wave condition mappings
const WAVE_MAPPINGS: Record<string, 'CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE'> = {
  'calm': 'CALM',
  'still': 'CALM',
  'flat': 'CALM',
  'moderate': 'MODERATE',
  'wavy': 'WAVY',
  'waves': 'WAVY',
  'surfable': 'SURFABLE',
  'surf': 'SURFABLE',
  'body surf': 'SURFABLE',
  'bodysurf': 'SURFABLE',
  'bodysurfing': 'SURFABLE',
};

// Parking mappings
const PARKING_MAPPINGS: Record<string, 'NONE' | 'ROADSIDE' | 'SMALL_LOT' | 'LARGE_LOT'> = {
  'no parking': 'NONE',
  'street parking': 'ROADSIDE',
  'roadside': 'ROADSIDE',
  'roadside parking': 'ROADSIDE',
  'small lot': 'SMALL_LOT',
  'small parking': 'SMALL_LOT',
  'large lot': 'LARGE_LOT',
  'large parking': 'LARGE_LOT',
  'parking lot': 'SMALL_LOT', // Default to small
  'parking': 'SMALL_LOT', // Generic parking
};

// Amenity mappings (multi-word phrases)
const AMENITY_MAPPINGS: Record<string, string> = {
  'beach bar': 'food',
  'food': 'food',
  'restaurant': 'food',
  'cafe': 'food',
  'taverna': 'food',
  'lifeguard': 'lifeguard',
  'shower': 'showers',
  'showers': 'showers',
  'toilet': 'toilets',
  'toilets': 'toilets',
  'umbrella': 'umbrellas',
  'umbrellas': 'umbrellas',
  'sunbed': 'umbrellas',
  'sunbeds': 'umbrellas',
  'water sports': 'water_sports',
  'family friendly': 'family_friendly',
  'family': 'family_friendly',
  'kids': 'family_friendly',
};

// Common Greek locations (islands and major regions)
const LOCATION_KEYWORDS = [
  'corfu', 'crete', 'mykonos', 'santorini', 'rhodes', 'zakynthos', 'kefalonia',
  'paros', 'naxos', 'ios', 'milos', 'samos', 'lesbos', 'chios', 'kos',
  'skiathos', 'skopelos', 'alonissos', 'thasos', 'samothraki', 'limnos',
  'athens', 'thessaloniki', 'volos', 'patras', 'heraklion', 'chania',
  'paleokastritsa', 'agios gordios', 'glyfada', 'pelekas', 'kavos',
  'balos', 'elafonisi', 'vai', 'preveli', 'matala', 'falasarna',
];

/**
 * Extract structured filters and place information from natural language query
 */
export function extractFromQuery(query: string): ExtractedQuery {
  const lowerQuery = query.toLowerCase().trim();
  const extracted: ExtractedQuery = {};
  let remainingText = lowerQuery;

  // Extract type
  const types = new Set<'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER'>();
  Object.entries(TYPE_MAPPINGS).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(lowerQuery)) {
      types.add(value);
      remainingText = remainingText.replace(regex, '');
    }
  });
  if (types.size > 0) extracted.type = Array.from(types);

  // Extract wave conditions
  const waveConditions = new Set<'CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE'>();
  Object.entries(WAVE_MAPPINGS).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(lowerQuery)) {
      waveConditions.add(value);
      remainingText = remainingText.replace(regex, '');
    }
  });
  if (waveConditions.size > 0) extracted.waveConditions = Array.from(waveConditions);

  // Extract parking (check longer phrases first)
  const parkingOptions = new Set<'NONE' | 'ROADSIDE' | 'SMALL_LOT' | 'LARGE_LOT'>();
  const sortedParkingKeys = Object.keys(PARKING_MAPPINGS).sort((a, b) => b.length - a.length);
  sortedParkingKeys.forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(lowerQuery)) {
      parkingOptions.add(PARKING_MAPPINGS[key]);
      remainingText = remainingText.replace(regex, '');
    }
  });
  if (parkingOptions.size > 0) extracted.parking = Array.from(parkingOptions);

  // Extract amenities (check longer phrases first)
  const amenities = new Set<string>();
  const sortedAmenityKeys = Object.keys(AMENITY_MAPPINGS).sort((a, b) => b.length - a.length);
  sortedAmenityKeys.forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(lowerQuery)) {
      amenities.add(AMENITY_MAPPINGS[key]);
      remainingText = remainingText.replace(regex, '');
    }
  });
  if (amenities.size > 0) extracted.amenities = Array.from(amenities);

  // Extract Blue Flag
  if (/\bblue flag\b/gi.test(lowerQuery)) {
    extracted.blueFlag = true;
    remainingText = remainingText.replace(/\bblue flag\b/gi, '');
  }

  // Extract place (check for known locations in remaining text)
  const placeMatches: string[] = [];
  LOCATION_KEYWORDS.forEach(location => {
    const regex = new RegExp(`\\b${location}\\b`, 'gi');
    if (regex.test(remainingText)) {
      placeMatches.push(location);
    }
  });

  // If we found location keywords, use the first one
  if (placeMatches.length > 0) {
    extracted.place = placeMatches[0];
  } else {
    // Otherwise, check if there's any remaining meaningful text (could be a location we don't know)
    const cleanedRemaining = remainingText
      .replace(/\b(in|at|near|with|and|the|a|an|beach|beaches)\b/gi, '')
      .trim();
    
    if (cleanedRemaining.length > 2) {
      // Take the first word/phrase as potential location
      const words = cleanedRemaining.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        extracted.place = words[0];
      }
    }
  }

  return extracted;
}

/**
 * Check if a place string matches the current area context
 */
export function placeMatchesArea(place: string | undefined, areaName: string): boolean {
  if (!place) return true; // No place specified = match
  const placeLower = place.toLowerCase();
  const areaLower = areaName.toLowerCase();
  
  // Check if place is a substring of area or vice versa
  return areaLower.includes(placeLower) || placeLower.includes(areaLower);
}

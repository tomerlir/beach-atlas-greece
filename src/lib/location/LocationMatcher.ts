/**
 * Advanced Location Matching System
 * Implements industry-standard location filtering with geocoding and fuzzy matching
 */

export interface LocationMatch {
  place: string;
  area: string;
  confidence: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  aliases: string[];
  hierarchy: {
    island?: string;
    region?: string;
    city?: string;
  };
}

export interface LocationFilter {
  type: 'exact' | 'fuzzy' | 'proximity' | 'hierarchical';
  value: string | LocationMatch;
  radius?: number; // in kilometers
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class LocationMatcher {
  private static instance: LocationMatcher;
  
  // Comprehensive location database with hierarchical relationships
  private locationDatabase: Map<string, LocationMatch> = new Map();
  
  // Location aliases and variations
  private aliases: Map<string, string> = new Map();
  
  // Geographic hierarchy mapping
  private hierarchy: Map<string, string[]> = new Map();

  private constructor() {
    this.initializeLocationDatabase();
  }

  public static getInstance(): LocationMatcher {
    if (!LocationMatcher.instance) {
      LocationMatcher.instance = new LocationMatcher();
    }
    return LocationMatcher.instance;
  }

  /**
   * Initialize comprehensive location database
   */
  private initializeLocationDatabase(): void {
    // Greek Islands and Regions with coordinates and aliases
    const locations = [
      // Major Islands
      {
        place: 'crete',
        area: 'crete',
        confidence: 1.0,
        coordinates: { latitude: 35.2401, longitude: 24.8093 },
        aliases: ['crete', 'kriti', 'kreta'],
        hierarchy: { island: 'crete', region: 'crete' }
      },
      {
        place: 'mykonos',
        area: 'mykonos',
        confidence: 1.0,
        coordinates: { latitude: 37.4467, longitude: 25.3289 },
        aliases: ['mykonos', 'mikonos', 'mykono'],
        hierarchy: { island: 'mykonos', region: 'cyclades' }
      },
      {
        place: 'santorini',
        area: 'santorini',
        confidence: 1.0,
        coordinates: { latitude: 36.3932, longitude: 25.4615 },
        aliases: ['santorini', 'thira', 'thera', 'fira'],
        hierarchy: { island: 'santorini', region: 'cyclades' }
      },
      {
        place: 'corfu',
        area: 'corfu',
        confidence: 1.0,
        coordinates: { latitude: 39.6243, longitude: 19.9217 },
        aliases: ['corfu', 'kerkyra', 'kerkira'],
        hierarchy: { island: 'corfu', region: 'ionian' }
      },
      {
        place: 'rhodes',
        area: 'rhodes',
        confidence: 1.0,
        coordinates: { latitude: 36.4412, longitude: 28.2225 },
        aliases: ['rhodes', 'rodos', 'rodes'],
        hierarchy: { island: 'rhodes', region: 'dodecanese' }
      },
      {
        place: 'zakynthos',
        area: 'zakynthos',
        confidence: 1.0,
        coordinates: { latitude: 37.7829, longitude: 20.8956 },
        aliases: ['zakynthos', 'zante', 'zakinthos'],
        hierarchy: { island: 'zakynthos', region: 'ionian' }
      },
      {
        place: 'kefalonia',
        area: 'kefalonia',
        confidence: 1.0,
        coordinates: { latitude: 38.1754, longitude: 20.5692 },
        aliases: ['kefalonia', 'kefallonia', 'kephalonia'],
        hierarchy: { island: 'kefalonia', region: 'ionian' }
      },
      {
        place: 'lefkada',
        area: 'lefkada',
        confidence: 1.0,
        coordinates: { latitude: 38.1754, longitude: 20.5692 },
        aliases: ['lefkada', 'leukada', 'lefkas'],
        hierarchy: { island: 'lefkada', region: 'ionian' }
      },
      
      // Cyclades Islands
      {
        place: 'paros',
        area: 'paros',
        confidence: 1.0,
        coordinates: { latitude: 37.0853, longitude: 25.1477 },
        aliases: ['paros', 'paro'],
        hierarchy: { island: 'paros', region: 'cyclades' }
      },
      {
        place: 'naxos',
        area: 'naxos',
        confidence: 1.0,
        coordinates: { latitude: 37.1036, longitude: 25.3767 },
        aliases: ['naxos', 'naxo'],
        hierarchy: { island: 'naxos', region: 'cyclades' }
      },
      {
        place: 'ios',
        area: 'ios',
        confidence: 1.0,
        coordinates: { latitude: 36.7214, longitude: 25.2853 },
        aliases: ['ios', 'io'],
        hierarchy: { island: 'ios', region: 'cyclades' }
      },
      {
        place: 'milos',
        area: 'milos',
        confidence: 1.0,
        coordinates: { latitude: 36.7214, longitude: 24.4253 },
        aliases: ['milos', 'milo', 'melos'],
        hierarchy: { island: 'milos', region: 'cyclades' }
      },
      
      // Major Cities and Regions
      {
        place: 'athens',
        area: 'attica',
        confidence: 1.0,
        coordinates: { latitude: 37.9755, longitude: 23.7348 },
        aliases: ['athens', 'athenai', 'athina'],
        hierarchy: { city: 'athens', region: 'attica' }
      },
      {
        place: 'thessaloniki',
        area: 'chalkidiki',
        confidence: 1.0,
        coordinates: { latitude: 40.6401, longitude: 22.9444 },
        aliases: ['thessaloniki', 'salonika', 'thessalonica'],
        hierarchy: { city: 'thessaloniki', region: 'chalkidiki' }
      },
      {
        place: 'chalkidiki',
        area: 'chalkidiki',
        confidence: 1.0,
        coordinates: { latitude: 40.3000, longitude: 23.5000 },
        aliases: ['chalkidiki', 'halkidiki', 'chalcidice'],
        hierarchy: { region: 'chalkidiki' }
      },
      
      // Sporades Islands
      {
        place: 'skiathos',
        area: 'skiathos',
        confidence: 1.0,
        coordinates: { latitude: 39.1667, longitude: 23.4833 },
        aliases: ['skiathos', 'skiatos'],
        hierarchy: { island: 'skiathos', region: 'sporades' }
      },
      {
        place: 'skopelos',
        area: 'skopelos',
        confidence: 1.0,
        coordinates: { latitude: 39.1167, longitude: 23.7167 },
        aliases: ['skopelos', 'skopelo'],
        hierarchy: { island: 'skopelos', region: 'sporades' }
      },
      
      // Dodecanese Islands
      {
        place: 'kos',
        area: 'kos',
        confidence: 1.0,
        coordinates: { latitude: 36.8933, longitude: 27.2881 },
        aliases: ['kos', 'coos'],
        hierarchy: { island: 'kos', region: 'dodecanese' }
      },
      {
        place: 'patmos',
        area: 'patmos',
        confidence: 1.0,
        coordinates: { latitude: 37.3250, longitude: 26.5431 },
        aliases: ['patmos', 'patmo'],
        hierarchy: { island: 'patmos', region: 'dodecanese' }
      }
    ];

    // Populate location database
    locations.forEach(location => {
      this.locationDatabase.set(location.place, location);
      
      // Add aliases
      location.aliases.forEach(alias => {
        this.aliases.set(alias.toLowerCase(), location.place);
      });
      
      // Add hierarchy relationships
      if (location.hierarchy.region) {
        if (!this.hierarchy.has(location.hierarchy.region)) {
          this.hierarchy.set(location.hierarchy.region, []);
        }
        this.hierarchy.get(location.hierarchy.region)!.push(location.place);
      }
    });
  }

  /**
   * Find best location match using multiple strategies
   */
  public findLocationMatch(query: string): LocationMatch | null {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Strategy 1: Exact match
    let match = this.exactMatch(normalizedQuery);
    if (match) return match;
    
    // Strategy 2: Alias match
    match = this.aliasMatch(normalizedQuery);
    if (match) return match;
    
    // Strategy 3: Fuzzy match
    match = this.fuzzyMatch(normalizedQuery);
    if (match) return match;
    
    // Strategy 4: Partial match
    match = this.partialMatch(normalizedQuery);
    if (match) return match;
    
    return null;
  }

  /**
   * Exact match strategy
   */
  private exactMatch(query: string): LocationMatch | null {
    return this.locationDatabase.get(query) || null;
  }

  /**
   * Alias match strategy
   */
  private aliasMatch(query: string): LocationMatch | null {
    const canonicalPlace = this.aliases.get(query);
    if (canonicalPlace) {
      return this.locationDatabase.get(canonicalPlace) || null;
    }
    return null;
  }

  /**
   * Fuzzy match strategy using Levenshtein distance
   */
  private fuzzyMatch(query: string): LocationMatch | null {
    let bestMatch: LocationMatch | null = null;
    let bestScore = 0;
    const threshold = 0.7;

    for (const [place, location] of this.locationDatabase) {
      // Check against place name
      const placeScore = this.calculateSimilarity(query, place);
      if (placeScore > bestScore && placeScore >= threshold) {
        bestScore = placeScore;
        bestMatch = { ...location, confidence: placeScore };
      }

      // Check against aliases
      for (const alias of location.aliases) {
        const aliasScore = this.calculateSimilarity(query, alias);
        if (aliasScore > bestScore && aliasScore >= threshold) {
          bestScore = aliasScore;
          bestMatch = { ...location, confidence: aliasScore };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Partial match strategy for compound queries
   */
  private partialMatch(query: string): LocationMatch | null {
    const words = query.split(/\s+/);
    
    for (const word of words) {
      if (word.length >= 4) { // Minimum length for partial matching
        const match = this.exactMatch(word) || this.aliasMatch(word);
        if (match) {
          return { ...match, confidence: match.confidence * 0.8 }; // Reduce confidence for partial matches
        }
      }
    }
    
    return null;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Check if a location matches an area using hierarchical relationships
   */
  public doesLocationMatchArea(location: string | undefined, areaName: string): boolean {
    if (!location) return true;
    
    const locationMatch = this.findLocationMatch(location);
    if (!locationMatch) return false;
    
    const normalizedArea = areaName.toLowerCase().trim();
    
    // Direct match
    if (locationMatch.area === normalizedArea) return true;
    
    // Hierarchical match
    if (locationMatch.hierarchy.region === normalizedArea) return true;
    if (locationMatch.hierarchy.island === normalizedArea) return true;
    if (locationMatch.hierarchy.city === normalizedArea) return true;
    
    // Check if area is in the same region/island
    const areaLocation = this.findLocationMatch(normalizedArea);
    if (areaLocation) {
      if (locationMatch.hierarchy.region && areaLocation.hierarchy.region) {
        return locationMatch.hierarchy.region === areaLocation.hierarchy.region;
      }
      if (locationMatch.hierarchy.island && areaLocation.hierarchy.island) {
        return locationMatch.hierarchy.island === areaLocation.hierarchy.island;
      }
    }
    
    return false;
  }

  /**
   * Get all locations in a region
   */
  public getLocationsInRegion(region: string): LocationMatch[] {
    const locations: LocationMatch[] = [];
    const normalizedRegion = region.toLowerCase().trim();
    
    for (const [place, location] of this.locationDatabase) {
      if (location.hierarchy.region === normalizedRegion || 
          location.area === normalizedRegion) {
        locations.push(location);
      }
    }
    
    return locations;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  public calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create location filter for proximity-based searches
   */
  public createProximityFilter(
    center: { latitude: number; longitude: number },
    radiusKm: number
  ): LocationFilter {
    return {
      type: 'proximity',
      value: 'proximity',
      radius: radiusKm,
      coordinates: center
    };
  }

  /**
   * Get location suggestions based on partial input
   */
  public getLocationSuggestions(partialInput: string, maxSuggestions: number = 10): LocationMatch[] {
    const normalizedInput = partialInput.toLowerCase().trim();
    const suggestions: LocationMatch[] = [];

    // Exact matches first
    for (const [place, location] of this.locationDatabase) {
      if (place.startsWith(normalizedInput) || 
          location.aliases.some(alias => alias.startsWith(normalizedInput))) {
        suggestions.push(location);
        if (suggestions.length >= maxSuggestions) break;
      }
    }

    // Fuzzy matches if we need more suggestions
    if (suggestions.length < maxSuggestions) {
      for (const [place, location] of this.locationDatabase) {
        if (suggestions.some(s => s.place === place)) continue;
        
        const similarity = this.calculateSimilarity(normalizedInput, place);
        if (similarity > 0.6) {
          suggestions.push({ ...location, confidence: similarity });
          if (suggestions.length >= maxSuggestions) break;
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get location statistics
   */
  public getStats(): {
    totalLocations: number;
    totalAliases: number;
    regions: string[];
  } {
    const regions = Array.from(new Set(
      Array.from(this.locationDatabase.values())
        .map(loc => loc.hierarchy.region)
        .filter(Boolean)
    ));
    
    return {
      totalLocations: this.locationDatabase.size,
      totalAliases: this.aliases.size,
      regions
    };
  }
}

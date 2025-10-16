/**
 * Enhanced Location Extractor
 * Integrates advanced location matching with NLP processing
 */

import { LocationMatcher, LocationMatch } from "../location/LocationMatcher.js";
import { EntityRecognitionResult } from "./EntityRecognizer";

export interface LocationExtractionResult {
  primaryLocation?: LocationMatch;
  secondaryLocations: LocationMatch[];
  allLocations: LocationMatch[];
  locationQuery: string;
  confidence: number;
  searchStrategy: "exact" | "fuzzy" | "hierarchical" | "proximity" | "multi";
  remainingQuery: string;
}

export class EnhancedLocationExtractor {
  private static instance: EnhancedLocationExtractor;
  private locationMatcher: LocationMatcher;

  private constructor() {
    this.locationMatcher = LocationMatcher.getInstance();
  }

  public static getInstance(): EnhancedLocationExtractor {
    if (!EnhancedLocationExtractor.instance) {
      EnhancedLocationExtractor.instance = new EnhancedLocationExtractor();
    }
    return EnhancedLocationExtractor.instance;
  }

  /**
   * Extract locations from natural language query with advanced matching
   */
  public extractLocations(
    query: string,
    entities: EntityRecognitionResult
  ): LocationExtractionResult {
    // Handle null/undefined input gracefully
    if (!query || typeof query !== "string") {
      query = "";
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Strategy 1: Use entity recognition results first
    let locations: LocationMatch[] = [];
    let searchStrategy: LocationExtractionResult["searchStrategy"] = "exact";

    if (entities.places.length > 0) {
      // Process recognized place entities
      for (const placeEntity of entities.places) {
        const match = this.locationMatcher.findLocationMatch(placeEntity.normalized);
        if (match) {
          locations.push(match);
        }
      }
    }

    // Strategy 2: Multi-location detection (check before direct matching)
    if (locations.length === 0) {
      const multiLocationResult = this.detectMultipleLocations(normalizedQuery);
      if (multiLocationResult.length > 0) {
        locations = multiLocationResult;
        searchStrategy = "multi";
      }
    }

    // Strategy 3: If no multi-location found, try direct query matching
    if (locations.length === 0) {
      const directMatch = this.locationMatcher.findLocationMatch(normalizedQuery);
      if (directMatch) {
        locations.push(directMatch);
        searchStrategy = "fuzzy";
      }
    }

    // Strategy 4: Proximity-based search detection
    if (locations.length === 0) {
      const proximityResult = this.detectProximitySearch(normalizedQuery);
      if (proximityResult) {
        locations = [proximityResult];
        searchStrategy = "proximity";
      }
    }

    // Strategy 5: Hierarchical search (e.g., "Cyclades beaches")
    if (locations.length === 0) {
      const hierarchicalResult = this.detectHierarchicalSearch(normalizedQuery);
      if (hierarchicalResult.length > 0) {
        locations = hierarchicalResult;
        searchStrategy = "hierarchical";
      }
    }

    // Calculate overall confidence
    const confidence = this.calculateLocationConfidence(locations, normalizedQuery);

    // Clean remaining query
    const remainingQuery = this.cleanQueryFromLocations(query, locations);

    return {
      primaryLocation: locations[0],
      secondaryLocations: locations.slice(1),
      allLocations: locations,
      locationQuery: normalizedQuery,
      confidence,
      searchStrategy,
      remainingQuery,
    };
  }

  /**
   * Detect multiple locations in a single query
   */
  private detectMultipleLocations(query: string): LocationMatch[] {
    const locations: LocationMatch[] = [];

    // Common conjunction patterns
    const conjunctionPatterns = [/\b(and|&|,)\b/gi, /\b(plus|with|along with)\b/gi];

    // Split query by conjunctions
    let parts: string[] = [query];
    for (const pattern of conjunctionPatterns) {
      const newParts: string[] = [];
      for (const part of parts) {
        newParts.push(
          ...part
            .split(pattern)
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
        );
      }
      parts = newParts;
    }

    // Try to match each part as a location
    for (const part of parts) {
      const match = this.locationMatcher.findLocationMatch(part);
      if (match && !locations.some((loc) => loc.place === match.place)) {
        locations.push(match);
      }
    }

    return locations;
  }

  /**
   * Detect proximity-based searches
   */
  private detectProximitySearch(query: string): LocationMatch | null {
    const proximityPatterns = [
      /\bnear\s+([a-zA-Z\s]+)\b/i,
      /\bclose\s+to\s+([a-zA-Z\s]+)\b/i,
      /\baround\s+([a-zA-Z\s]+)\b/i,
      /\bwithin\s+(\d+)\s*(km|kilometers?|miles?)\s+of\s+([a-zA-Z\s]+)\b/i,
    ];

    for (const pattern of proximityPatterns) {
      const match = query.match(pattern);
      if (match) {
        const locationText = match[1] || match[3]; // Handle different capture groups
        if (locationText) {
          return this.locationMatcher.findLocationMatch(locationText.trim());
        }
      }
    }

    return null;
  }

  /**
   * Detect hierarchical searches (region-based)
   */
  private detectHierarchicalSearch(query: string): LocationMatch[] {
    const locations: LocationMatch[] = [];

    // Common region names
    const regionNames = [
      "cyclades",
      "dodecanese",
      "ionian",
      "sporades",
      "north aegean",
      "south aegean",
      "attica",
      "thessaly",
      "macedonia",
      "thrace",
      "epirus",
      "peloponnese",
    ];

    for (const region of regionNames) {
      if (query.includes(region)) {
        const regionLocations = this.locationMatcher.getLocationsInRegion(region);
        locations.push(...regionLocations);
      }
    }

    return locations;
  }

  /**
   * Calculate confidence score for location extraction
   */
  private calculateLocationConfidence(locations: LocationMatch[], originalQuery: string): number {
    if (locations.length === 0) return 0;

    // Base confidence from location matches
    const avgLocationConfidence =
      locations.reduce((sum, loc) => sum + loc.confidence, 0) / locations.length;

    // Boost confidence for exact matches
    const exactMatchBoost = locations.some((loc) =>
      originalQuery.toLowerCase().includes(loc.place.toLowerCase())
    )
      ? 0.1
      : 0;

    // Boost confidence for multiple locations (indicates complex query)
    const multiLocationBoost = locations.length > 1 ? 0.05 : 0;

    return Math.min(1.0, avgLocationConfidence + exactMatchBoost + multiLocationBoost);
  }

  /**
   * Clean query by removing detected locations
   */
  private cleanQueryFromLocations(originalQuery: string, locations: LocationMatch[]): string {
    let cleaned = originalQuery;

    // Remove detected location names and their aliases
    for (const location of locations) {
      // Remove primary place name
      const placePattern = new RegExp(
        `\\b${location.place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      cleaned = cleaned.replace(placePattern, " ");

      // Remove aliases
      for (const alias of location.aliases) {
        const aliasPattern = new RegExp(
          `\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        cleaned = cleaned.replace(aliasPattern, " ");
      }
    }

    // Remove common location-related words
    const locationWords = [
      "in",
      "at",
      "near",
      "around",
      "close to",
      "within",
      "of",
      "from",
      "beaches",
      "beach",
      "island",
      "islands",
      "region",
      "area",
      "place",
    ];

    for (const word of locationWords) {
      const pattern = new RegExp(`\\b${word}\\b`, "gi");
      cleaned = cleaned.replace(pattern, " ");
    }

    // Clean up extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  /**
   * Check if a location matches an area using enhanced matching
   */
  public doesLocationMatchArea(location: string | undefined, areaName: string): boolean {
    return this.locationMatcher.doesLocationMatchArea(location, areaName);
  }

  /**
   * Get location suggestions for autocomplete
   */
  public getLocationSuggestions(
    partialInput: string,
    maxSuggestions: number = 10
  ): LocationMatch[] {
    return this.locationMatcher.getLocationSuggestions(partialInput, maxSuggestions);
  }

  /**
   * Validate location query
   */
  public validateLocationQuery(query: string): {
    isValid: boolean;
    suggestions?: string[];
    confidence?: number;
    matchedLocation?: LocationMatch;
  } {
    const match = this.locationMatcher.findLocationMatch(query);

    if (match && match.confidence > 0.8) {
      return {
        isValid: true,
        confidence: match.confidence,
        matchedLocation: match,
      };
    }

    const suggestions = this.getLocationSuggestions(query, 5).map((loc) => loc.place);

    return {
      isValid: false,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * Get location statistics
   */
  public getLocationStats(): {
    totalLocations: number;
    totalAliases: number;
    regions: string[];
  } {
    return this.locationMatcher.getStats();
  }
}

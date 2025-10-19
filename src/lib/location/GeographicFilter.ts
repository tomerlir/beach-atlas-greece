/**
 * Geographic Filtering System
 * Implements advanced geographic filtering with coordinate-based searches
 */

import { Beach } from "@/types/beach";
import { LocationMatcher, LocationMatch } from "./LocationMatcher.js";

export interface GeographicSearchResult {
  beaches: (Beach & { distance?: number })[];
  appliedFilters: {
    location?: LocationMatch;
    proximity?: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
    area?: string;
  };
  totalResults: number;
  searchRadius?: number;
}

export interface ProximitySearchOptions {
  center: { latitude: number; longitude: number };
  radiusKm: number;
  maxResults?: number;
}

export class GeographicFilter {
  private static instance: GeographicFilter;
  private locationMatcher: LocationMatcher;

  private constructor() {
    this.locationMatcher = LocationMatcher.getInstance();
  }

  public static getInstance(): GeographicFilter {
    if (!GeographicFilter.instance) {
      GeographicFilter.instance = new GeographicFilter();
    }
    return GeographicFilter.instance;
  }

  /**
   * Filter beaches by location using advanced matching
   */
  public filterByLocation(
    beaches: Beach[],
    locationQuery: string,
    options: {
      exactMatch?: boolean;
      includeNearby?: boolean;
      nearbyRadiusKm?: number;
    } = {}
  ): GeographicSearchResult {
    const { exactMatch = false, includeNearby = false, nearbyRadiusKm = 50 } = options;

    // Find location match
    const locationMatch = this.locationMatcher.findLocationMatch(locationQuery);

    if (!locationMatch) {
      // Fallback to text-based filtering
      return this.fallbackTextFilter(beaches, locationQuery);
    }

    let filteredBeaches: (Beach & { distance?: number })[] = [];
    const appliedFilters: GeographicSearchResult["appliedFilters"] = {
      location: locationMatch,
    };

    // Primary filtering by area
    const areaBeaches = beaches.filter(
      (beach) => beach.area?.toLowerCase() === locationMatch.area.toLowerCase()
    );

    // Calculate distances if coordinates are available
    if (locationMatch.coordinates) {
      filteredBeaches = areaBeaches.map((beach) => ({
        ...beach,
        distance: this.calculateBeachDistance(beach, locationMatch.coordinates!),
      }));

      // Sort by distance
      filteredBeaches.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      // Include nearby beaches if requested
      if (includeNearby && !exactMatch) {
        const nearbyBeaches = beaches
          .filter((beach) => beach.area?.toLowerCase() !== locationMatch.area.toLowerCase())
          .map((beach) => ({
            ...beach,
            distance: this.calculateBeachDistance(beach, locationMatch.coordinates!),
          }))
          .filter((beach) => (beach.distance || Infinity) <= nearbyRadiusKm)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));

        filteredBeaches = [...filteredBeaches, ...nearbyBeaches];
      }
    } else {
      filteredBeaches = areaBeaches;
    }

    return {
      beaches: filteredBeaches,
      appliedFilters,
      totalResults: filteredBeaches.length,
    };
  }

  /**
   * Filter beaches by proximity to a point
   */
  public filterByProximity(
    beaches: Beach[],
    options: ProximitySearchOptions
  ): GeographicSearchResult {
    const { center, radiusKm, maxResults = 100 } = options;

    const beachesWithDistance = beaches.map((beach) => ({
      ...beach,
      distance: this.calculateBeachDistance(beach, center),
    }));

    const filteredBeaches = beachesWithDistance
      .filter((beach) => (beach.distance ?? Infinity) <= radiusKm)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, maxResults);

    return {
      beaches: filteredBeaches,
      appliedFilters: {
        proximity: {
          center,
          radius: radiusKm,
        },
      },
      totalResults: filteredBeaches.length,
      searchRadius: radiusKm,
    };
  }

  /**
   * Filter beaches by area with hierarchical matching
   */
  public filterByArea(
    beaches: Beach[],
    areaName: string,
    options: {
      includeSubAreas?: boolean;
      includeParentAreas?: boolean;
    } = {}
  ): GeographicSearchResult {
    const { includeSubAreas = false, includeParentAreas = false } = options;

    // Find area match
    const areaMatch = this.locationMatcher.findLocationMatch(areaName);

    if (!areaMatch) {
      // Fallback to exact area matching
      const filteredBeaches = beaches.filter(
        (beach) => beach.area?.toLowerCase() === areaName.toLowerCase()
      );

      return {
        beaches: filteredBeaches,
        appliedFilters: { area: areaName },
        totalResults: filteredBeaches.length,
      };
    }

    let filteredBeaches: Beach[] = [];

    // Primary area filtering
    filteredBeaches = beaches.filter(
      (beach) => beach.area?.toLowerCase() === areaMatch.area.toLowerCase()
    );

    // Include sub-areas if requested
    if (includeSubAreas && areaMatch.hierarchy.region) {
      const subAreaBeaches = beaches.filter((beach) => {
        const beachLocation = this.locationMatcher.findLocationMatch(beach.area || "");
        return (
          beachLocation?.hierarchy.region === areaMatch.hierarchy.region &&
          beach.area?.toLowerCase() !== areaMatch.area.toLowerCase()
        );
      });
      filteredBeaches = [...filteredBeaches, ...subAreaBeaches];
    }

    // Include parent areas if requested
    if (includeParentAreas && areaMatch.hierarchy.region) {
      const parentAreaBeaches = beaches.filter((beach) => {
        const beachLocation = this.locationMatcher.findLocationMatch(beach.area || "");
        return beachLocation?.hierarchy.region === areaMatch.hierarchy.region;
      });
      filteredBeaches = [...filteredBeaches, ...parentAreaBeaches];
    }

    // Remove duplicates
    const uniqueBeaches = filteredBeaches.filter(
      (beach, index, self) => index === self.findIndex((b) => b.id === beach.id)
    );

    return {
      beaches: uniqueBeaches,
      appliedFilters: {
        location: areaMatch,
        area: areaMatch.area,
      },
      totalResults: uniqueBeaches.length,
    };
  }

  /**
   * Multi-location search (e.g., "beaches in Crete and Mykonos")
   */
  public filterByMultipleLocations(
    beaches: Beach[],
    locationQueries: string[],
    options: {
      union?: boolean; // true = OR logic, false = AND logic
      maxResultsPerLocation?: number;
    } = {}
  ): GeographicSearchResult {
    const { union = true, maxResultsPerLocation = 50 } = options;

    const locationResults: GeographicSearchResult[] = [];
    const allMatches: LocationMatch[] = [];

    // Process each location query
    for (const query of locationQueries) {
      const result = this.filterByLocation(beaches, query, { exactMatch: true });
      if (result.appliedFilters.location) {
        locationResults.push(result);
        allMatches.push(result.appliedFilters.location);
      }
    }

    if (locationResults.length === 0) {
      return {
        beaches: [],
        appliedFilters: {},
        totalResults: 0,
      };
    }

    const combinedBeaches: (Beach & { distance?: number })[] = [];

    if (union) {
      // OR logic: combine all results
      const beachIds = new Set<string>();
      for (const result of locationResults) {
        for (const beach of result.beaches.slice(0, maxResultsPerLocation)) {
          if (!beachIds.has(beach.id)) {
            beachIds.add(beach.id);
            combinedBeaches.push(beach);
          }
        }
      }
    } else {
      // AND logic: only beaches that appear in all results
      const beachCounts = new Map<string, number>();
      for (const result of locationResults) {
        for (const beach of result.beaches) {
          beachCounts.set(beach.id, (beachCounts.get(beach.id) || 0) + 1);
        }
      }

      const requiredCount = locationResults.length;
      for (const [beachId, count] of beachCounts) {
        if (count === requiredCount) {
          const beach = beaches.find((b) => b.id === beachId);
          if (beach) {
            combinedBeaches.push(beach as Beach & { distance?: number });
          }
        }
      }
    }

    // Sort by distance if available
    combinedBeaches.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return {
      beaches: combinedBeaches,
      appliedFilters: {
        location: allMatches[0], // Primary location
      },
      totalResults: combinedBeaches.length,
    };
  }

  /**
   * Calculate distance between a beach and a coordinate point
   */
  private calculateBeachDistance(
    beach: Beach,
    coordinates: { latitude: number; longitude: number }
  ): number {
    if (
      beach.latitude === null ||
      beach.latitude === undefined ||
      beach.longitude === null ||
      beach.longitude === undefined
    ) {
      return Infinity; // No coordinates available
    }

    return this.locationMatcher.calculateDistance(
      { latitude: beach.latitude, longitude: beach.longitude },
      coordinates
    );
  }

  /**
   * Fallback text-based filtering when location matching fails
   */
  private fallbackTextFilter(beaches: Beach[], locationQuery: string): GeographicSearchResult {
    const normalizedQuery = locationQuery.toLowerCase().trim();

    const filteredBeaches = beaches.filter((beach) => {
      const beachArea = beach.area?.toLowerCase() || "";
      const beachName = beach.name?.toLowerCase() || "";

      return beachArea.includes(normalizedQuery) || beachName.includes(normalizedQuery);
    });

    return {
      beaches: filteredBeaches,
      appliedFilters: {},
      totalResults: filteredBeaches.length,
    };
  }

  /**
   * Get location suggestions based on partial input
   */
  public getLocationSuggestions(
    partialInput: string,
    maxSuggestions: number = 10
  ): LocationMatch[] {
    return this.locationMatcher.getLocationSuggestions(partialInput, maxSuggestions);
  }

  /**
   * Validate location query and provide feedback
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

    // Provide suggestions for invalid queries
    const suggestions = this.getLocationSuggestions(query, 5).map((loc) => loc.place);

    return {
      isValid: false,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }
}

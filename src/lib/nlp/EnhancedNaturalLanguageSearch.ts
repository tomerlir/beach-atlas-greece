/**
 * Enhanced Natural Language Search Module
 * Integrates advanced NLP techniques for improved query understanding
 */

import { FilterState } from "@/hooks/useUrlState";
import { SmartEntityRecognizer, EntityRecognitionResult } from "./SmartEntityRecognizer";
import { SentimentAnalyzer, SentimentResult, IntentAnalysis } from "./SentimentAnalyzer";
import { FuzzyMatcher } from "./FuzzyMatcher";
import { BeachType, WaveCondition, BEACH_TYPES, WAVE_CONDITIONS } from "@/types/common";

// Location extraction result interface (moved from EnhancedLocationExtractor)
export interface LocationExtractionResult {
  primaryLocation?: {
    place: string;
    confidence: number;
    matchType: string;
  };
  secondaryLocations: Array<{
    place: string;
    confidence: number;
    matchType: string;
  }>;
  allLocations: Array<{
    place: string;
    confidence: number;
    matchType: string;
  }>;
  locationQuery: string;
  confidence: number;
  searchStrategy:
    | "exact"
    | "fuzzy"
    | "word-level"
    | "multi"
    | "proximity"
    | "hierarchical"
    | "none";
  remainingQuery: string;
}

export interface EnhancedExtractionResult {
  filters: Partial<FilterState>;
  place?: string;
  originalQuery: string;
  cleanedSearchTerm: string;
  confidence: number;
  sentiment: SentimentResult;
  intent: IntentAnalysis;
  entities: EntityRecognitionResult;
  locationExtraction: LocationExtractionResult;
  processingTime: number;
  suggestions?: string[];
}

export interface SearchContext {
  userPreferences?: string[];
  searchHistory?: string[];
  location?: string;
  timeOfDay?: "morning" | "afternoon" | "evening";
  season?: "spring" | "summer" | "autumn" | "winter";
}

export class EnhancedNaturalLanguageSearch {
  private static instance: EnhancedNaturalLanguageSearch;
  private entityRecognizer: SmartEntityRecognizer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private fuzzyMatcher: FuzzyMatcher;

  // Known places for enhanced matching
  private knownPlaces: string[] = [
    "crete",
    "corfu",
    "mykonos",
    "santorini",
    "rhodes",
    "zakynthos",
    "kefalonia",
    "paros",
    "naxos",
    "ios",
    "milos",
    "sifnos",
    "folegandros",
    "amorgos",
    "skiathos",
    "skopelos",
    "alonissos",
    "lesbos",
    "chios",
    "samos",
    "kos",
    "patmos",
    "syros",
    "tinos",
    "andros",
    "kea",
    "kythnos",
    "paleokastritsa",
    "oia",
    "fira",
    "lindos",
    "myrtos",
    "navagio",
    "balos",
    "elafonisi",
    "falassarna",
    "gramvousa",
    // Major Greek cities and regions
    "attica",
    "chalkidiki",
    "patras",
    "heraklion",
    "larissa",
    "volos",
    "ioannina",
    "kavala",
    "serres",
    "drama",
    "alexandroupoli",
    "komotini",
    "xanthi",
    "katerini",
    "trikala",
    "lamia",
    "agrinio",
    "kalamata",
    "sparti",
    "tripoli",
    "corinth",
    "argos",
    "nafplio",
    "mycenae",
    "epidaurus",
    "olympia",
    "delphi",
    "meteora",
    "mount athos",
    // Additional popular destinations
    "lefkada",
    "ithaca",
    "kefalonia",
    "zakynthos",
    "kythira",
    "antikythera",
    "hydra",
    "spetses",
    "poros",
    "aegina",
    "salamis",
    "evia",
    "skopelos",
    "alonnissos",
    "skyros",
    "limnos",
    "thasos",
    "samothrace",
    "lesvos",
    "chios",
    "psara",
    "ikaria",
    "fourni",
    "samos",
    "patmos",
    "lipsi",
    "kalymnos",
    "kos",
    "nissyros",
    "tilos",
    "symi",
    "rhodes",
    "karpathos",
    "kasos",
    "kastellorizo",
    "crete",
    "gavdos",
    "kythira",
    "antikythera",
  ];

  // Blue flag patterns
  private blueFlagPatterns = [
    /\bblue\s+flag\s+certified\b/i,
    /\bblue\s+flag\s+certification\b/i,
    /\bblue\s+flag\s+award\b/i,
    /\bblue\s+flag\s+status\b/i,
    /\bblue\s+flag\s+beach\b/i,
    /\bblue-flag\s+certified\b/i,
    /\bblue-flag\s+beach\b/i,
    /\bawarded\s+blue\s+flag\b/i,
    /\bblue\s+flag\b/i,
  ];

  private constructor() {
    this.entityRecognizer = SmartEntityRecognizer.getInstance();
    this.sentimentAnalyzer = SentimentAnalyzer.getInstance();
    this.fuzzyMatcher = FuzzyMatcher.getInstance();
  }

  public static getInstance(): EnhancedNaturalLanguageSearch {
    if (!EnhancedNaturalLanguageSearch.instance) {
      EnhancedNaturalLanguageSearch.instance = new EnhancedNaturalLanguageSearch();
    }
    return EnhancedNaturalLanguageSearch.instance;
  }

  /**
   * Enhanced natural language processing with unified intelligent location detection
   */
  public async processQuery(
    query: string,
    context?: SearchContext
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Unified intelligent location detection (replaces competing systems)
      const locationExtraction = this.extractLocationsIntelligently(query);

      // Step 2: Recognize entities (excluding places - handled by unified location detection)
      const entities = await this.entityRecognizer.recognizeEntities(query);

      // Step 3: Analyze sentiment and intent
      const sentiment = await this.sentimentAnalyzer.analyzeSentiment(query);
      const intent = this.sentimentAnalyzer.analyzeIntent(query, sentiment.polarity);

      // Step 4: Extract filters using enhanced techniques
      const filters = await this.extractFilters(query, entities, sentiment, intent, context);

      // Determine place from unified location extraction
      const place = locationExtraction.primaryLocation?.place;

      // Clean search term using location extraction results
      const cleanedSearchTerm = locationExtraction.remainingQuery;

      // Calculate overall confidence including location extraction
      const confidence = this.calculateConfidence(entities, sentiment, intent, locationExtraction);

      // Generate suggestions
      const suggestions = this.generateSuggestions(
        query,
        entities,
        sentiment,
        intent,
        locationExtraction
      );

      const processingTime = Date.now() - startTime;

      return {
        filters,
        place,
        originalQuery: query,
        cleanedSearchTerm,
        confidence,
        sentiment,
        intent,
        entities,
        locationExtraction,
        processingTime,
        suggestions,
      };
    } catch (error) {
      console.error("Enhanced NLP processing failed:", error);

      // Fallback to basic processing
      return this.fallbackProcessing(query, Date.now() - startTime);
    }
  }

  /**
   * Unified intelligent location detection that replaces competing systems
   * Uses context-aware matching and advanced NLP techniques
   */
  private extractLocationsIntelligently(query: string): LocationExtractionResult {
    const normalizedQuery = query.toLowerCase().trim();

    // Strategy 1: Direct exact matching (highest confidence)
    const exactMatch = this.knownPlaces.find((place) =>
      normalizedQuery.includes(place.toLowerCase())
    );

    if (exactMatch) {
      return {
        primaryLocation: {
          place: exactMatch,
          confidence: 0.95,
          matchType: "exact",
        },
        secondaryLocations: [],
        allLocations: [
          {
            place: exactMatch,
            confidence: 0.95,
            matchType: "exact",
          },
        ],
        locationQuery: normalizedQuery,
        confidence: 0.95,
        searchStrategy: "exact",
        remainingQuery: this.removeLocationFromQuery(query, exactMatch),
      };
    }

    // Strategy 2: Fuzzy matching with context awareness
    const fuzzyMatches = this.fuzzyMatcher.findMatches(normalizedQuery, this.knownPlaces, {
      threshold: 0.7,
      maxResults: 3,
      methods: ["fuzzy", "phonetic", "semantic"],
    });

    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      return {
        primaryLocation: {
          place: bestMatch.text,
          confidence: bestMatch.confidence,
          matchType: "fuzzy",
        },
        secondaryLocations: fuzzyMatches.slice(1).map((match) => ({
          place: match.text,
          confidence: match.confidence,
          matchType: "fuzzy",
        })),
        allLocations: fuzzyMatches.map((match) => ({
          place: match.text,
          confidence: match.confidence,
          matchType: "fuzzy",
        })),
        locationQuery: normalizedQuery,
        confidence: bestMatch.confidence,
        searchStrategy: "fuzzy",
        remainingQuery: this.removeLocationFromQuery(query, bestMatch.text),
      };
    }

    // Strategy 3: Word-level intelligent matching
    const words = normalizedQuery.split(/\s+/);
    const locationWords = words.filter(
      (word) =>
        word.length >= 4 &&
        !["beach", "beaches", "for", "with", "and", "the", "good", "near", "beautiful"].includes(
          word
        )
    );

    for (const word of locationWords) {
      const wordMatches = this.fuzzyMatcher.findMatches(word, this.knownPlaces, {
        threshold: 0.8,
        maxResults: 1,
        methods: ["exact", "fuzzy", "phonetic"],
      });

      if (wordMatches.length > 0) {
        const match = wordMatches[0];
        return {
          primaryLocation: {
            place: match.text,
            confidence: match.confidence,
            matchType: "word-level",
          },
          secondaryLocations: [],
          allLocations: [
            {
              place: match.text,
              confidence: match.confidence,
              matchType: "word-level",
            },
          ],
          locationQuery: normalizedQuery,
          confidence: match.confidence,
          searchStrategy: "word-level",
          remainingQuery: this.removeLocationFromQuery(query, match.text),
        };
      }
    }

    // No location found
    return {
      primaryLocation: undefined,
      secondaryLocations: [],
      allLocations: [],
      locationQuery: normalizedQuery,
      confidence: 0,
      searchStrategy: "none",
      remainingQuery: query,
    };
  }

  /**
   * Remove detected location from query to get remaining search terms
   */
  private removeLocationFromQuery(query: string, location: string): string {
    return query
      .replace(new RegExp(`\\b${location}\\b`, "gi"), "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Extract filters using enhanced NLP techniques with strict FilterBar matching
   */
  private async extractFilters(
    query: string,
    entities: EntityRecognitionResult,
    sentiment: SentimentResult,
    intent: IntentAnalysis,
    context?: SearchContext
  ): Promise<Partial<FilterState>> {
    const filters: Partial<FilterState> = {};

    // Extract beach types - map to exact FilterBar values
    if (entities.beachTypes.length > 0) {
      const validTypes: BeachType[] = [];
      entities.beachTypes.forEach((entity) => {
        const normalized = entity.normalized.toUpperCase();
        if (BEACH_TYPES.includes(normalized as BeachType)) {
          validTypes.push(normalized as BeachType);
        }
      });
      if (validTypes.length > 0) {
        filters.type = validTypes;
      }
    }

    // Extract wave conditions - map to exact FilterBar values
    if (entities.waveConditions.length > 0) {
      const validWaveConditions: WaveCondition[] = [];
      entities.waveConditions.forEach((entity) => {
        const normalized = entity.normalized.toUpperCase();
        if (WAVE_CONDITIONS.includes(normalized as WaveCondition)) {
          validWaveConditions.push(normalized as WaveCondition);
        }
      });
      if (validWaveConditions.length > 0) {
        filters.waveConditions = validWaveConditions;
      }
    }

    // Extract parking - map to exact FilterBar values
    if (entities.parking.length > 0) {
      const validParking: string[] = [];
      entities.parking.forEach((entity) => {
        const normalized = entity.normalized.toUpperCase();
        if (["NONE", "ROADSIDE", "SMALL_LOT", "LARGE_LOT"].includes(normalized)) {
          validParking.push(normalized);
        }
      });
      if (validParking.length > 0) {
        filters.parking = validParking;
      }
    }

    // Extract amenities - map to exact database values
    if (entities.amenities.length > 0) {
      const validAmenities: string[] = [];
      entities.amenities.forEach((entity) => {
        const normalized = entity.normalized.toLowerCase();
        // Map to exact amenity values used in the database
        const amenityMapping: Record<string, string> = {
          sunbeds: "sunbeds",
          umbrellas: "umbrellas",
          showers: "showers",
          toilets: "toilets",
          lifeguard: "lifeguard",
          beach_bar: "beach_bar",
          taverna: "taverna",
          food: "food",
          music: "music",
          snorkeling: "snorkeling",
          water_sports: "water_sports",
          family_friendly: "family_friendly",
          boat_trips: "boat_trips",
          fishing: "fishing",
          photography: "photography",
          hiking: "hiking",
          birdwatching: "birdwatching",
          cliff_jumping: "cliff_jumping",
        };

        if (amenityMapping[normalized]) {
          validAmenities.push(amenityMapping[normalized]);
        }
      });
      if (validAmenities.length > 0) {
        filters.amenities = validAmenities;
      }
    }

    // Extract organization - map to FilterBar format
    if (entities.organization.length > 0) {
      const validOrganized: string[] = [];
      entities.organization.forEach((entity) => {
        const normalized = entity.normalized.toLowerCase();
        if (normalized === "organized" || normalized === "unorganized") {
          validOrganized.push(normalized);
        }
      });
      if (validOrganized.length > 0) {
        filters.organized = validOrganized;
      }
    }

    // Check for blue flag
    filters.blueFlag = this.detectBlueFlag(query);

    // Check for "near me" intent
    filters.nearMe = this.detectNearMeIntent(query);

    // Apply sentiment-based adjustments
    this.applySentimentAdjustments(filters, sentiment, intent);

    // Apply context-based adjustments
    if (context) {
      this.applyContextAdjustments(filters, context);
    }

    return filters;
  }

  /**
   * Determine place with fuzzy matching
   */
  private determinePlace(query: string, entities: EntityRecognitionResult): string | undefined {
    // First try exact entity matches
    if (entities.places.length > 0) {
      return entities.places[0].normalized;
    }

    // Use fuzzy matching for place detection
    const words = query.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length >= 3) {
        const match = this.fuzzyMatcher.findBestMatch(word, this.knownPlaces, {
          threshold: 0.7,
          methods: ["fuzzy", "phonetic"],
        });

        if (match) {
          return match.text;
        }
      }
    }

    return undefined;
  }

  /**
   * Clean search term by removing extracted entities and filters
   */
  private cleanSearchTerm(
    query: string,
    entities: EntityRecognitionResult,
    filters: Partial<FilterState>,
    detectedPlace?: string
  ): string {
    let cleaned = query.toLowerCase();

    // If a known place was detected, remove it completely and return empty string
    // This ensures that known locations don't interfere with search
    if (detectedPlace && this.knownPlaces.includes(detectedPlace.toLowerCase())) {
      // Remove the detected place name
      const placePattern = new RegExp(
        `\\b${detectedPlace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      cleaned = cleaned.replace(placePattern, " ");

      // Remove all other recognized entities
      entities.all.forEach((entity) => {
        if (entity.type !== "place") {
          // Don't remove places again
          const pattern = new RegExp(
            `\\b${entity.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          );
          cleaned = cleaned.replace(pattern, " ");
        }
      });

      // Remove blue flag patterns
      this.blueFlagPatterns.forEach((pattern) => {
        cleaned = cleaned.replace(pattern, " ");
      });

      // Remove common beach-related words
      const commonWords = [
        "beach",
        "beaches",
        "sea",
        "ocean",
        "coast",
        "coastal",
        "location",
        "spot",
        "place",
        "area",
      ];

      commonWords.forEach((word) => {
        const pattern = new RegExp(`\\b${word}\\b`, "gi");
        cleaned = cleaned.replace(pattern, " ");
      });

      // Remove common prepositions and connectors
      const connectors = [
        "in",
        "at",
        "near",
        "around",
        "close to",
        "by",
        "with",
        "and",
        "or",
        "but",
        "show",
        "me",
        "find",
        "get",
        "want",
        "need",
        "looking for",
        "search for",
      ];

      connectors.forEach((connector) => {
        const pattern = new RegExp(`\\b${connector}\\b`, "gi");
        cleaned = cleaned.replace(pattern, " ");
      });

      // Clean up extra spaces
      cleaned = cleaned.replace(/\s+/g, " ").trim();

      // If we have a known place, return the cleaned search term (may contain descriptive words)
      return cleaned;
    }

    // For unknown places or no place detected, keep the search term
    // Remove all recognized entities except places (keep unknown places in search)
    entities.all.forEach((entity) => {
      if (entity.type !== "place") {
        const pattern = new RegExp(
          `\\b${entity.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        cleaned = cleaned.replace(pattern, " ");
      }
    });

    // Remove blue flag patterns
    this.blueFlagPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, " ");
    });

    // Remove common beach-related words
    const commonWords = [
      "beach",
      "beaches",
      "sea",
      "ocean",
      "coast",
      "coastal",
      "location",
      "spot",
      "place",
      "area",
    ];

    commonWords.forEach((word) => {
      const pattern = new RegExp(`\\b${word}\\b`, "gi");
      cleaned = cleaned.replace(pattern, " ");
    });

    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned.length >= 2 ? cleaned : "";
  }

  /**
   * Detect blue flag certification
   */
  private detectBlueFlag(query: string): boolean {
    return this.blueFlagPatterns.some((pattern) => pattern.test(query));
  }

  /**
   * Detect "near me" intent from query
   */
  private detectNearMeIntent(query: string): boolean {
    const nearMePatterns = [
      /\bnear\s+me\b/i,
      /\bclose\s+to\s+me\b/i,
      /\bnearby\b/i,
      /\blocal\b/i,
      /\bin\s+my\s+area\b/i,
      /\baround\s+here\b/i,
      /\bclose\s+by\b/i,
      /\bwithin\s+walking\s+distance\b/i,
      /\bwithin\s+driving\s+distance\b/i,
      /\bclosest\s+beaches?\b/i,
      /\bnearest\s+beaches?\b/i,
    ];

    return nearMePatterns.some((pattern) => pattern.test(query));
  }

  /**
   * Apply sentiment-based adjustments to filters
   */
  private applySentimentAdjustments(
    filters: Partial<FilterState>,
    sentiment: SentimentResult,
    intent: IntentAnalysis
  ): void {
    // If user expresses strong positive sentiment about specific features,
    // we might want to prioritize those
    if (sentiment.polarity === "positive" && sentiment.intensity === "high") {
      // Could add logic to boost confidence of positive features
    }

    // If user is asking for recommendations, we might want to be more inclusive
    if (intent.primaryIntent === "preference" && this.sentimentAnalyzer.isRecommendationQuery("")) {
      // Could add logic to expand search criteria
    }
  }

  /**
   * Apply context-based adjustments
   */
  private applyContextAdjustments(filters: Partial<FilterState>, context: SearchContext): void {
    // Time-based adjustments
    if (context.timeOfDay === "morning") {
      // Morning preferences might favor calm waters
      if (!filters.waveConditions) {
        filters.waveConditions = ["CALM"];
      }
    }

    // Season-based adjustments
    if (context.season === "summer") {
      // Summer might favor family-friendly amenities
      if (!filters.amenities) {
        filters.amenities = [];
      }
      if (!filters.amenities.includes("family_friendly")) {
        filters.amenities.push("family_friendly");
      }
    }

    // User preference adjustments
    if (context.userPreferences) {
      context.userPreferences.forEach((_preference) => {
        // Map user preferences to filter categories
        // This would need to be customized based on your preference system
      });
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    entities: EntityRecognitionResult,
    sentiment: SentimentResult,
    intent: IntentAnalysis,
    locationExtraction: LocationExtractionResult
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on entity recognition
    if (entities.all.length > 0) {
      const avgEntityConfidence =
        entities.all.reduce((sum, entity) => sum + entity.confidence, 0) / entities.all.length;
      confidence += avgEntityConfidence * 0.25;
    }

    // Boost confidence based on sentiment analysis
    confidence += sentiment.confidence * 0.15;

    // Boost confidence based on intent analysis
    confidence += intent.confidence * 0.15;

    // Boost confidence based on location extraction
    confidence += locationExtraction.confidence * 0.25;

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(
    query: string,
    entities: EntityRecognitionResult,
    sentiment: SentimentResult,
    intent: IntentAnalysis,
    locationExtraction: LocationExtractionResult
  ): string[] {
    const suggestions: string[] = [];

    // If no location was detected, suggest popular places
    if (locationExtraction.allLocations.length === 0) {
      suggestions.push("Try searching for beaches in Crete, Corfu, or Mykonos");
    }

    // If no amenities were detected, suggest popular amenities
    if (entities.amenities.length === 0) {
      suggestions.push("Consider adding amenities like sunbeds, umbrellas, or lifeguards");
    }

    // If sentiment is negative, suggest positive alternatives
    if (sentiment.polarity === "negative") {
      suggestions.push("Try searching for calm, family-friendly beaches");
    }

    // If intent is unclear, provide guidance
    if (intent.confidence < 0.5) {
      suggestions.push("Be more specific about what you're looking for");
    }

    // Location-specific suggestions
    if (locationExtraction.searchStrategy === "multi") {
      suggestions.push("Try searching for one location at a time for better results");
    }

    if (locationExtraction.confidence < 0.7) {
      suggestions.push("Try being more specific with the location name");
    }

    return suggestions;
  }

  /**
   * Fallback processing when advanced NLP fails
   */
  private fallbackProcessing(query: string, processingTime: number): EnhancedExtractionResult {
    // Basic fallback - you could integrate your existing logic here
    const safeQuery = query || "";
    return {
      filters: {},
      originalQuery: safeQuery,
      cleanedSearchTerm: safeQuery.toLowerCase(),
      confidence: 0.3,
      sentiment: {
        polarity: "neutral",
        confidence: 0.5,
        intent: "search",
        intensity: "low",
        keywords: [],
      },
      intent: {
        primaryIntent: "search",
        secondaryIntents: [],
        confidence: 0.3,
        modifiers: [],
      },
      entities: {
        places: [],
        amenities: [],
        beachTypes: [],
        waveConditions: [],
        parking: [],
        organization: [],
        all: [],
      },
      locationExtraction: {
        primaryLocation: undefined,
        secondaryLocations: [],
        allLocations: [],
        locationQuery: query,
        confidence: 0.3,
        searchStrategy: "exact",
        remainingQuery: query,
      },
      processingTime,
      suggestions: ["Try being more specific about your beach preferences"],
    };
  }

  /**
   * Update known places
   */
  public setKnownPlaces(places: string[]): void {
    this.knownPlaces = places.map((place) => place.toLowerCase());
  }

  /**
   * Get processing statistics
   */
  public getStats(): {
    entityRecognizer: Record<string, never>;
    fuzzyMatcher: Record<string, never>;
  } {
    return {
      entityRecognizer: {}, // Could add stats here
      fuzzyMatcher: {}, // Could add stats here
    };
  }

  /**
   * Clear all caches
   */
  public clearCaches(): void {
    // Cache clearing functionality removed with TextProcessor
  }
}

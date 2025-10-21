/**
 * Semantic Entity Mapper
 * Uses smart NLP instead of regex patterns to map natural language to filter values
 */

import { FuzzyMatcher } from "./FuzzyMatcher";
import { FilterState } from "@/hooks/useUrlState";
import {
  BeachType,
  WaveCondition,
  ParkingType,
  BEACH_TYPES,
  WAVE_CONDITIONS,
  PARKING_TYPES,
} from "@/types/common";

export interface SemanticMatch {
  value: string;
  confidence: number;
  method: "exact" | "semantic" | "fuzzy";
  originalText: string;
}

export interface SemanticMappingResult {
  amenities: string[];
  beachTypes: BeachType[];
  waveConditions: WaveCondition[];
  parking: ParkingType[];
  organized: string[];
  places: string[];
  confidence: number;
}

export class SemanticEntityMapper {
  private static instance: SemanticEntityMapper;
  private fuzzyMatcher: FuzzyMatcher;

  // Semantic concept libraries for each filter type
  private readonly FAMILY_FRIENDLY_CONCEPTS = [
    "family",
    "children",
    "kids",
    "child",
    "child-friendly",
    "children-friendly",
    "kids-friendly",
    "family-friendly",
    "family friendly",
    "elderly",
    "seniors",
    "senior",
    "grandma",
    "grandmother",
    "grandpa",
    "grandfather",
    "grandparents",
    "grandparent",
    "multi-generational",
    "all ages",
    "family beaches",
    "families",
    "children",
    "kids",
    "grandma",
    "grandmother",
    "grandpa",
    "grandfather",
    "grandparents",
    "family oriented",
    "family-oriented",
    "good for families",
    "children",
    "children",
  ];

  private readonly AMENITY_CONCEPTS = {
    sunbeds: ["sunbeds", "sun beds", "sun loungers", "loungers", "beds"],
    umbrellas: ["umbrellas", "parasols", "shade", "sunshade"],
    showers: ["showers", "shower", "wash", "washing"],
    toilets: ["toilets", "toilet", "restroom", "bathroom", "wc"],
    lifeguard: ["lifeguard", "lifeguards", "lifesaver", "safety", "rescue"],
    beach_bar: ["beach bar", "bar", "beachbar", "drinks", "cocktail", "beer"],
    taverna: ["taverna", "restaurant", "dining", "food", "eat"],
    food: ["food", "snacks", "refreshments", "cafes", "cafés", "eateries", "dining", "meals"],
    music: ["music", "live music", "dj", "entertainment", "beach music", "background music"],
    snorkeling: [
      "snorkeling",
      "snorkelling",
      "snorkel gear",
      "snorkel equipment",
      "underwater exploration",
      "marine life",
      "diving",
    ],
    water_sports: [
      "water sports",
      "aquatic activities",
      "sea sports",
      "marine activities",
      "water activities",
    ],
    family_friendly: this.FAMILY_FRIENDLY_CONCEPTS,
    boat_trips: [
      "boat trips",
      "boat tours",
      "boat excursions",
      "sailing",
      "boat rides",
      "marine tours",
    ],
    fishing: [
      "fishing",
      "fish",
      "fishing spots",
      "good for fishing",
      "anglers",
      "fishing opportunities",
    ],
    photography: [
      "photography",
      "photos",
      "pictures",
      "instagram",
      "selfies",
      "instagrammable",
      "scenic",
      "picturesque",
      "photo opportunities",
      "photogenic",
    ],
    hiking: [
      "hiking",
      "hike",
      "hiking trails",
      "walking trails",
      "nature walks",
      "trekking",
      "trails",
    ],
    birdwatching: [
      "birdwatching",
      "bird watch",
      "birds",
      "bird spotting",
      "ornithology",
      "bird observation",
    ],
    cliff_jumping: [
      "cliff jumping",
      "cliff dive",
      "cliff diving",
      "rock jumping",
      "high diving",
      "cliff leaping",
    ],
  };

  private readonly BEACH_TYPE_CONCEPTS = {
    SANDY: [
      "sand",
      "sandy",
      "white sand",
      "golden sand",
      "sandy beach",
      "sand beach",
      "fine sand",
      "soft sand",
      "powder sand",
      "beach sand",
      "sandy shores",
    ],
    PEBBLY: [
      "pebbles",
      "pebble",
      "pebble beach",
      "stone beach",
      "stony beach",
      "pebbly",
      "stones",
      "stony",
      "rocky pebbles",
      "small stones",
      "gravel",
      "rocky beach",
    ],
    MIXED: [
      "mixed",
      "mixed sand",
      "sand and pebbles",
      "combination",
      "both sand and pebbles",
      "varied surface",
      "mixed surface",
    ],
    OTHER: [
      "rocky",
      "rocks",
      "rock",
      "concrete beach",
      "man made",
      "artificial beach",
      "platform",
      "deck",
      "pier",
      "marina",
      "rocky beach",
    ],
  };

  private readonly WAVE_CONDITION_CONCEPTS = {
    CALM: [
      "calm",
      "calm water",
      "calm waters",
      "calm sea",
      "still water",
      "peaceful water",
      "quiet water",
      "gentle water",
      "flat water",
      "shallow water",
      "shallow waters",
      "protected beach",
      "sheltered beach",
      "still",
      "peaceful",
      "quiet",
      "gentle",
      "flat",
      "shallow",
      "mirror like",
      "glass like",
      "serene",
    ],
    MODERATE: [
      "moderate",
      "moderate waves",
      "medium waves",
      "normal waves",
      "average waves",
      "light waves",
      "small waves",
      "medium",
    ],
    WAVY: [
      "wavy",
      "waves",
      "wave",
      "big waves",
      "large waves",
      "strong waves",
      "rough sea",
      "choppy water",
      "choppy",
      "rough",
      "windy",
      "powerful waves",
      "high waves",
      "stormy",
    ],
    SURFABLE: [
      "surf",
      "surfing",
      "surfable",
      "good for surfing",
      "waves for surfing",
      "surfing beach",
      "body surf",
      "bodysurf",
      "surf spot",
      "surf break",
      "wave riding",
    ],
  };

  private readonly PARKING_CONCEPTS = {
    NONE: ["no parking", "no park", "no car", "walking only", "pedestrian only"],
    ROADSIDE: ["roadside", "road side", "street parking", "side of road", "along road"],
    SMALL_LOT: [
      "small lot",
      "small parking",
      "limited parking",
      "few spaces",
      "small car park",
      "small park",
      "limited spaces",
      "parking",
    ],
    LARGE_LOT: [
      "large lot",
      "large parking",
      "big parking",
      "plenty parking",
      "large car park",
      "big car park",
      "parking lot",
      "ample parking",
      "extensive parking",
      "big lot",
      "plenty of parking",
      "lots of parking",
      "spacious parking",
      "parking",
    ],
  };

  private readonly ORGANIZATION_CONCEPTS = {
    ORGANIZED: [
      "organized",
      "organised",
      "managed",
      "supervised",
      "commercial",
      "paid",
      "facilities",
      "services",
      "amenities",
      "staffed",
    ],
    UNORGANIZED: [
      "unorganized",
      "unorganised",
      "wild",
      "natural",
      "free",
      "untouched",
      "pristine",
      "remote",
      "isolated",
      "quiet",
      "peaceful",
    ],
  };

  private constructor() {
    this.fuzzyMatcher = FuzzyMatcher.getInstance();
  }

  public static getInstance(): SemanticEntityMapper {
    if (!SemanticEntityMapper.instance) {
      SemanticEntityMapper.instance = new SemanticEntityMapper();
    }
    return SemanticEntityMapper.instance;
  }

  /**
   * Map natural language query to filter values using semantic understanding
   */
  public mapToFilters(query: string): Partial<FilterState> {
    if (!query || typeof query !== "string") {
      return {};
    }

    const normalizedQuery = query.toLowerCase().trim();
    const filters: Partial<FilterState> = {};

    // Map each filter type using semantic matching
    filters.amenities = this.detectAmenities(normalizedQuery);
    filters.type = this.detectBeachTypes(normalizedQuery);
    filters.waveConditions = this.detectWaveConditions(normalizedQuery);
    filters.parking = this.detectParking(normalizedQuery);
    filters.organized = this.detectOrganization(normalizedQuery);

    return filters;
  }

  /**
   * Detect amenities using semantic matching
   */
  private detectAmenities(query: string): string[] {
    const detectedAmenities: string[] = [];

    for (const [amenityKey, concepts] of Object.entries(this.AMENITY_CONCEPTS)) {
      if (this.hasSemanticMatch(query, concepts)) {
        detectedAmenities.push(amenityKey);
      }
    }

    return detectedAmenities;
  }

  /**
   * Detect beach types using semantic matching
   */
  private detectBeachTypes(query: string): BeachType[] {
    const detectedTypes: BeachType[] = [];

    for (const [typeKey, concepts] of Object.entries(this.BEACH_TYPE_CONCEPTS)) {
      if (this.hasSemanticMatch(query, concepts)) {
        const beachType = typeKey as BeachType;
        if (BEACH_TYPES.includes(beachType)) {
          detectedTypes.push(beachType);
        }
      }
    }

    return detectedTypes;
  }

  /**
   * Detect wave conditions using semantic matching
   */
  private detectWaveConditions(query: string): WaveCondition[] {
    const detectedConditions: WaveCondition[] = [];

    for (const [conditionKey, concepts] of Object.entries(this.WAVE_CONDITION_CONCEPTS)) {
      if (this.hasSemanticMatch(query, concepts)) {
        const waveCondition = conditionKey as WaveCondition;
        if (WAVE_CONDITIONS.includes(waveCondition)) {
          detectedConditions.push(waveCondition);
        }
      }
    }

    return detectedConditions;
  }

  /**
   * Detect parking types using semantic matching with priority
   */
  private detectParking(query: string): ParkingType[] {
    const detectedParking: ParkingType[] = [];
    const matchScores: { [key: string]: number } = {};

    // Score each parking type based on match quality
    for (const [parkingKey, concepts] of Object.entries(this.PARKING_CONCEPTS)) {
      const score = this.getSemanticMatchScore(query, concepts);
      if (score > 0) {
        matchScores[parkingKey] = score;
      }
    }

    // Sort by score and take the highest scoring matches
    const sortedMatches = Object.entries(matchScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score >= 0.7); // Minimum threshold

    for (const [parkingKey] of sortedMatches) {
      const parkingType = parkingKey as ParkingType;
      if (PARKING_TYPES.includes(parkingType)) {
        detectedParking.push(parkingType);
      }
    }

    return detectedParking;
  }

  /**
   * Detect organization status using semantic matching
   */
  private detectOrganization(query: string): string[] {
    const detectedOrganization: string[] = [];

    for (const [orgKey, concepts] of Object.entries(this.ORGANIZATION_CONCEPTS)) {
      if (this.hasSemanticMatch(query, concepts)) {
        detectedOrganization.push(orgKey.toLowerCase());
      }
    }

    return detectedOrganization;
  }

  /**
   * Get semantic match score with priority for more specific matches
   */
  private getSemanticMatchScore(query: string, concepts: string[]): number {
    let bestScore = 0;
    const normalizedQuery = query.toLowerCase();

    for (const concept of concepts) {
      const normalizedConcept = concept.toLowerCase();

      // Exact match gets highest score
      if (normalizedQuery.includes(normalizedConcept)) {
        // Longer, more specific concepts get higher scores
        const specificity = normalizedConcept.length / 10; // Bonus for longer concepts
        const score = 1.0 + specificity;
        bestScore = Math.max(bestScore, score);
      }
    }

    // Try fuzzy matching for partial matches
    if (bestScore === 0) {
      try {
        const matches = this.fuzzyMatcher.findMatches(query, concepts, {
          threshold: 0.6,
          maxResults: 1,
          methods: ["fuzzy", "phonetic"],
        });

        if (matches.length > 0) {
          bestScore = matches[0].confidence;
        }
      } catch (error) {
        // Fallback to simple matching
        console.error("Semantic Entity Mapper NLP processing failed:", error);

        for (const concept of concepts) {
          if (query.toLowerCase().includes(concept.toLowerCase())) {
            bestScore = 0.5;
            break;
          }
        }
      }
    }

    return bestScore;
  }

  /**
   * Check if query has semantic match with concepts using fuzzy matching
   */
  private hasSemanticMatch(query: string, concepts: string[]): boolean {
    // First try exact matches for performance
    for (const concept of concepts) {
      if (query.includes(concept.toLowerCase())) {
        return true;
      }
    }

    // Try pattern-based matching for family-friendly concepts
    if (concepts === this.FAMILY_FRIENDLY_CONCEPTS) {
      // Check for patterns like "friendly for [family member]"
      const familyPatterns = [
        /friendly\s+for\s+(my\s+)?(grandma|grandmother|grandpa|grandfather|grandparents|family|children|kids)/i,
        /suitable\s+for\s+(my\s+)?(grandma|grandmother|grandpa|grandfather|grandparents|family|children|kids)/i,
        /good\s+for\s+(my\s+)?(grandma|grandmother|grandpa|grandfather|grandparents|family|children|kids)/i,
        /perfect\s+for\s+(my\s+)?(grandma|grandmother|grandpa|grandfather|grandparents|family|children|kids)/i,
        /ideal\s+for\s+(my\s+)?(grandma|grandmother|grandpa|grandfather|grandparents|family|children|kids)/i,
      ];

      for (const pattern of familyPatterns) {
        if (pattern.test(query)) {
          return true;
        }
      }
    }

    // Then try fuzzy matching with a simpler approach
    try {
      const matches = this.fuzzyMatcher.findMatches(query, concepts, {
        threshold: 0.7, // Balanced threshold for precision vs recall
        maxResults: 1,
        methods: ["exact", "fuzzy"], // Remove semantic to avoid stack overflow
      });

      return matches.length > 0 && matches[0].confidence >= 0.7;
    } catch {
      // Fallback to simple string matching if fuzzy matching fails
      return false;
    }
  }

  /**
   * Get detailed semantic matching results for debugging
   */
  public getDetailedMapping(query: string): SemanticMappingResult {
    const normalizedQuery = query.toLowerCase().trim();

    return {
      amenities: this.detectAmenities(normalizedQuery),
      beachTypes: this.detectBeachTypes(normalizedQuery),
      waveConditions: this.detectWaveConditions(normalizedQuery),
      parking: this.detectParking(normalizedQuery),
      organized: this.detectOrganization(normalizedQuery),
      places: [], // Will be handled by location extractor
      confidence: this.calculateOverallConfidence(normalizedQuery),
    };
  }

  /**
   * Calculate overall confidence score for the mapping
   */
  private calculateOverallConfidence(query: string): number {
    // Calculate detections without calling getDetailedMapping to avoid circular dependency
    const amenities = this.detectAmenities(query);
    const beachTypes = this.detectBeachTypes(query);
    const waveConditions = this.detectWaveConditions(query);
    const parking = this.detectParking(query);
    const organized = this.detectOrganization(query);

    const totalDetections =
      amenities.length +
      beachTypes.length +
      waveConditions.length +
      parking.length +
      organized.length;

    // Base confidence on number of detections and query complexity
    const baseConfidence = Math.min(0.9, 0.5 + totalDetections * 0.1);

    // Boost confidence for longer, more specific queries
    const queryComplexity = Math.min(0.2, query.split(" ").length * 0.02);

    return Math.min(1.0, baseConfidence + queryComplexity);
  }
}

/**
 * Smart Entity Recognizer
 * Uses semantic understanding instead of regex patterns
 */

import { SemanticEntityMapper, SemanticMappingResult } from "./SemanticEntityMapper";

export interface BeachEntity {
  text: string;
  type: "place" | "amenity" | "beach_type" | "wave_condition" | "parking" | "organization";
  confidence: number;
  normalized: string;
}

export interface EntityRecognitionResult {
  places: BeachEntity[];
  amenities: BeachEntity[];
  beachTypes: BeachEntity[];
  waveConditions: BeachEntity[];
  parking: BeachEntity[];
  organization: BeachEntity[];
  all: BeachEntity[];
}

export class SmartEntityRecognizer {
  private static instance: SmartEntityRecognizer;
  private semanticMapper: SemanticEntityMapper;

  private constructor() {
    this.semanticMapper = SemanticEntityMapper.getInstance();
  }

  public static getInstance(): SmartEntityRecognizer {
    if (!SmartEntityRecognizer.instance) {
      SmartEntityRecognizer.instance = new SmartEntityRecognizer();
    }
    return SmartEntityRecognizer.instance;
  }

  /**
   * Recognize entities using semantic understanding instead of regex
   */
  public async recognizeEntities(query: string): Promise<EntityRecognitionResult> {
    if (!query || typeof query !== "string") {
      return this.getEmptyResult();
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Use semantic mapping to detect entities
    const semanticResult = this.semanticMapper.getDetailedMapping(normalizedQuery);

    // Convert semantic results to entity format
    const entities: BeachEntity[] = [];

    // Add amenities
    semanticResult.amenities.forEach((amenity) => {
      entities.push({
        text: amenity,
        type: "amenity",
        confidence: 0.9,
        normalized: amenity,
      });
    });

    // Add beach types
    semanticResult.beachTypes.forEach((beachType) => {
      entities.push({
        text: beachType,
        type: "beach_type",
        confidence: 0.9,
        normalized: beachType,
      });
    });

    // Add wave conditions
    semanticResult.waveConditions.forEach((waveCondition) => {
      entities.push({
        text: waveCondition,
        type: "wave_condition",
        confidence: 0.9,
        normalized: waveCondition,
      });
    });

    // Add parking
    semanticResult.parking.forEach((parking) => {
      entities.push({
        text: parking,
        type: "parking",
        confidence: 0.9,
        normalized: parking,
      });
    });

    // Add organization
    semanticResult.organized.forEach((org) => {
      entities.push({
        text: org,
        type: "organization",
        confidence: 0.9,
        normalized: org,
      });
    });

    // Places are now handled by unified location detection in EnhancedNaturalLanguageSearch
    // No longer detect places here to avoid competing systems

    // Group entities by type
    const result: EntityRecognitionResult = {
      places: entities.filter((e) => e.type === "place"),
      amenities: entities.filter((e) => e.type === "amenity"),
      beachTypes: entities.filter((e) => e.type === "beach_type"),
      waveConditions: entities.filter((e) => e.type === "wave_condition"),
      parking: entities.filter((e) => e.type === "parking"),
      organization: entities.filter((e) => e.type === "organization"),
      all: entities,
    };

    return result;
  }

  /**
   * Get empty result structure
   */
  private getEmptyResult(): EntityRecognitionResult {
    return {
      places: [],
      amenities: [],
      beachTypes: [],
      waveConditions: [],
      parking: [],
      organization: [],
      all: [],
    };
  }

  /**
   * Get detailed semantic analysis for debugging
   */
  public async getSemanticAnalysis(query: string): Promise<{
    entities: EntityRecognitionResult;
    semanticMapping: SemanticMappingResult;
    confidence: number;
  }> {
    const entities = await this.recognizeEntities(query);
    const semanticMapping = this.semanticMapper.getDetailedMapping(query);
    const confidence = semanticMapping.confidence;

    return {
      entities,
      semanticMapping,
      confidence,
    };
  }
}

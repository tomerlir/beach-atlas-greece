/**
 * NLP Module Exports
 * Centralized exports for all NLP functionality
 */

// Smart NLP exports (new approach)
export { SmartEntityRecognizer } from "./SmartEntityRecognizer";
export { SemanticEntityMapper } from "./SemanticEntityMapper";
export type { BeachEntity, EntityRecognitionResult } from "./SmartEntityRecognizer";

export { SentimentAnalyzer } from "./SentimentAnalyzer";
export type { SentimentResult, IntentAnalysis } from "./SentimentAnalyzer";

export { FuzzyMatcher } from "./FuzzyMatcher";
export type { MatchResult, FuzzyMatchOptions } from "./FuzzyMatcher";

export { EnhancedNaturalLanguageSearch } from "./EnhancedNaturalLanguageSearch";
export type { EnhancedExtractionResult, SearchContext } from "./EnhancedNaturalLanguageSearch";

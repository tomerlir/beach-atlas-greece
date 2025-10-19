/**
 * NLP Module Exports
 * Centralized exports for all NLP functionality
 */

export type { Token, ProcessedText } from "./TextProcessor";

export { EntityRecognizer } from "./EntityRecognizer";
export type { BeachEntity, EntityRecognitionResult } from "./EntityRecognizer";

export { SentimentAnalyzer } from "./SentimentAnalyzer";
export type { SentimentResult, IntentAnalysis } from "./SentimentAnalyzer";

export { FuzzyMatcher } from "./FuzzyMatcher";
export type { MatchResult, FuzzyMatchOptions } from "./FuzzyMatcher";

export { EnhancedNaturalLanguageSearch } from "./EnhancedNaturalLanguageSearch";
export type { EnhancedExtractionResult, SearchContext } from "./EnhancedNaturalLanguageSearch";

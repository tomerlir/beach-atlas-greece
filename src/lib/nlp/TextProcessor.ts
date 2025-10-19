/**
 * Advanced Text Processing Module
 * Provides tokenization, lemmatization, and text normalization capabilities
 * Uses lazy loading to prevent large NLP libraries from being included in main bundle
 */

import { useLazyNLP } from "@/hooks/useLazyNLP";

export interface Token {
  text: string;
  lemma: string;
  pos: string;
  confidence: number;
}

export interface ProcessedText {
  original: string;
  tokens: Token[];
  lemmatized: string;
  normalized: string;
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

/**
 * Hook-based TextProcessor that uses lazy loading for NLP dependencies
 */
export const useTextProcessor = () => {
  const { nlp, isLoading, error } = useLazyNLP();
  const cache = new Map<string, ProcessedText>();

  /**
   * Process text with advanced NLP techniques
   */
  const processText = async (text: string): Promise<ProcessedText> => {
    // Validate input
    if (!text || typeof text !== "string") {
      text = "";
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const result: ProcessedText = {
      original: text,
      tokens: [],
      lemmatized: "",
      normalized: "",
      entities: [],
    };

    try {
      if (nlp) {
        // Use compromise for basic processing
        const doc = nlp.compromise(text);

        // Extract basic text information - simplified approach
        result.tokens = text.split(/\s+/).map((word) => ({
          text: word,
          lemma: word.toLowerCase(),
          pos: "word", // Simplified POS tag as string
          confidence: 0.8,
        }));

        // Get lemmatized text - safe compromise.js API usage
        try {
          // Type assertion for compromise.js API - we know it has lemma().text() method
          const docWithLemma = doc as unknown as { lemma(): { text(): string } };
          result.lemmatized = docWithLemma.lemma().text();
        } catch {
          result.lemmatized = text.toLowerCase();
        }

        // Use wink-nlp for advanced processing if available
        try {
          // Type assertion for wink-nlp API - we know it has readDoc method
          const winkInstance = nlp.winkNLP(nlp.model) as {
            readDoc(text: string): {
              entities(): Array<{
                out(selector: string): string;
              }>;
            };
            its: {
              text: string;
              type: string;
            };
          };

          const winkDoc = winkInstance.readDoc(text);

          // Extract named entities - correct wink-nlp API usage
          const entities = winkDoc.entities();
          result.entities = entities.map((entity) => ({
            text: entity.out(winkInstance.its.text),
            type: entity.out(winkInstance.its.type),
            confidence: 0.9, // Wink-nlp doesn't provide confidence scores
          }));
        } catch (winkError) {
          console.warn("Wink-NLP processing failed:", winkError);
          result.entities = [];
        }
      } else {
        // Fallback to basic processing when NLP modules aren't loaded yet
        result.tokens = text.split(/\s+/).map((word) => ({
          text: word,
          lemma: word.toLowerCase(),
          pos: "unknown",
          confidence: 0.5,
        }));
        result.lemmatized = text.toLowerCase();
        result.entities = [];
      }

      // Normalize text
      result.normalized = normalizeText(text);

      // Cache the result
      cache.set(cacheKey, result);
    } catch (error) {
      console.warn("NLP processing failed, falling back to basic processing:", error);
      // Fallback to basic processing
      result.tokens = text.split(/\s+/).map((word) => ({
        text: word,
        lemma: word.toLowerCase(),
        pos: "unknown",
        confidence: 0.5,
      }));
      result.lemmatized = text.toLowerCase();
      result.normalized = normalizeText(text);
    }

    return result;
  };

  /**
   * Advanced text normalization
   */
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^\w\s-]/g, " ") // Keep only word characters, spaces, and hyphens
      .replace(/\s+/g, " ")
      .trim();
  };

  /**
   * Extract key phrases from text
   */
  const extractKeyPhrases = (text: string): string[] => {
    try {
      if (nlp) {
        const doc = nlp.compromise(text);
        const phrases = doc.match("#Noun+").out("array");
        return phrases.filter((phrase: string) => phrase.length > 2);
      }
      return [];
    } catch (error) {
      console.warn("Key phrase extraction failed:", error);
      return [];
    }
  };

  /**
   * Detect language of text
   */
  const detectLanguage = (text: string): string => {
    // Simple heuristic - in a real implementation, you'd use a proper language detection library
    const greekPattern = /[α-ωΑ-Ω]/;
    if (greekPattern.test(text)) {
      return "greek";
    }
    return "english";
  };

  /**
   * Clear cache to free memory
   */
  const clearCache = (): void => {
    cache.clear();
  };

  /**
   * Get cache statistics
   */
  const getCacheStats = (): { size: number; keys: string[] } => {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  };

  return {
    processText,
    extractKeyPhrases,
    detectLanguage,
    clearCache,
    getCacheStats,
    isLoading,
    error,
  };
};

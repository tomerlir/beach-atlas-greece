/**
 * Advanced Text Processing Module
 * Provides tokenization, lemmatization, and text normalization capabilities
 */

import nlp from "compromise";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";

// Initialize wink-nlp with the English model
let wink: any = null;
try {
  wink = winkNLP(model);
} catch (error) {
  console.warn("Failed to initialize wink-nlp:", error);
}

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

export class TextProcessor {
  private static instance: TextProcessor;
  private cache = new Map<string, ProcessedText>();

  private constructor() {}

  public static getInstance(): TextProcessor {
    if (!TextProcessor.instance) {
      TextProcessor.instance = new TextProcessor();
    }
    return TextProcessor.instance;
  }

  /**
   * Process text with advanced NLP techniques
   */
  public async processText(text: string): Promise<ProcessedText> {
    // Validate input
    if (!text || typeof text !== "string") {
      text = "";
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result: ProcessedText = {
      original: text,
      tokens: [],
      lemmatized: "",
      normalized: "",
      entities: [],
    };

    try {
      // Use compromise for basic processing
      const doc = nlp(text);

      // Extract basic text information - simplified approach
      result.tokens = text.split(/\s+/).map((word, index) => ({
        text: word,
        lemma: word.toLowerCase(),
        pos: "word", // Simplified POS tag as string
        confidence: 0.8,
      }));

      // Get lemmatized text - safe compromise.js API usage
      try {
        result.lemmatized = (doc as any).lemma().text();
      } catch (error) {
        result.lemmatized = text.toLowerCase();
      }

      // Use wink-nlp for advanced processing if available
      if (wink) {
        try {
          const winkDoc = wink.readDoc(text);

          // Extract named entities - correct wink-nlp API usage
          const entities = winkDoc.entities();
          result.entities = entities.map((entity: any) => ({
            text: entity.out(wink.its.text),
            type: entity.out(wink.its.type),
            confidence: 0.9, // Wink-nlp doesn't provide confidence scores
          }));
        } catch (winkError) {
          console.warn("Wink-NLP processing failed:", winkError);
          result.entities = [];
        }
      } else {
        result.entities = [];
      }

      // Normalize text
      result.normalized = this.normalizeText(text);

      // Cache the result
      this.cache.set(cacheKey, result);
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
      result.normalized = this.normalizeText(text);
    }

    return result;
  }

  /**
   * Advanced text normalization
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^\w\s-]/g, " ") // Keep only word characters, spaces, and hyphens
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Extract key phrases from text
   */
  public extractKeyPhrases(text: string): string[] {
    try {
      const doc = nlp(text);
      const phrases = doc.match("#Noun+").out("array");
      return phrases.filter((phrase: string) => phrase.length > 2);
    } catch (error) {
      console.warn("Key phrase extraction failed:", error);
      return [];
    }
  }

  /**
   * Detect language of text
   */
  public detectLanguage(text: string): string {
    // Simple heuristic - in a real implementation, you'd use a proper language detection library
    const greekPattern = /[α-ωΑ-Ω]/;
    if (greekPattern.test(text)) {
      return "greek";
    }
    return "english";
  }

  /**
   * Clear cache to free memory
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

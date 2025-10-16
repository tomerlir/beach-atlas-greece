/**
 * Test Helpers for NLP Testing Framework
 * Reusable utilities for testing NLP components
 */

import { describe, it, expect } from "vitest";
import { EnhancedExtractionResult, SearchContext } from "@/lib/nlp";
import { FilterState } from "@/hooks/useUrlState";

/**
 * Test assertion helpers for NLP results
 */
export class NLPTestHelpers {
  /**
   * Assert that a query produces expected filters
   */
  static assertFilters(
    result: EnhancedExtractionResult,
    expectedFilters: Partial<FilterState>,
    description?: string
  ): void {
    const context = description ? ` (${description})` : "";

    // Check each expected filter
    Object.entries(expectedFilters).forEach(([key, expectedValue]) => {
      const actualValue = result.filters[key as keyof FilterState];

      if (Array.isArray(expectedValue)) {
        expect(actualValue, `Filter ${key} should match expected array${context}`).toEqual(
          expect.arrayContaining(expectedValue)
        );
      } else {
        expect(actualValue, `Filter ${key} should match expected value${context}`).toBe(
          expectedValue
        );
      }
    });
  }

  /**
   * Assert that a query produces expected location
   */
  static assertLocation(
    result: EnhancedExtractionResult,
    expectedLocation: string,
    description?: string
  ): void {
    const context = description ? ` (${description})` : "";
    expect(result.place, `Should extract location: ${expectedLocation}${context}`).toBe(
      expectedLocation
    );
  }

  /**
   * Assert that a query produces expected entities
   */
  static assertEntities(
    result: EnhancedExtractionResult,
    expectedEntityTypes: string[],
    description?: string
  ): void {
    const context = description ? ` (${description})` : "";
    const actualEntityTypes = result.entities.all.map((e) => e.type);

    expectedEntityTypes.forEach((entityType) => {
      expect(actualEntityTypes, `Should contain entity type: ${entityType}${context}`).toContain(
        entityType
      );
    });
  }

  /**
   * Assert sentiment analysis results
   */
  static assertSentiment(
    result: EnhancedExtractionResult,
    expectedPolarity: "positive" | "negative" | "neutral",
    expectedIntent?: "search" | "preference" | "question" | "complaint" | "praise",
    description?: string
  ): void {
    const context = description ? ` (${description})` : "";

    expect(result.sentiment.polarity, `Should have ${expectedPolarity} sentiment${context}`).toBe(
      expectedPolarity
    );

    if (expectedIntent) {
      expect(result.sentiment.intent, `Should have ${expectedIntent} intent${context}`).toBe(
        expectedIntent
      );
    }
  }

  /**
   * Assert confidence levels
   */
  static assertConfidence(
    result: EnhancedExtractionResult,
    minConfidence: number = 0.5,
    description?: string
  ): void {
    const context = description ? ` (${description})` : "";
    expect(
      result.confidence,
      `Should have confidence >= ${minConfidence}${context}`
    ).toBeGreaterThanOrEqual(minConfidence);
  }

  /**
   * Assert processing time is reasonable
   */
  static assertPerformance(
    result: EnhancedExtractionResult,
    maxTimeMs: number = 100,
    description?: string
  ): void {
    const context = description ? ` (${description})` : "";
    expect(
      result.processingTime,
      `Should process within ${maxTimeMs}ms${context}`
    ).toBeLessThanOrEqual(maxTimeMs);
  }

  /**
   * Assert that suggestions are provided when appropriate
   */
  static assertSuggestions(
    result: EnhancedExtractionResult,
    shouldHaveSuggestions: boolean = true,
    description?: string
  ): void {
    const context = description ? ` (${description})` : "";

    if (shouldHaveSuggestions) {
      expect(result.suggestions, `Should provide suggestions${context}`).toBeDefined();
      expect(
        result.suggestions!.length,
        `Should have at least one suggestion${context}`
      ).toBeGreaterThan(0);
    } else {
      expect(result.suggestions, `Should not provide suggestions${context}`).toBeUndefined();
    }
  }
}

/**
 * Test data generators
 */
export class TestDataGenerators {
  /**
   * Generate a basic search context
   */
  static createSearchContext(overrides: Partial<SearchContext> = {}): SearchContext {
    return {
      userPreferences: ["family-friendly", "calm waters"],
      timeOfDay: "morning",
      season: "summer",
      location: "crete",
      ...overrides,
    };
  }

  /**
   * Generate a basic filter state
   */
  static createFilterState(overrides: Partial<FilterState> = {}): FilterState {
    return {
      search: "",
      location: undefined,
      locations: undefined,
      organized: [],
      blueFlag: false,
      parking: [],
      amenities: [],
      waveConditions: [],
      type: [],
      sort: "name.asc",
      page: 1,
      nearMe: false,
      ...overrides,
    };
  }

  /**
   * Generate a mock extraction result
   */
  static createMockExtractionResult(
    overrides: Partial<EnhancedExtractionResult> = {}
  ): EnhancedExtractionResult {
    return {
      filters: {},
      originalQuery: "test query",
      cleanedSearchTerm: "test query",
      confidence: 0.8,
      sentiment: {
        polarity: "neutral",
        confidence: 0.7,
        intent: "search",
        intensity: "low",
        keywords: [],
      },
      intent: {
        primaryIntent: "search",
        secondaryIntents: [],
        confidence: 0.7,
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
        locationQuery: "test query",
        confidence: 0.7,
        searchStrategy: "exact",
        remainingQuery: "test query",
      },
      processingTime: 10,
      ...overrides,
    };
  }
}

/**
 * Test execution helpers
 */
export class TestExecutionHelpers {
  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    const start = Date.now();
    const result = await fn();
    const timeMs = Date.now() - start;
    return { result, timeMs };
  }

  /**
   * Run a test with retries for flaky tests
   */
  static async withRetries<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 100
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Create a test suite for query categories
   */
  static createQueryTestSuite(
    categoryName: string,
    queries: Array<{
      query: string;
      description: string;
      expected: Partial<FilterState>;
      expectedLocation?: string;
      expectedEntities?: string[];
      expectedSentiment?: "positive" | "negative" | "neutral";
      expectedIntent?: "search" | "preference" | "question" | "complaint" | "praise";
      minConfidence?: number;
      maxTimeMs?: number;
    }>,
    testFn: (query: string) => Promise<EnhancedExtractionResult>
  ): void {
    describe(categoryName, () => {
      queries.forEach(
        ({
          query,
          description,
          expected,
          expectedLocation,
          expectedEntities,
          expectedSentiment,
          expectedIntent,
          minConfidence = 0.5,
          maxTimeMs = 100,
        }) => {
          it(`should handle: "${query}" - ${description}`, async () => {
            const result = await testFn(query);

            // Assert filters
            if (Object.keys(expected).length > 0) {
              NLPTestHelpers.assertFilters(result, expected, description);
            }

            // Assert location
            if (expectedLocation) {
              NLPTestHelpers.assertLocation(result, expectedLocation, description);
            }

            // Assert entities
            if (expectedEntities && expectedEntities.length > 0) {
              NLPTestHelpers.assertEntities(result, expectedEntities, description);
            }

            // Assert sentiment
            if (expectedSentiment) {
              NLPTestHelpers.assertSentiment(
                result,
                expectedSentiment,
                expectedIntent,
                description
              );
            }

            // Assert confidence
            NLPTestHelpers.assertConfidence(result, minConfidence, description);

            // Assert performance
            NLPTestHelpers.assertPerformance(result, maxTimeMs, description);
          });
        }
      );
    });
  }
}

/**
 * Common test patterns
 */
export const TestPatterns = {
  /**
   * Test that a function handles empty input gracefully
   */
  emptyInput: (fn: (input: string) => Promise<any>) => {
    it("should handle empty input gracefully", async () => {
      const result = await fn("");
      expect(result).toBeDefined();
    });
  },

  /**
   * Test that a function handles null/undefined input gracefully
   */
  nullInput: (fn: (input: string | null | undefined) => Promise<any>) => {
    it("should handle null input gracefully", async () => {
      const result = await fn(null as any);
      expect(result).toBeDefined();
    });

    it("should handle undefined input gracefully", async () => {
      const result = await fn(undefined as any);
      expect(result).toBeDefined();
    });
  },

  /**
   * Test that a function handles very long input
   */
  longInput: (fn: (input: string) => Promise<any>) => {
    it("should handle very long input", async () => {
      const longInput = "beach ".repeat(1000);
      const result = await fn(longInput);
      expect(result).toBeDefined();
    });
  },

  /**
   * Test that a function handles special characters
   */
  specialCharacters: (fn: (input: string) => Promise<any>) => {
    it("should handle special characters", async () => {
      const specialInput = "beach!@#$%^&*()_+-=[]{}|;:,.<>?";
      const result = await fn(specialInput);
      expect(result).toBeDefined();
    });
  },
};

/**
 * Performance testing utilities
 */
export class PerformanceTestHelpers {
  /**
   * Benchmark a function with multiple iterations
   */
  static async benchmark(
    fn: () => Promise<any>,
    iterations: number = 10
  ): Promise<{ avgTimeMs: number; minTimeMs: number; maxTimeMs: number }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await fn();
      times.push(Date.now() - start);
    }

    return {
      avgTimeMs: times.reduce((a, b) => a + b, 0) / times.length,
      minTimeMs: Math.min(...times),
      maxTimeMs: Math.max(...times),
    };
  }

  /**
   * Assert that a function meets performance requirements
   */
  static assertPerformance(
    fn: () => Promise<any>,
    maxAvgTimeMs: number,
    iterations: number = 10
  ): Promise<void> {
    return PerformanceTestHelpers.benchmark(fn, iterations).then(({ avgTimeMs }) => {
      expect(
        avgTimeMs,
        `Average execution time should be <= ${maxAvgTimeMs}ms`
      ).toBeLessThanOrEqual(maxAvgTimeMs);
    });
  }
}

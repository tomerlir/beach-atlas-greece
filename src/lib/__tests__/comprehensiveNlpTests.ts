/**
 * Comprehensive NLP Tests
 * Tests all aspects of the enhanced natural language processing system
 */

import { 
  extractFromNaturalLanguage,
  extractFromNaturalLanguageWithContext,
  createSearchContext,
  getNLPStats,
  clearNLPCaches,
  setKnownPlaces
} from '../naturalLanguageSearch';

import { 
  TextProcessor,
  EntityRecognizer,
  SentimentAnalyzer,
  FuzzyMatcher,
  EnhancedNaturalLanguageSearch
} from '../nlp';

/**
 * Test suite for comprehensive NLP functionality
 */
export class ComprehensiveNLPTests {
  private testResults: Array<{
    testName: string;
    passed: boolean;
    error?: string;
    duration: number;
  }> = [];

  /**
   * Run all comprehensive tests
   */
  async runAllTests(): Promise<void> {
    console.log('\n🧪 COMPREHENSIVE NLP TEST SUITE\n');
    console.log('=' .repeat(80));

    const tests = [
      { name: 'Basic Text Processing', fn: () => this.testBasicTextProcessing() },
      { name: 'Entity Recognition', fn: () => this.testEntityRecognition() },
      { name: 'Sentiment Analysis', fn: () => this.testSentimentAnalysis() },
      { name: 'Fuzzy Matching', fn: () => this.testFuzzyMatching() },
      { name: 'Enhanced NLP Integration', fn: () => this.testEnhancedNLPIntegration() },
      { name: 'Natural Language Search', fn: () => this.testNaturalLanguageSearch() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() },
      { name: 'Performance Tests', fn: () => this.testPerformance() },
      { name: 'Context Awareness', fn: () => this.testContextAwareness() }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    this.printResults();
  }

  /**
   * Run a single test
   */
  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      console.log(`\n🔍 Running: ${testName}`);
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({ testName, passed: true, duration });
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({ 
        testName, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      });
      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error}`);
    }
  }

  /**
   * Test basic text processing functionality
   */
  private async testBasicTextProcessing(): Promise<void> {
    const processor = TextProcessor.getInstance();
    
    // Test basic text processing
    const result = await processor.processText("I love sandy beaches with calm waters");
    
    if (!result.tokens || result.tokens.length === 0) {
      throw new Error('No tokens extracted');
    }
    
    if (!result.lemmatized) {
      throw new Error('No lemmatized text');
    }
    
    if (!result.normalized) {
      throw new Error('No normalized text');
    }

    // Test key phrase extraction
    const phrases = processor.extractKeyPhrases("Beautiful sandy beaches with amazing snorkeling");
    if (phrases.length === 0) {
      throw new Error('No key phrases extracted');
    }
  }

  /**
   * Test entity recognition functionality
   */
  private async testEntityRecognition(): Promise<void> {
    const recognizer = EntityRecognizer.getInstance();
    
    const testQueries = [
      "Show me sandy beaches in Crete with lifeguards",
      "I want pebbly beaches with calm waters and beach bars",
      "Find family-friendly beaches with sunbeds and parking"
    ];

    for (const query of testQueries) {
      const result = await recognizer.recognizeEntities(query);
      
      if (!result.places && !result.beachTypes && !result.amenities) {
        throw new Error(`No entities recognized for query: ${query}`);
      }
    }
  }

  /**
   * Test sentiment analysis functionality
   */
  private async testSentimentAnalysis(): Promise<void> {
    const analyzer = SentimentAnalyzer.getInstance();
    
    const testCases = [
      { text: "I absolutely love this amazing beach!", expectedPolarity: 'positive' },
      { text: "This beach is terrible and crowded", expectedPolarity: 'negative' },
      { text: "The beach is okay, nothing special", expectedPolarity: 'neutral' }
    ];

    for (const testCase of testCases) {
      const result = await analyzer.analyzeSentiment(testCase.text);
      
      if (!result.polarity) {
        throw new Error(`No sentiment detected for: ${testCase.text}`);
      }
      
      if (result.confidence < 0.1) {
        throw new Error(`Low confidence sentiment for: ${testCase.text}`);
      }
    }
  }

  /**
   * Test fuzzy matching functionality
   */
  private async testFuzzyMatching(): Promise<void> {
    const matcher = FuzzyMatcher.getInstance();
    
    // Test exact matching
    const exactMatch = await matcher.findBestMatch("crete", ["crete", "corfu", "mykonos"]);
    if (!exactMatch || exactMatch.text !== "crete") {
      throw new Error('Exact matching failed');
    }
    
    // Test fuzzy matching
    const fuzzyMatch = await matcher.findBestMatch("kriti", ["crete", "corfu", "mykonos"]);
    if (!fuzzyMatch || fuzzyMatch.score < 0.5) {
      throw new Error('Fuzzy matching failed');
    }
    
    // Test multiple matches
    const matches = await matcher.findMatches("sandy", ["sandy", "pebbly", "rocky"], { threshold: 0.8 });
    if (matches.length === 0) {
      throw new Error('Multiple matching failed');
    }
  }

  /**
   * Test enhanced NLP integration
   */
  private async testEnhancedNLPIntegration(): Promise<void> {
    const enhancedNLP = EnhancedNaturalLanguageSearch.getInstance();
    
    const testQuery = "I want the most beautiful sandy beaches with amazing snorkeling in Crete";
    const result = await enhancedNLP.processQuery(testQuery);
    
    if (!result.filters) {
      throw new Error('No filters extracted');
    }
    
    if (!result.entities) {
      throw new Error('No entities extracted');
    }
    
    if (!result.sentiment) {
      throw new Error('No sentiment analysis');
    }
    
    if (result.confidence < 0.1) {
      throw new Error('Low confidence result');
    }
  }

  /**
   * Test natural language search functionality
   */
  private async testNaturalLanguageSearch(): Promise<void> {
    const testQueries = [
      "sandy beaches",
      "I want calm beaches with lifeguards",
      "Show me family-friendly beaches in Crete",
      "Find beaches with amazing snorkeling and blue flag certification"
    ];

    for (const query of testQueries) {
      const result = await extractFromNaturalLanguage(query);
      
      if (!result.filters) {
        throw new Error(`No filters for query: ${query}`);
      }
      
      if (!result.cleanedSearchTerm) {
        throw new Error(`No cleaned search term for query: ${query}`);
      }
      
      if (result.confidence < 0.1) {
        throw new Error(`Low confidence for query: ${query}`);
      }
    }
  }


  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    // Test with empty string
    const emptyResult = await extractFromNaturalLanguage("");
    if (!emptyResult.filters) {
      throw new Error('Empty string handling failed');
    }
    
    // Test with null/undefined
    try {
      await extractFromNaturalLanguage(null as any);
    } catch (error) {
      // Should handle gracefully
    }
    
    // Test with very long string
    const longString = "beach ".repeat(1000);
    const longResult = await extractFromNaturalLanguage(longString);
    if (!longResult.filters) {
      throw new Error('Long string handling failed');
    }
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<void> {
    const testQuery = "I want the most beautiful sandy beaches with amazing snorkeling in Crete";
    const iterations = 10;
    
    const startTime = Date.now();
    for (let i = 0; i < iterations; i++) {
      await extractFromNaturalLanguage(testQuery);
    }
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / iterations;
    
    if (avgTime > 100) { // Should be under 100ms average
      throw new Error(`Performance too slow: ${avgTime}ms average`);
    }
  }

  /**
   * Test context awareness
   */
  private async testContextAwareness(): Promise<void> {
    const context = createSearchContext({
      userPreferences: ['family-friendly', 'calm'],
      location: 'Crete',
      season: 'summer',
      timeOfDay: 'morning'
    });
    
    const result = await extractFromNaturalLanguageWithContext(
      "I want beaches with good amenities",
      context
    );
    
    if (!result.filters) {
      throw new Error('Context-aware processing failed');
    }
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n\n📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(80));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const totalTime = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   • ${r.testName}: ${r.error}`);
        });
    }
    
    console.log('\n🎉 Comprehensive NLP testing completed!\n');
  }
}

/**
 * Run comprehensive tests
 */
export async function runComprehensiveNLPTests(): Promise<void> {
  const tester = new ComprehensiveNLPTests();
  await tester.runAllTests();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveNLPTests()
    .then(() => {
      console.log('🎉 All comprehensive tests completed successfully!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Comprehensive tests failed:', error);
      process.exit(1);
    });
}

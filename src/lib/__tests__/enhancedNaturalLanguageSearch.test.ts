/**
 * Enhanced Natural Language Search Test Suite
 * Tests the new NLP-enhanced search capabilities
 */

import { 
  extractFromNaturalLanguage,
  extractFromNaturalLanguageWithContext,
  createSearchContext,
  getNLPStats,
  clearNLPCaches
} from '../naturalLanguageSearch';

/**
 * Test suite for enhanced NLP features
 */
async function runEnhancedNLPTests() {
  console.log('\n🧠 ENHANCED NATURAL LANGUAGE PROCESSING TEST SUITE\n');
  console.log('=' .repeat(80));

  let passed = 0;
  let failed = 0;
  const failures: Array<{ query: string; description: string; issues: string[] }> = [];

  // Test cases for enhanced NLP features
  const enhancedTestCases = [
    {
      query: "I'm looking for the most amazing sandy beaches with crystal clear waters in Crete",
      description: "Complex query with sentiment and multiple entities",
      expectedFeatures: ['sentiment', 'entities', 'place', 'beach_type', 'wave_condition']
    },
    {
      query: "What are the best family-friendly beaches with lifeguards and parking?",
      description: "Question format with multiple amenities",
      expectedFeatures: ['intent', 'amenities', 'sentiment']
    },
    {
      query: "Show me calm pebbly beaches without crowds in Mykonos",
      description: "Negative preference with specific requirements",
      expectedFeatures: ['wave_condition', 'beach_type', 'place', 'negative_preference']
    },
    {
      query: "I hate crowded beaches but love snorkeling spots",
      description: "Strong sentiment with preferences",
      expectedFeatures: ['negative_sentiment', 'positive_sentiment', 'amenities']
    },
    {
      query: "Find me beaches perfect for Instagram photos with traditional tavernas",
      description: "Social media context with cultural amenities",
      expectedFeatures: ['photography', 'taverna', 'social_context']
    },
    {
      query: "Where can I find the most beautiful sunset beaches in Santorini?",
      description: "Location-specific with aesthetic preferences",
      expectedFeatures: ['place', 'aesthetic_preference', 'time_context']
    },
    {
      query: "I need beaches with wheelchair access and medical facilities",
      description: "Accessibility requirements",
      expectedFeatures: ['accessibility', 'medical', 'specific_needs']
    },
    {
      query: "What beaches are good for windsurfing but bad for families?",
      description: "Contrasting preferences",
      expectedFeatures: ['water_sports', 'family_consideration', 'contrast']
    }
  ];

  // Test enhanced NLP processing
  for (const testCase of enhancedTestCases) {
    try {
      console.log(`\n🔍 Testing: ${testCase.description}`);
      console.log(`   Query: "${testCase.query}"`);
      
      const result = await extractFromNaturalLanguage(testCase.query);
      const issues: string[] = [];
      
      // Check if enhanced features are present
      if (!result.sentiment) {
        issues.push('  ❌ Missing sentiment analysis');
      } else {
        console.log(`   ✅ Sentiment: ${result.sentiment.polarity} (${result.sentiment.confidence})`);
      }
      
      if (!result.intent) {
        issues.push('  ❌ Missing intent analysis');
      } else {
        console.log(`   ✅ Intent: ${result.intent.primaryIntent} (${result.intent.confidence})`);
      }
      
      if (!result.entities || result.entities.all.length === 0) {
        issues.push('  ❌ Missing entity recognition');
      } else {
        console.log(`   ✅ Entities: ${result.entities.all.length} found`);
        result.entities.all.forEach(entity => {
          console.log(`      - ${entity.text} (${entity.type}, ${entity.confidence})`);
        });
      }
      
      if (result.confidence === undefined) {
        issues.push('  ❌ Missing confidence score');
      } else {
        console.log(`   ✅ Confidence: ${result.confidence}`);
      }
      
      if (result.processingTime === undefined) {
        issues.push('  ❌ Missing processing time');
      } else {
        console.log(`   ✅ Processing time: ${result.processingTime}ms`);
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`   ✅ Suggestions: ${result.suggestions.length} provided`);
      }
      
      // Check specific expected features
      for (const feature of testCase.expectedFeatures) {
        let featureFound = false;
        
        switch (feature) {
          case 'sentiment':
            featureFound = result.sentiment && result.sentiment.polarity !== 'neutral';
            break;
          case 'entities':
            featureFound = result.entities && result.entities.all.length > 0;
            break;
          case 'place':
            featureFound = result.place !== undefined;
            break;
          case 'beach_type':
            featureFound = result.entities?.beachTypes && result.entities.beachTypes.length > 0;
            break;
          case 'wave_condition':
            featureFound = result.entities?.waveConditions && result.entities.waveConditions.length > 0;
            break;
          case 'amenities':
            featureFound = result.entities?.amenities && result.entities.amenities.length > 0;
            break;
          case 'intent':
            featureFound = result.intent && result.intent.primaryIntent !== 'search';
            break;
          case 'negative_sentiment':
            featureFound = result.sentiment && result.sentiment.polarity === 'negative';
            break;
          case 'positive_sentiment':
            featureFound = result.sentiment && result.sentiment.polarity === 'positive';
            break;
          case 'photography':
            featureFound = result.entities?.amenities?.some(a => a.normalized === 'photography');
            break;
          case 'taverna':
            featureFound = result.entities?.amenities?.some(a => a.normalized === 'taverna');
            break;
          case 'water_sports':
            featureFound = result.entities?.amenities?.some(a => a.normalized === 'water_sports');
            break;
        }
        
        if (!featureFound) {
          issues.push(`  ❌ Expected feature not found: ${feature}`);
        } else {
          console.log(`   ✅ Feature detected: ${feature}`);
        }
      }
      
      if (issues.length === 0) {
        passed++;
        console.log(`   ✅ Test passed`);
      } else {
        failed++;
        console.log(`   ❌ Test failed`);
        issues.forEach(issue => console.log(issue));
        failures.push({
          query: testCase.query,
          description: testCase.description,
          issues
        });
      }
      
    } catch (error) {
      failed++;
      console.log(`   ❌ Test failed with error: ${error}`);
      failures.push({
        query: testCase.query,
        description: testCase.description,
        issues: [`Error: ${error}`]
      });
    }
  }

  // Test hybrid functionality
  console.log('\n🔄 Testing Hybrid Functionality\n');
  
  const hybridTestCases = [
    {
      query: "sandy beaches in corfu",
      description: "Simple query - should use original implementation",
      useEnhanced: false
    },
    {
      query: "I absolutely love the most beautiful sandy beaches with amazing snorkeling in Crete",
      description: "Complex query - should use enhanced implementation",
      useEnhanced: true
    }
  ];

  for (const testCase of hybridTestCases) {
    try {
      console.log(`\n🔍 Testing Hybrid: ${testCase.description}`);
      console.log(`   Query: "${testCase.query}"`);
      
      const result = await extractFromNaturalLanguage(testCase.query);
      
      if (testCase.useEnhanced) {
        if (result.sentiment && result.intent && result.entities) {
          console.log(`   ✅ Enhanced features present`);
          passed++;
        } else {
          console.log(`   ❌ Enhanced features missing`);
          failed++;
        }
      } else {
        if (!result.sentiment && !result.intent && !result.entities) {
          console.log(`   ✅ Original implementation used`);
          passed++;
        } else {
          console.log(`   ❌ Unexpected enhanced features present`);
          failed++;
        }
      }
      
    } catch (error) {
      failed++;
      console.log(`   ❌ Hybrid test failed: ${error}`);
    }
  }

  // Test utility functions
  console.log('\n🛠️  Testing Utility Functions\n');
  
  // Test shouldUseEnhancedNLP
  const complexityTests = [
    { query: "beaches", expected: false, description: "Simple query" },
    { query: "I want the best sandy beaches with amazing snorkeling and family-friendly amenities", expected: true, description: "Complex query" },
    { query: "What are the most beautiful beaches in Crete?", expected: true, description: "Question with sentiment" }
  ];

  // Removed shouldUseEnhancedNLP tests as function no longer exists
  console.log(`   ⏭️  Skipped complexity tests (function removed)`);

  // Test search context creation
  const context = createSearchContext({
    userPreferences: ['family-friendly', 'calm waters'],
    timeOfDay: 'morning',
    season: 'summer'
  });
  
  if (context.userPreferences && context.timeOfDay && context.season) {
    console.log(`   ✅ Search context created successfully`);
    passed++;
  } else {
    console.log(`   ❌ Search context creation failed`);
    failed++;
  }

  // Test NLP stats
  const stats = getNLPStats();
  if (stats && typeof stats === 'object') {
    console.log(`   ✅ NLP stats retrieved`);
    passed++;
  } else {
    console.log(`   ❌ NLP stats retrieval failed`);
    failed++;
  }

  // Test cache clearing
  try {
    clearNLPCaches();
    console.log(`   ✅ NLP caches cleared`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Cache clearing failed: ${error}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 ENHANCED NLP TEST RESULTS: ${passed}/${passed + failed} passed (${Math.round(passed/(passed + failed)*100)}%)\n`);

  if (failed > 0) {
    console.log('❌ FAILED TESTS:\n');
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.description}`);
      console.log(`   Query: "${failure.query}"`);
      failure.issues.forEach(issue => console.log(issue));
      console.log('');
    });
  }

  console.log('✅ Enhanced NLP test suite completed!\n');
  
  return { passed, failed, failures };
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEnhancedNLPTests().then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

export { runEnhancedNLPTests };

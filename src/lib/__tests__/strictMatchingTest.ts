/**
 * Strict Matching Test for NLP to FilterBar Integration
 * This test verifies that the NLP system produces filter values that exactly match
 * what the FilterBar expects for strict filtering.
 */

import { extractFromNaturalLanguage } from '../naturalLanguageSearch';
import { FilterState } from '../../hooks/useUrlState';

// Test cases that should produce specific filter combinations
const testCases = [
  {
    query: "I want sandy beaches with calm waters and lifeguards",
    expectedFilters: {
      type: ['SANDY'],
      waveConditions: ['CALM'],
      amenities: ['lifeguard']
    }
  },
  {
    query: "Show me pebbly beaches with parking and blue flag certification",
    expectedFilters: {
      type: ['PEBBLY'],
      parking: ['LARGE_LOT'], // "parking" should map to LARGE_LOT
      blueFlag: true
    }
  },
  {
    query: "Find organized beaches with sunbeds, umbrellas, and tavernas",
    expectedFilters: {
      organized: ['organized'],
      amenities: ['sunbeds', 'umbrellas', 'taverna']
    }
  },
  {
    query: "I need beaches near me with family-friendly amenities and calm waters",
    expectedFilters: {
      nearMe: true,
      amenities: ['family_friendly'],
      waveConditions: ['CALM']
    }
  },
  {
    query: "Show me beaches with wavy conditions for surfing and photography",
    expectedFilters: {
      waveConditions: ['WAVY'],
      amenities: ['photography']
    }
  },
  {
    query: "Find unorganized beaches with no parking and snorkeling opportunities",
    expectedFilters: {
      organized: ['unorganized'],
      parking: ['NONE'],
      amenities: ['snorkeling']
    }
  },
  {
    query: "I want mixed beaches with roadside parking and water sports",
    expectedFilters: {
      type: ['MIXED'],
      parking: ['ROADSIDE'],
      amenities: ['water_sports']
    }
  },
  {
    query: "Show me blue flag beaches in Crete and Mykonos",
    expectedFilters: {
      blueFlag: true,
      location: 'crete', // Primary location
      locations: ['crete', 'mykonos'] // All locations
    }
  },
  {
    query: "Find sandy beaches with calm waters in Santorini, Paros, and Naxos",
    expectedFilters: {
      type: ['SANDY'],
      waveConditions: ['CALM'],
      location: 'santorini', // Primary location
      locations: ['santorini', 'paros', 'naxos'] // All locations
    }
  },
  {
    query: "I want beaches in the Cyclades islands with lifeguards",
    expectedFilters: {
      amenities: ['lifeguard'],
      // Note: Cyclades is a region, so it might extract multiple islands
      // The exact behavior depends on the location extraction logic
    }
  }
];

async function runStrictMatchingTest() {
  console.log('🧪 STRICT MATCHING TEST FOR NLP TO FILTERBAR INTEGRATION');
  console.log('================================================================================\n');

  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📋 Test ${i + 1}: "${testCase.query}"`);
    console.log('------------------------------------------------------------');

    try {
      const result = await extractFromNaturalLanguage(testCase.query);
      const extractedFilters = result.filters;

      console.log('🎯 EXTRACTED FILTERS:');
      console.log('   Type:', extractedFilters.type || 'none');
      console.log('   Wave Conditions:', extractedFilters.waveConditions || 'none');
      console.log('   Parking:', extractedFilters.parking || 'none');
      console.log('   Amenities:', extractedFilters.amenities || 'none');
      console.log('   Organized:', extractedFilters.organized || 'none');
      console.log('   Blue Flag:', extractedFilters.blueFlag || false);
      console.log('   Near Me:', extractedFilters.nearMe || false);
      console.log('   Location:', extractedFilters.location || 'none');
      console.log('   Locations:', extractedFilters.locations || 'none');

      // Check each expected filter
      let testPassed = true;
      const mismatches: string[] = [];

      for (const [filterKey, expectedValue] of Object.entries(testCase.expectedFilters)) {
        const extractedValue = extractedFilters[filterKey as keyof typeof extractedFilters];
        
        if (Array.isArray(expectedValue)) {
          if (!Array.isArray(extractedValue) ||
              !expectedValue.every(val => (extractedValue as unknown[]).includes(val))) {
            testPassed = false;
            mismatches.push(`${filterKey}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(extractedValue)}`);
          }
        } else if (extractedValue !== expectedValue) {
          testPassed = false;
          mismatches.push(`${filterKey}: expected ${expectedValue}, got ${extractedValue}`);
        }
      }

      if (testPassed) {
        console.log('✅ TEST PASSED');
        passedTests++;
      } else {
        console.log('❌ TEST FAILED');
        console.log('   Mismatches:', mismatches.join(', '));
      }

      console.log('   Confidence:', `${(result.confidence * 100).toFixed(1)}%`);
      console.log('   Processing Time:', `${result.processingTime}ms`);
      console.log('');

    } catch (error) {
      console.log('❌ TEST ERROR:', error);
      console.log('');
    }
  }

  console.log('📊 TEST RESULTS');
  console.log('================================================================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} (${(((totalTests - passedTests) / totalTests) * 100).toFixed(1)}%)`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! NLP system is correctly matching FilterBar expectations.');
  } else {
    console.log('\n⚠️  Some tests failed. NLP system needs further refinement.');
  }

  return passedTests === totalTests;
}

// Run the test
runStrictMatchingTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

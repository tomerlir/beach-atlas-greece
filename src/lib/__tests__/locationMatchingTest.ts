/**
 * Comprehensive Location Matching Test
 * This test investigates location matching behavior and compares it to expected functionality
 */

import { extractFromNaturalLanguage } from '../naturalLanguageSearch';

// Test cases for location matching
const locationTestCases = [
  // Basic location queries
  {
    query: "beaches in Crete",
    expectedPlace: "crete",
    expectedSearchTerm: "", // Should be empty when place is detected
    description: "Basic location query"
  },
  {
    query: "show me beaches in Mykonos",
    expectedPlace: "mykonos", 
    expectedSearchTerm: "",
    description: "Location with action words"
  },
  {
    query: "find beaches in Santorini",
    expectedPlace: "santorini",
    expectedSearchTerm: "",
    description: "Location with find command"
  },
  {
    query: "beaches near Corfu",
    expectedPlace: "corfu",
    expectedSearchTerm: "",
    description: "Location with 'near' preposition"
  },
  {
    query: "I want to see beaches in Rhodes",
    expectedPlace: "rhodes",
    expectedSearchTerm: "i to see",
    description: "Complex sentence with location"
  },
  
  // Location + specific filters
  {
    query: "sandy beaches in Crete",
    expectedPlace: "crete",
    expectedSearchTerm: "",
    expectedFilters: { type: ['SANDY'] },
    description: "Location with beach type filter"
  },
  {
    query: "organized beaches with lifeguards in Mykonos",
    expectedPlace: "mykonos",
    expectedSearchTerm: "",
    expectedFilters: { organized: ['organized'], amenities: ['lifeguard'] },
    description: "Location with multiple filters"
  },
  {
    query: "blue flag beaches in Santorini",
    expectedPlace: "santorini",
    expectedSearchTerm: "",
    expectedFilters: { blueFlag: true },
    description: "Location with blue flag filter"
  },
  
  // Known locations (should be detected as places)
  {
    query: "beaches in Athens",
    expectedPlace: "attica",
    expectedSearchTerm: "athens", // Should keep the original city name in search
    description: "Athens should map to Attica region"
  },
  {
    query: "beaches in Thessaloniki",
    expectedPlace: "chalkidiki",
    expectedSearchTerm: "thessaloniki",
    description: "Thessaloniki should map to Chalkidiki region"
  },
  
  // Mixed queries (location + other terms)
  {
    query: "beautiful beaches in Crete",
    expectedPlace: "crete",
    expectedSearchTerm: "beautiful", // Should keep descriptive words
    description: "Location with descriptive words"
  },
  {
    query: "best beaches in Mykonos for families",
    expectedPlace: "mykonos",
    expectedSearchTerm: "best",
    expectedFilters: { amenities: ['family_friendly'] },
    description: "Location with descriptive words and filters"
  },
  
  // Edge cases
  {
    query: "Crete beaches",
    expectedPlace: "crete",
    expectedSearchTerm: "",
    description: "Location without preposition"
  },
  {
    query: "Mykonos beach bars",
    expectedPlace: "mykonos",
    expectedSearchTerm: "",
    expectedFilters: { amenities: ['beach_bar'] },
    description: "Location with amenity"
  },
  {
    query: "beaches in Crete and Mykonos",
    expectedPlace: "crete", // Should detect first location
    expectedSearchTerm: "mykonos", // Should keep second location in search
    description: "Multiple locations"
  }
];

async function runLocationMatchingTest() {
  console.log('🗺️  COMPREHENSIVE LOCATION MATCHING TEST');
  console.log('================================================================================\n');

  let passedTests = 0;
  let totalTests = locationTestCases.length;

  for (let i = 0; i < locationTestCases.length; i++) {
    const testCase = locationTestCases[i];
    console.log(`📋 Test ${i + 1}: "${testCase.query}"`);
    console.log(`   Expected: ${testCase.description}`);
    console.log('------------------------------------------------------------');

    try {
      const result = await extractFromNaturalLanguage(testCase.query);
      
      console.log('🧠 NLP EXTRACTION RESULTS:');
      console.log('   Place:', result.place || 'none');
      console.log('   Search Term:', result.cleanedSearchTerm || 'none');
      console.log('   Original Query:', result.originalQuery);
      console.log('   Confidence:', `${(result.confidence * 100).toFixed(1)}%`);
      console.log('   Processing Time:', `${result.processingTime}ms`);
      
      if (result.filters && Object.keys(result.filters).length > 0) {
        console.log('   Extracted Filters:', JSON.stringify(result.filters, null, 2));
      }

      // Check place detection
      let placeTestPassed = false;
      if (testCase.expectedPlace === undefined) {
        placeTestPassed = result.place === undefined;
      } else {
        placeTestPassed = result.place === testCase.expectedPlace;
      }

      // Check search term
      let searchTermTestPassed = false;
      if (testCase.expectedSearchTerm === "") {
        searchTermTestPassed = result.cleanedSearchTerm === "";
      } else {
        searchTermTestPassed = result.cleanedSearchTerm === testCase.expectedSearchTerm;
      }

      // Check filters if expected
      let filtersTestPassed = true;
      if (testCase.expectedFilters) {
        for (const [filterKey, expectedValue] of Object.entries(testCase.expectedFilters)) {
          const extractedValue = result.filters[filterKey as keyof typeof result.filters];
          if (Array.isArray(expectedValue)) {
            if (!Array.isArray(extractedValue) || 
                !expectedValue.every(val => (extractedValue as unknown[]).includes(val))) {
              filtersTestPassed = false;
              break;
            }
          } else if (extractedValue !== expectedValue) {
            filtersTestPassed = false;
            break;
          }
        }
      }

      const testPassed = placeTestPassed && searchTermTestPassed && filtersTestPassed;
      
      if (testPassed) {
        console.log('✅ TEST PASSED');
        passedTests++;
      } else {
        console.log('❌ TEST FAILED');
        if (!placeTestPassed) {
          console.log(`   Place mismatch: expected "${testCase.expectedPlace}", got "${result.place}"`);
        }
        if (!searchTermTestPassed) {
          console.log(`   Search term mismatch: expected "${testCase.expectedSearchTerm}", got "${result.cleanedSearchTerm}"`);
        }
        if (!filtersTestPassed) {
          console.log(`   Filters mismatch: expected ${JSON.stringify(testCase.expectedFilters)}, got ${JSON.stringify(result.filters)}`);
        }
      }

      console.log('');

    } catch (error) {
      console.log('❌ TEST ERROR:', error);
      console.log('');
    }
  }

  console.log('📊 LOCATION MATCHING TEST RESULTS');
  console.log('================================================================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} (${(((totalTests - passedTests) / totalTests) * 100).toFixed(1)}%)`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL LOCATION MATCHING TESTS PASSED!');
  } else {
    console.log('\n⚠️  Some location matching tests failed.');
    console.log('   This indicates issues with location detection or search term handling.');
  }

  return passedTests === totalTests;
}

// Run the test
runLocationMatchingTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Location matching test execution failed:', error);
  process.exit(1);
});

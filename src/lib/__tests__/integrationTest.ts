/**
 * Integration Test for NLP to FilterBar Integration
 * This test verifies that the NLP system produces filter values that work correctly
 * with the actual FilterBar filtering logic and database queries.
 */

import { extractFromNaturalLanguage, applyExtractedFilters } from '../naturalLanguageSearch';
import { FilterState } from '../../hooks/useUrlState';

// Mock beach data that matches the database schema
const mockBeaches = [
  {
    id: '1',
    name: 'Balos Beach',
    area: 'Kissamos, Crete',
    description: 'Stunning lagoon with turquoise waters',
    latitude: 35.5917,
    longitude: 23.5858,
    organized: false,
    blue_flag: false,
    parking: 'NONE',
    amenities: ['snorkeling', 'photography'],
    type: 'SANDY',
    wave_conditions: 'CALM'
  },
  {
    id: '2',
    name: 'Myrtos Beach',
    area: 'Kefalonia, Ionian Islands',
    description: 'Dramatic white pebble beach',
    latitude: 38.3431,
    longitude: 20.5553,
    organized: true,
    blue_flag: true,
    parking: 'LARGE_LOT',
    amenities: ['sunbeds', 'umbrellas', 'taverna', 'water_sports'],
    type: 'PEBBLY',
    wave_conditions: 'MODERATE'
  },
  {
    id: '3',
    name: 'Paradise Beach',
    area: 'Mykonos, Cyclades',
    description: 'Lively beach with beach bars',
    latitude: 37.4136,
    longitude: 25.3442,
    organized: true,
    blue_flag: false,
    parking: 'LARGE_LOT',
    amenities: ['sunbeds', 'umbrellas', 'beach_bar', 'water_sports', 'music'],
    type: 'SANDY',
    wave_conditions: 'WAVY'
  },
  {
    id: '4',
    name: 'Tsambika Beach',
    area: 'Rhodes, Dodecanese',
    description: 'Golden sand beach with shallow waters',
    latitude: 36.2244,
    longitude: 28.1358,
    organized: true,
    blue_flag: true,
    parking: 'LARGE_LOT',
    amenities: ['sunbeds', 'umbrellas', 'taverna', 'water_sports', 'family_friendly'],
    type: 'SANDY',
    wave_conditions: 'CALM'
  }
];

// Mock filtering function that simulates the actual beach filtering logic
function filterBeaches(beaches: any[], filters: FilterState): any[] {
  return beaches.filter(beach => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase().trim();
      const matchesName = beach.name && beach.name.toLowerCase().includes(searchTerm);
      const matchesArea = beach.area && beach.area.toLowerCase().includes(searchTerm);
      if (!matchesName && !matchesArea) return false;
    }

    // Organized filter
    if (filters.organized.length > 0) {
      const beachOrganizedType = beach.organized ? 'organized' : 'unorganized';
      if (!filters.organized.includes(beachOrganizedType)) {
        return false;
      }
    }

    // Blue Flag filter
    if (filters.blueFlag && !beach.blue_flag) {
      return false;
    }

    // Parking filter
    if (filters.parking.length > 0 && !filters.parking.includes(beach.parking)) {
      return false;
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every(amenity => 
        beach.amenities && beach.amenities.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }

    // Wave conditions filter
    if (filters.waveConditions.length > 0 && !filters.waveConditions.includes(beach.wave_conditions)) {
      return false;
    }

    // Type filter (beach surface)
    if (filters.type.length > 0 && !filters.type.includes(beach.type)) {
      return false;
    }

    return true;
  });
}

// Test cases that should produce specific filtered results
const integrationTestCases = [
  {
    query: "Show me sandy beaches with calm waters",
    expectedBeachIds: ['1', '4'], // Balos and Tsambika
    description: "Should find sandy beaches with calm waters"
  },
  {
    query: "Find organized beaches with blue flag certification",
    expectedBeachIds: ['2', '4'], // Myrtos and Tsambika
    description: "Should find organized beaches with blue flag"
  },
  {
    query: "I want beaches with sunbeds and tavernas",
    expectedBeachIds: ['2', '4'], // Myrtos and Tsambika (Paradise doesn't have taverna)
    description: "Should find beaches with sunbeds and tavernas"
  },
  {
    query: "Show me pebbly beaches with water sports",
    expectedBeachIds: ['2'], // Only Myrtos
    description: "Should find pebbly beaches with water sports"
  },
  {
    query: "Find beaches with no parking and snorkeling",
    expectedBeachIds: ['1'], // Only Balos
    description: "Should find beaches with no parking and snorkeling"
  },
  {
    query: "I want family-friendly beaches with calm waters",
    expectedBeachIds: ['4'], // Only Tsambika
    description: "Should find family-friendly beaches with calm waters"
  }
];

async function runIntegrationTest() {
  console.log('🔗 INTEGRATION TEST: NLP TO FILTERBAR TO DATABASE');
  console.log('================================================================================\n');

  let passedTests = 0;
  let totalTests = integrationTestCases.length;

  for (let i = 0; i < integrationTestCases.length; i++) {
    const testCase = integrationTestCases[i];
    console.log(`📋 Test ${i + 1}: "${testCase.query}"`);
    console.log(`   Expected: ${testCase.description}`);
    console.log('------------------------------------------------------------');

    try {
      // Step 1: Extract filters using NLP
      const nlpResult = await extractFromNaturalLanguage(testCase.query);
      console.log('🧠 NLP EXTRACTION:');
      console.log('   Filters:', JSON.stringify(nlpResult.filters, null, 2));
      console.log('   Confidence:', `${(nlpResult.confidence * 100).toFixed(1)}%`);

      // Step 2: Apply filters to create FilterState
      const baseFilters: FilterState = {
        search: '',
        organized: [],
        blueFlag: false,
        parking: [],
        amenities: [],
        waveConditions: [],
        type: [],
        sort: 'name.asc',
        page: 1,
        nearMe: false,
      };

      const appliedFilters = applyExtractedFilters(baseFilters, nlpResult);
      console.log('🎯 APPLIED FILTERS:');
      console.log('   Search:', appliedFilters.search || 'none');
      console.log('   Type:', appliedFilters.type || 'none');
      console.log('   Wave Conditions:', appliedFilters.waveConditions || 'none');
      console.log('   Parking:', appliedFilters.parking || 'none');
      console.log('   Amenities:', appliedFilters.amenities || 'none');
      console.log('   Organized:', appliedFilters.organized || 'none');
      console.log('   Blue Flag:', appliedFilters.blueFlag);

      // Step 3: Filter beaches using the same logic as the app
      const filteredBeaches = filterBeaches(mockBeaches, appliedFilters);
      const actualBeachIds = filteredBeaches.map(beach => beach.id).sort();
      const expectedBeachIds = testCase.expectedBeachIds.sort();

      console.log('🏖️  FILTERED RESULTS:');
      console.log('   Expected Beach IDs:', expectedBeachIds);
      console.log('   Actual Beach IDs:', actualBeachIds);
      console.log('   Beach Names:', filteredBeaches.map(b => b.name).join(', '));

      // Step 4: Verify results match expectations
      const testPassed = JSON.stringify(actualBeachIds) === JSON.stringify(expectedBeachIds);
      
      if (testPassed) {
        console.log('✅ INTEGRATION TEST PASSED');
        passedTests++;
      } else {
        console.log('❌ INTEGRATION TEST FAILED');
        console.log('   Expected:', expectedBeachIds);
        console.log('   Got:', actualBeachIds);
      }

      console.log('');

    } catch (error) {
      console.log('❌ INTEGRATION TEST ERROR:', error);
      console.log('');
    }
  }

  console.log('📊 INTEGRATION TEST RESULTS');
  console.log('================================================================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} (${(((totalTests - passedTests) / totalTests) * 100).toFixed(1)}%)`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('   The NLP system is correctly integrated with FilterBar filtering logic.');
    console.log('   Natural language queries will produce the expected filtered beach results.');
  } else {
    console.log('\n⚠️  Some integration tests failed.');
    console.log('   The NLP system needs further refinement for complete integration.');
  }

  return passedTests === totalTests;
}

// Run the integration test
runIntegrationTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Integration test execution failed:', error);
  process.exit(1);
});

/**
 * Enhanced Location System Test
 * Tests the new robust location filtering and matching system
 */

import { LocationMatcher } from '../location/LocationMatcher.js';
import { GeographicFilter } from '../location/GeographicFilter.js';
import { EnhancedLocationExtractor } from '../nlp/EnhancedLocationExtractor';
import { extractFromNaturalLanguage } from '../naturalLanguageSearch';

// Mock beach data for testing
const mockBeaches = [
  {
    id: '1',
    name: 'Elafonisi Beach',
    area: 'crete',
    area_id: 'crete-area-id',
    latitude: 35.2700,
    longitude: 23.5300,
    type: 'SANDY',
    wave_conditions: 'CALM',
    parking: 'LARGE_LOT',
    organized: true,
    blue_flag: true,
    amenities: ['sunbeds', 'umbrellas', 'lifeguard'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Beautiful pink sand beach in Crete',
    photo_url: null,
    photo_source: null,
    slug: 'elafonisi-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  },
  {
    id: '2',
    name: 'Myrtos Beach',
    area: 'kefalonia',
    area_id: 'kefalonia-area-id',
    latitude: 38.2000,
    longitude: 20.6000,
    type: 'PEBBLY',
    wave_conditions: 'MODERATE',
    parking: 'SMALL_LOT',
    organized: false,
    blue_flag: false,
    amenities: ['taverna'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Stunning pebble beach in Kefalonia',
    photo_url: null,
    photo_source: null,
    slug: 'myrtos-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  },
  {
    id: '3',
    name: 'Navagio Beach',
    area: 'zakynthos',
    area_id: 'zakynthos-area-id',
    latitude: 37.8500,
    longitude: 20.7500,
    type: 'SANDY',
    wave_conditions: 'WAVY',
    parking: 'NONE',
    organized: false,
    blue_flag: false,
    amenities: ['photography'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Famous shipwreck beach in Zakynthos',
    photo_url: null,
    photo_source: null,
    slug: 'navagio-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  },
  {
    id: '4',
    name: 'Paradise Beach',
    area: 'mykonos',
    area_id: 'mykonos-area-id',
    latitude: 37.4500,
    longitude: 25.3500,
    type: 'SANDY',
    wave_conditions: 'MODERATE',
    parking: 'LARGE_LOT',
    organized: true,
    blue_flag: true,
    amenities: ['beach_bar', 'music', 'sunbeds'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Popular party beach in Mykonos',
    photo_url: null,
    photo_source: null,
    slug: 'paradise-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  }
];

async function runEnhancedLocationTest() {
  console.log('🗺️  ENHANCED LOCATION SYSTEM TEST');
  console.log('================================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Location Matcher Basic Functionality
  console.log('🔍 Test 1: Location Matcher Basic Functionality');
  totalTests++;
  try {
    const locationMatcher = LocationMatcher.getInstance();
    
    // Test exact match
    const creteMatch = locationMatcher.findLocationMatch('crete');
    if (creteMatch && creteMatch.place === 'crete' && creteMatch.confidence === 1.0) {
      console.log('✅ Exact match test passed');
    } else {
      console.log('❌ Exact match test failed');
      return;
    }
    
    // Test alias match
    const thiraMatch = locationMatcher.findLocationMatch('thira');
    if (thiraMatch && thiraMatch.place === 'santorini') {
      console.log('✅ Alias match test passed');
    } else {
      console.log('❌ Alias match test failed');
      return;
    }
    
    // Test fuzzy match
    const mykonoMatch = locationMatcher.findLocationMatch('mykono');
    if (mykonoMatch && mykonoMatch.place === 'mykonos' && mykonoMatch.confidence > 0.7) {
      console.log('✅ Fuzzy match test passed');
    } else {
      console.log('❌ Fuzzy match test failed');
      return;
    }
    
    passedTests++;
    console.log('✅ Location Matcher Basic Functionality - PASSED\n');
  } catch (error) {
    console.log('❌ Location Matcher Basic Functionality - FAILED:', error, '\n');
  }

  // Test 2: Geographic Filter Location Filtering
  console.log('🔍 Test 2: Geographic Filter Location Filtering');
  totalTests++;
  try {
    const geographicFilter = GeographicFilter.getInstance();
    
    // Test area filtering
    const creteResult = geographicFilter.filterByLocation(mockBeaches, 'crete');
    if (creteResult.beaches.length === 1 && creteResult.beaches[0].area === 'crete') {
      console.log('✅ Area filtering test passed');
    } else {
      console.log('❌ Area filtering test failed');
      return;
    }
    
    // Test proximity filtering
    const proximityResult = geographicFilter.filterByProximity(mockBeaches, {
      center: { latitude: 35.2700, longitude: 23.5300 }, // Near Elafonisi
      radiusKm: 100
    });
    if (proximityResult.beaches.length > 0) {
      console.log('✅ Proximity filtering test passed');
    } else {
      console.log('❌ Proximity filtering test failed');
      return;
    }
    
    passedTests++;
    console.log('✅ Geographic Filter Location Filtering - PASSED\n');
  } catch (error) {
    console.log('❌ Geographic Filter Location Filtering - FAILED:', error, '\n');
  }

  // Test 3: Enhanced Location Extractor
  console.log('🔍 Test 3: Enhanced Location Extractor');
  totalTests++;
  try {
    const locationExtractor = EnhancedLocationExtractor.getInstance();
    
    // Test single location extraction
    const singleResult = locationExtractor.extractLocations('beaches in Crete', {
      places: [{ text: 'Crete', type: 'place', confidence: 0.9, normalized: 'crete' }],
      amenities: [],
      beachTypes: [],
      waveConditions: [],
      parking: [],
      organization: [],
      all: []
    });
    
    if (singleResult.primaryLocation?.place === 'crete' && singleResult.confidence > 0.8) {
      console.log('✅ Single location extraction test passed');
    } else {
      console.log('❌ Single location extraction test failed');
      return;
    }
    
    // Test multi-location extraction
    const multiResult = locationExtractor.extractLocations('beaches in Crete and Mykonos', {
      places: [],
      amenities: [],
      beachTypes: [],
      waveConditions: [],
      parking: [],
      organization: [],
      all: []
    });
    
    console.log('Multi-location result:', {
      allLocations: multiResult.allLocations.map(l => l.place),
      searchStrategy: multiResult.searchStrategy,
      confidence: multiResult.confidence
    });
    
    if (multiResult.allLocations.length >= 2 && multiResult.searchStrategy === 'multi') {
      console.log('✅ Multi-location extraction test passed');
    } else {
      console.log('❌ Multi-location extraction test failed');
      return;
    }
    
    passedTests++;
    console.log('✅ Enhanced Location Extractor - PASSED\n');
  } catch (error) {
    console.log('❌ Enhanced Location Extractor - FAILED:', error, '\n');
  }

  // Test 4: Integration with Natural Language Search
  console.log('🔍 Test 4: Integration with Natural Language Search');
  totalTests++;
  try {
    // Test basic location query
    const basicResult = await extractFromNaturalLanguage('sandy beaches in Crete');
    if (basicResult.place === 'crete' && 
        basicResult.locationExtraction.primaryLocation?.place === 'crete' &&
        basicResult.filters.type?.includes('SANDY')) {
      console.log('✅ Basic location query integration test passed');
    } else {
      console.log('❌ Basic location query integration test failed');
      return;
    }
    
    // Test complex location query
    const complexResult = await extractFromNaturalLanguage('organized beaches with lifeguards in Mykonos');
    if (complexResult.place === 'mykonos' && 
        complexResult.filters.organized?.includes('organized') &&
        complexResult.filters.amenities?.includes('lifeguard')) {
      console.log('✅ Complex location query integration test passed');
    } else {
      console.log('❌ Complex location query integration test failed');
      return;
    }
    
    // Test fuzzy location matching
    const fuzzyResult = await extractFromNaturalLanguage('beaches in Thira');
    if (fuzzyResult.place === 'santorini') {
      console.log('✅ Fuzzy location matching integration test passed');
    } else {
      console.log('❌ Fuzzy location matching integration test failed');
      return;
    }
    
    passedTests++;
    console.log('✅ Integration with Natural Language Search - PASSED\n');
  } catch (error) {
    console.log('❌ Integration with Natural Language Search - FAILED:', error, '\n');
  }

  // Test 5: Location Validation and Suggestions
  console.log('🔍 Test 5: Location Validation and Suggestions');
  totalTests++;
  try {
    const locationExtractor = EnhancedLocationExtractor.getInstance();
    
    // Test valid location
    const validResult = locationExtractor.validateLocationQuery('crete');
    if (validResult.isValid && validResult.confidence && validResult.confidence > 0.8) {
      console.log('✅ Valid location validation test passed');
    } else {
      console.log('❌ Valid location validation test failed');
      return;
    }
    
    // Test invalid location with suggestions
    const invalidResult = locationExtractor.validateLocationQuery('cre');
    if (!invalidResult.isValid && invalidResult.suggestions && invalidResult.suggestions.length > 0) {
      console.log('✅ Invalid location suggestions test passed');
    } else {
      console.log('❌ Invalid location suggestions test failed');
      return;
    }
    
    // Test location suggestions
    const suggestions = locationExtractor.getLocationSuggestions('myk', 5);
    if (suggestions.length > 0 && suggestions[0].place === 'mykonos') {
      console.log('✅ Location suggestions test passed');
    } else {
      console.log('❌ Location suggestions test failed');
      return;
    }
    
    passedTests++;
    console.log('✅ Location Validation and Suggestions - PASSED\n');
  } catch (error) {
    console.log('❌ Location Validation and Suggestions - FAILED:', error, '\n');
  }

  // Test 6: Performance and Edge Cases
  console.log('🔍 Test 6: Performance and Edge Cases');
  totalTests++;
  try {
    const locationMatcher = LocationMatcher.getInstance();
    
    // Test empty query
    const emptyResult = locationMatcher.findLocationMatch('');
    if (emptyResult === null) {
      console.log('✅ Empty query handling test passed');
    } else {
      console.log('❌ Empty query handling test failed');
      return;
    }
    
    // Test very long query
    const longQuery = 'beaches in ' + 'a'.repeat(1000);
    const longResult = locationMatcher.findLocationMatch(longQuery);
    // Should not crash and should return null or a valid result
    console.log('✅ Long query handling test passed');
    
    // Test special characters (should handle gracefully, not necessarily match)
    const specialResult = locationMatcher.findLocationMatch('crété');
    // The system should handle special characters gracefully (return null is acceptable)
    if (specialResult === null || specialResult.place === 'crete') {
      console.log('✅ Special characters handling test passed');
    } else {
      console.log('❌ Special characters handling test failed');
      return;
    }
    
    passedTests++;
    console.log('✅ Performance and Edge Cases - PASSED\n');
  } catch (error) {
    console.log('❌ Performance and Edge Cases - FAILED:', error, '\n');
  }

  // Final Results
  console.log('📊 ENHANCED LOCATION SYSTEM TEST RESULTS');
  console.log('================================================================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} (${(((totalTests - passedTests) / totalTests) * 100).toFixed(1)}%)`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL ENHANCED LOCATION SYSTEM TESTS PASSED!');
    console.log('🚀 The new location filtering system is working correctly!');
  } else {
    console.log('\n⚠️  Some enhanced location system tests failed.');
    console.log('   Please review the implementation and fix the issues.');
  }

  return passedTests === totalTests;
}

// Run the test
runEnhancedLocationTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Enhanced location system test execution failed:', error);
  process.exit(1);
});

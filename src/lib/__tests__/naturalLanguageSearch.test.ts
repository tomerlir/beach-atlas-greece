import { extractFromNaturalLanguage } from '../naturalLanguageSearch';

/**
 * Comprehensive NLQ Test Suite
 * Tests real-world user queries to ensure proper extraction
 */

interface TestCase {
  query: string;
  expected: {
    search: string; // What should be in cleanedSearchTerm
    type?: string[];
    waveConditions?: string[];
    parking?: string[];
    amenities?: string[];
    blueFlag?: boolean;
    organized?: string[];
    place?: string;
  };
  description: string;
}

const testCases: TestCase[] = [
  // ==================== BASIC QUERIES ====================
  {
    query: "sandy beaches",
    expected: {
      search: "",
      type: ["SANDY"],
    },
    description: "Simple beach type query"
  },
  {
    query: "calm beaches",
    expected: {
      search: "",
      waveConditions: ["CALM"],
    },
    description: "Simple wave condition query"
  },
  {
    query: "beaches with parking",
    expected: {
      search: "",
      parking: ["LARGE_LOT"],
    },
    description: "Simple parking query"
  },
  
  // ==================== COMPOUND QUERIES ====================
  {
    query: "sandy beaches with calm waters",
    expected: {
      search: "",
      type: ["SANDY"],
      waveConditions: ["CALM"],
    },
    description: "Beach type + wave conditions"
  },
  {
    query: "sandy beaches with calm waters in Corfu",
    expected: {
      search: "corfu",
      type: ["SANDY"],
      waveConditions: ["CALM"],
      place: "corfu",
    },
    description: "Beach type + wave conditions + location"
  },
  {
    query: "pebbly beach with parking in Mykonos",
    expected: {
      search: "mykonos",
      type: ["PEBBLY"],
      parking: ["LARGE_LOT"],
      place: "mykonos",
    },
    description: "Beach type + parking + location"
  },
  
  // ==================== AMENITY QUERIES ====================
  {
    query: "beach with sunbeds and umbrellas",
    expected: {
      search: "",
      amenities: ["sunbeds", "umbrellas"],
    },
    description: "Multiple amenities"
  },
  {
    query: "beaches with beach bar and lifeguard",
    expected: {
      search: "",
      amenities: ["beach_bar", "lifeguard"],
    },
    description: "Multi-word amenities"
  },
  {
    query: "family friendly beach with showers and toilets",
    expected: {
      search: "",
      amenities: ["family_friendly", "showers", "toilets"],
    },
    description: "Family amenities"
  },
  
  // ==================== BLUE FLAG QUERIES ====================
  {
    query: "blue flag beaches",
    expected: {
      search: "",
      blueFlag: true,
    },
    description: "Blue flag certification"
  },
  {
    query: "blue flag sandy beaches in Santorini",
    expected: {
      search: "santorini",
      type: ["SANDY"],
      blueFlag: true,
      place: "santorini",
    },
    description: "Blue flag + type + location"
  },
  
  // ==================== ORGANIZED QUERIES ====================
  {
    query: "unorganized beaches",
    expected: {
      search: "",
      organized: ["unorganized"],
    },
    description: "Unorganized beaches"
  },
  {
    query: "unorganised beaches",
    expected: {
      search: "",
      organized: ["unorganized"],
    },
    description: "Unorganised beaches (British spelling)"
  },
  {
    query: "not organized beaches",
    expected: {
      search: "",
      organized: ["unorganized"],
    },
    description: "Not organized beaches"
  },
  {
    query: "organized beaches",
    expected: {
      search: "",
      organized: ["organized"],
    },
    description: "Organized beaches"
  },
  {
    query: "organised beaches",
    expected: {
      search: "",
      organized: ["organized"],
    },
    description: "Organised beaches (British spelling)"
  },
  {
    query: "unorganized sandy beaches in Crete",
    expected: {
      search: "crete",
      type: ["SANDY"],
      organized: ["unorganized"],
      place: "crete",
    },
    description: "Unorganized + type + location"
  },
  
  // ==================== COMPLEX QUERIES ====================
  {
    query: "organized sandy beach with calm waters and parking in Rhodes",
    expected: {
      search: "rhodes",
      type: ["SANDY"],
      waveConditions: ["CALM"],
      parking: ["LARGE_LOT"],
      organized: ["organized"],
      place: "rhodes",
    },
    description: "Multiple filters + location"
  },
  {
    query: "find me sandy beaches with beach bar and water sports in Crete",
    expected: {
      search: "crete",
      type: ["SANDY"],
      amenities: ["beach_bar", "water_sports"],
      place: "crete",
    },
    description: "Natural language with 'find me'"
  },
  {
    query: "looking for calm pebbly beaches with lifeguard",
    expected: {
      search: "",
      type: ["PEBBLY"],
      waveConditions: ["CALM"],
      amenities: ["lifeguard"],
    },
    description: "Natural language with 'looking for'"
  },
  
  // ==================== LOCATION-ONLY QUERIES ====================
  {
    query: "beaches in Corfu",
    expected: {
      search: "corfu",
      place: "corfu",
    },
    description: "Simple location query"
  },
  {
    query: "Mykonos beaches",
    expected: {
      search: "mykonos",
      place: "mykonos",
    },
    description: "Location + beaches"
  },
  {
    query: "Santorini",
    expected: {
      search: "santorini",
      place: "santorini",
    },
    description: "Location only"
  },
  
  // ==================== EDGE CASES ====================
  {
    query: "mixed beach in corfu",
    expected: {
      search: "corfu",
      type: ["MIXED"],
      place: "corfu",
    },
    description: "Single filter + location with 'in' (user reported issue)"
  },
  {
    query: "sandy beach at mykonos",
    expected: {
      search: "mykonos",
      type: ["SANDY"],
      place: "mykonos",
    },
    description: "Single filter + location with 'at'"
  },
  {
    query: "pebbly beaches near rhodes",
    expected: {
      search: "rhodes",
      type: ["PEBBLY"],
      place: "rhodes",
    },
    description: "Single filter + location with 'near'"
  },
  {
    query: "sandy beach",
    expected: {
      search: "",
      type: ["SANDY"],
    },
    description: "Singular form"
  },
  {
    query: "wavy beaches for surfing",
    expected: {
      search: "",
      waveConditions: ["SURFABLE"],
    },
    description: "Surfing query"
  },
  {
    query: "beaches with no parking",
    expected: {
      search: "",
      parking: ["NONE"],
    },
    description: "No parking"
  },
  {
    query: "roadside parking beaches",
    expected: {
      search: "",
      parking: ["ROADSIDE"],
    },
    description: "Roadside parking"
  },
  
  // ==================== MIXED CASE & TYPOS ====================
  {
    query: "SANDY BEACHES WITH CALM WATERS",
    expected: {
      search: "",
      type: ["SANDY"],
      waveConditions: ["CALM"],
    },
    description: "All caps query"
  },
  {
    query: "Sandy Beaches With Calm Waters In Corfu",
    expected: {
      search: "corfu",
      type: ["SANDY"],
      waveConditions: ["CALM"],
      place: "corfu",
    },
    description: "Title case query"
  },
];

// ==================== TEST RUNNER ====================

console.log('\n🧪 NATURAL LANGUAGE QUERY TEST SUITE\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;
const failures: Array<{ query: string; description: string; issues: string[] }> = [];

testCases.forEach((testCase, index) => {
  const result = extractFromNaturalLanguage(testCase.query);
  const issues: string[] = [];
  
  // Check cleanedSearchTerm
  if (result.cleanedSearchTerm !== testCase.expected.search) {
    issues.push(`  ❌ Search: expected "${testCase.expected.search}", got "${result.cleanedSearchTerm}"`);
  }
  
  // Check type
  if (testCase.expected.type) {
    if (!result.filters.type || 
        result.filters.type.length !== testCase.expected.type.length ||
        !result.filters.type.every(t => testCase.expected.type?.includes(t))) {
      issues.push(`  ❌ Type: expected [${testCase.expected.type}], got [${result.filters.type || 'none'}]`);
    }
  } else if (result.filters.type && result.filters.type.length > 0) {
    issues.push(`  ❌ Type: expected none, got [${result.filters.type}]`);
  }
  
  // Check waveConditions
  if (testCase.expected.waveConditions) {
    if (!result.filters.waveConditions || 
        result.filters.waveConditions.length !== testCase.expected.waveConditions.length ||
        !result.filters.waveConditions.every(w => testCase.expected.waveConditions?.includes(w))) {
      issues.push(`  ❌ Waves: expected [${testCase.expected.waveConditions}], got [${result.filters.waveConditions || 'none'}]`);
    }
  } else if (result.filters.waveConditions && result.filters.waveConditions.length > 0) {
    issues.push(`  ❌ Waves: expected none, got [${result.filters.waveConditions}]`);
  }
  
  // Check parking
  if (testCase.expected.parking) {
    if (!result.filters.parking || 
        result.filters.parking.length !== testCase.expected.parking.length ||
        !result.filters.parking.every(p => testCase.expected.parking?.includes(p))) {
      issues.push(`  ❌ Parking: expected [${testCase.expected.parking}], got [${result.filters.parking || 'none'}]`);
    }
  } else if (result.filters.parking && result.filters.parking.length > 0) {
    issues.push(`  ❌ Parking: expected none, got [${result.filters.parking}]`);
  }
  
  // Check amenities
  if (testCase.expected.amenities) {
    if (!result.filters.amenities || 
        result.filters.amenities.length !== testCase.expected.amenities.length ||
        !result.filters.amenities.every(a => testCase.expected.amenities?.includes(a))) {
      issues.push(`  ❌ Amenities: expected [${testCase.expected.amenities}], got [${result.filters.amenities || 'none'}]`);
    }
  } else if (result.filters.amenities && result.filters.amenities.length > 0) {
    issues.push(`  ❌ Amenities: expected none, got [${result.filters.amenities}]`);
  }
  
  // Check blueFlag
  if (testCase.expected.blueFlag !== undefined) {
    if (result.filters.blueFlag !== testCase.expected.blueFlag) {
      issues.push(`  ❌ Blue Flag: expected ${testCase.expected.blueFlag}, got ${result.filters.blueFlag || false}`);
    }
  } else if (result.filters.blueFlag) {
    issues.push(`  ❌ Blue Flag: expected false, got true`);
  }
  
  // Check organized
  if (testCase.expected.organized) {
    if (!result.filters.organized || 
        result.filters.organized.length !== testCase.expected.organized.length ||
        !result.filters.organized.every(o => testCase.expected.organized?.includes(o))) {
      issues.push(`  ❌ Organized: expected [${testCase.expected.organized}], got [${result.filters.organized || 'none'}]`);
    }
  } else if (result.filters.organized && result.filters.organized.length > 0) {
    issues.push(`  ❌ Organized: expected none, got [${result.filters.organized}]`);
  }
  
  // Check place
  if (testCase.expected.place) {
    if (result.place !== testCase.expected.place) {
      issues.push(`  ❌ Place: expected "${testCase.expected.place}", got "${result.place || 'none'}"`);
    }
  } else if (result.place) {
    issues.push(`  ❌ Place: expected none, got "${result.place}"`);
  }
  
  // Report results
  if (issues.length === 0) {
    passed++;
    console.log(`✅ Test ${index + 1}/${testCases.length}: ${testCase.description}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}/${testCases.length}: ${testCase.description}`);
    console.log(`  Query: "${testCase.query}"`);
    issues.forEach(issue => console.log(issue));
    failures.push({
      query: testCase.query,
      description: testCase.description,
      issues
    });
  }
});

// ==================== SUMMARY ====================

console.log('\n' + '='.repeat(80));
console.log(`\n📊 TEST RESULTS: ${passed}/${testCases.length} passed (${Math.round(passed/testCases.length*100)}%)\n`);

if (failed > 0) {
  console.log('❌ FAILED TESTS:\n');
  failures.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure.description}`);
    console.log(`   Query: "${failure.query}"`);
    failure.issues.forEach(issue => console.log(issue));
    console.log('');
  });
}

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}

console.log('✅ All tests passed!\n');


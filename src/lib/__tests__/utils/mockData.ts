/**
 * Mock Data for NLP Testing Framework
 * Realistic test data for beaches, areas, and contexts
 */

import { Beach } from '@/types/beach';
import { Area } from '@/types/area';
import { SearchContext } from '@/lib/nlp';
import { FilterState } from '@/hooks/useUrlState';

/**
 * Mock beach data representing real Greek beaches
 */
export const mockBeaches: Beach[] = [
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
    amenities: ['sunbeds', 'umbrellas', 'lifeguard', 'showers', 'toilets'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Beautiful pink sand beach in Crete with crystal clear waters',
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
    amenities: ['taverna', 'photography'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Stunning pebble beach in Kefalonia with dramatic cliffs',
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
    amenities: ['photography', 'boat_trips'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Famous shipwreck beach in Zakynthos, accessible only by boat',
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
    amenities: ['beach_bar', 'music', 'sunbeds', 'umbrellas', 'lifeguard'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Popular party beach in Mykonos with beach bars and music',
    photo_url: null,
    photo_source: null,
    slug: 'paradise-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  },
  {
    id: '5',
    name: 'Red Beach',
    area: 'santorini',
    area_id: 'santorini-area-id',
    latitude: 36.3500,
    longitude: 25.4000,
    type: 'PEBBLY',
    wave_conditions: 'CALM',
    parking: 'ROADSIDE',
    organized: false,
    blue_flag: false,
    amenities: ['photography', 'snorkeling'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Unique red sand beach in Santorini with volcanic formations',
    photo_url: null,
    photo_source: null,
    slug: 'red-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  },
  {
    id: '6',
    name: 'Lindos Beach',
    area: 'rhodes',
    area_id: 'rhodes-area-id',
    latitude: 36.1000,
    longitude: 28.1000,
    type: 'SANDY',
    wave_conditions: 'CALM',
    parking: 'LARGE_LOT',
    organized: true,
    blue_flag: true,
    amenities: ['sunbeds', 'umbrellas', 'taverna', 'lifeguard', 'water_sports'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Beautiful sandy beach in Rhodes with ancient acropolis views',
    photo_url: null,
    photo_source: null,
    slug: 'lindos-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  },
  {
    id: '7',
    name: 'Balos Beach',
    area: 'crete',
    area_id: 'crete-area-id',
    latitude: 35.6000,
    longitude: 23.6000,
    type: 'SANDY',
    wave_conditions: 'CALM',
    parking: 'NONE',
    organized: false,
    blue_flag: false,
    amenities: ['photography', 'snorkeling'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Remote lagoon beach in Crete with turquoise waters',
    photo_url: null,
    photo_source: null,
    slug: 'balos-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  },
  {
    id: '8',
    name: 'Super Paradise Beach',
    area: 'mykonos',
    area_id: 'mykonos-area-id',
    latitude: 37.4200,
    longitude: 25.3200,
    type: 'SANDY',
    wave_conditions: 'MODERATE',
    parking: 'SMALL_LOT',
    organized: true,
    blue_flag: false,
    amenities: ['beach_bar', 'music', 'sunbeds', 'umbrellas'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Trendy beach in Mykonos with beach clubs and parties',
    photo_url: null,
    photo_source: null,
    slug: 'super-paradise-beach',
    source: null,
    status: 'ACTIVE',
    verified_at: null
  }
];

/**
 * Mock area data representing Greek islands and regions
 */
export const mockAreas: Area[] = [
  {
    id: 'crete-area-id',
    name: 'Crete',
    slug: 'crete',
    description: 'The largest Greek island with diverse beaches',
    hero_photo_url: null,
    hero_photo_source: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'ACTIVE'
  },
  {
    id: 'mykonos-area-id',
    name: 'Mykonos',
    slug: 'mykonos',
    description: 'Famous for its vibrant nightlife and beautiful beaches',
    hero_photo_url: null,
    hero_photo_source: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'ACTIVE'
  },
  {
    id: 'santorini-area-id',
    name: 'Santorini',
    slug: 'santorini',
    description: 'Volcanic island with unique beaches and stunning sunsets',
    hero_photo_url: null,
    hero_photo_source: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'ACTIVE'
  },
  {
    id: 'rhodes-area-id',
    name: 'Rhodes',
    slug: 'rhodes',
    description: 'Historic island with medieval architecture and beautiful beaches',
    hero_photo_url: null,
    hero_photo_source: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'ACTIVE'
  },
  {
    id: 'kefalonia-area-id',
    name: 'Kefalonia',
    slug: 'kefalonia',
    description: 'Largest Ionian island with dramatic landscapes',
    hero_photo_url: null,
    hero_photo_source: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'ACTIVE'
  },
  {
    id: 'zakynthos-area-id',
    name: 'Zakynthos',
    slug: 'zakynthos',
    description: 'Known for its stunning beaches and sea turtle sanctuary',
    hero_photo_url: null,
    hero_photo_source: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status: 'ACTIVE'
  }
];

/**
 * Mock search contexts for different scenarios
 */
export const mockSearchContexts: Record<string, SearchContext> = {
  familyVacation: {
    userPreferences: ['family-friendly', 'calm waters', 'lifeguard'],
    timeOfDay: 'morning',
    season: 'summer',
    location: 'crete',
    searchHistory: ['family beaches', 'safe swimming']
  },
  
  romanticGetaway: {
    userPreferences: ['quiet', 'scenic', 'photography'],
    timeOfDay: 'evening',
    season: 'spring',
    location: 'santorini',
    searchHistory: ['sunset beaches', 'romantic spots']
  },
  
  partyScene: {
    userPreferences: ['beach bars', 'music', 'crowds'],
    timeOfDay: 'afternoon',
    season: 'summer',
    location: 'mykonos',
    searchHistory: ['party beaches', 'beach clubs']
  },
  
  adventureSeeker: {
    userPreferences: ['snorkeling', 'water sports', 'hiking'],
    timeOfDay: 'morning',
    season: 'summer',
    location: 'rhodes',
    searchHistory: ['adventure activities', 'water sports']
  },
  
  budgetTraveler: {
    userPreferences: ['free parking', 'unorganized', 'local tavernas'],
    timeOfDay: 'morning',
    season: 'autumn',
    location: 'kefalonia',
    searchHistory: ['budget beaches', 'free activities']
  }
};

/**
 * Mock filter states for different scenarios
 */
export const mockFilterStates: Record<string, FilterState> = {
  empty: {
    search: '',
    location: undefined,
    locations: undefined,
    organized: [],
    blueFlag: false,
    parking: [],
    amenities: [],
    waveConditions: [],
    type: [],
    sort: 'name.asc',
    page: 1,
    nearMe: false
  },
  
  sandyBeaches: {
    search: '',
    location: 'crete',
    locations: undefined,
    organized: [],
    blueFlag: false,
    parking: [],
    amenities: [],
    waveConditions: [],
    type: ['SANDY'],
    sort: 'name.asc',
    page: 1,
    nearMe: false
  },
  
  familyFriendly: {
    search: '',
    location: undefined,
    locations: undefined,
    organized: ['organized'],
    blueFlag: true,
    parking: ['LARGE_LOT'],
    amenities: ['lifeguard', 'family_friendly'],
    waveConditions: ['CALM'],
    type: ['SANDY'],
    sort: 'name.asc',
    page: 1,
    nearMe: false
  },
  
  partyBeaches: {
    search: '',
    location: 'mykonos',
    locations: undefined,
    organized: ['organized'],
    blueFlag: false,
    parking: ['LARGE_LOT', 'SMALL_LOT'],
    amenities: ['beach_bar', 'music'],
    waveConditions: ['MODERATE'],
    type: ['SANDY'],
    sort: 'name.asc',
    page: 1,
    nearMe: false
  },
  
  adventureBeaches: {
    search: '',
    location: undefined,
    locations: undefined,
    organized: [],
    blueFlag: false,
    parking: ['ROADSIDE', 'SMALL_LOT'],
    amenities: ['snorkeling', 'water_sports'],
    waveConditions: ['MODERATE', 'WAVY'],
    type: ['PEBBLY', 'MIXED'],
    sort: 'name.asc',
    page: 1,
    nearMe: false
  }
};

/**
 * Common test scenarios
 */
export const testScenarios = {
  /**
   * Basic location queries
   */
  basicLocation: [
    'beaches in crete',
    'mykonos beaches',
    'santorini beach',
    'rhodes beaches',
    'kefalonia beach'
  ],
  
  /**
   * Beach type queries
   */
  beachTypes: [
    'sandy beaches',
    'pebble beaches',
    'rocky beaches',
    'mixed sand beaches'
  ],
  
  /**
   * Amenity queries
   */
  amenities: [
    'beaches with sunbeds',
    'beaches with lifeguards',
    'beaches with parking',
    'beaches with restaurants',
    'beaches with showers'
  ],
  
  /**
   * Wave condition queries
   */
  waveConditions: [
    'calm water beaches',
    'good surfing beaches',
    'shallow water beaches',
    'rough water beaches'
  ],
  
  /**
   * Complex queries
   */
  complex: [
    'family friendly sandy beaches with lifeguards in crete',
    'quiet pebble beaches with tavernas in santorini',
    'party beaches with bars and music in mykonos',
    'organized beaches with blue flag and parking'
  ],
  
  /**
   * Question format queries
   */
  questions: [
    'what are the best beaches in crete?',
    'where can i find calm beaches?',
    'which beaches have parking?',
    'what beaches are good for families?'
  ],
  
  /**
   * Misspelling queries
   */
  misspellings: [
    'sany beachs in corfu',
    'mykonis beachs with resturant',
    'clam water famly beach',
    'peble beachs with lifegaurd',
    'santoriny beachs with sunbed'
  ]
};

/**
 * Expected results for common queries
 */
export const expectedResults = {
  'beaches in crete': {
    location: 'crete',
    filters: {}
  },
  
  'sandy beaches': {
    filters: { type: ['SANDY'] }
  },
  
  'beaches with lifeguards': {
    filters: { amenities: ['lifeguard'] }
  },
  
  'calm water beaches': {
    filters: { waveConditions: ['CALM'] }
  },
  
  'family friendly beaches': {
    filters: { amenities: ['family_friendly'] }
  },
  
  'organized beaches': {
    filters: { organized: ['organized'] }
  },
  
  'blue flag beaches': {
    filters: { blueFlag: true }
  },
  
  'beaches with parking': {
    filters: { parking: ['LARGE_LOT', 'SMALL_LOT', 'ROADSIDE'] }
  }
};

/**
 * Performance benchmarks
 */
export const performanceBenchmarks = {
  simpleQuery: 50, // ms
  complexQuery: 100, // ms
  multiLocationQuery: 150, // ms
  misspellingQuery: 120, // ms
  questionQuery: 80, // ms
  emptyQuery: 10, // ms
  veryLongQuery: 200 // ms
};

/**
 * Confidence thresholds
 */
export const confidenceThresholds = {
  high: 0.8,
  medium: 0.6,
  low: 0.4,
  minimum: 0.3
};

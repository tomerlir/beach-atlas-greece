import { BeachCsvRow } from '@/utils/csv/beachCsvSchema';

// Minimal verified dataset to exercise strict filtering semantics
export const VERIFIED_BEACHES: Array<Partial<BeachCsvRow> & { id: string }> = [
  {
    id: 'sandy-calm-organized-blueflag-largelot-bar-sunbeds',
    slug: 'alpha',
    name: 'Alpha Beach',
    area: 'Crete',
    type: 'SANDY',
    wave_conditions: 'CALM',
    organized: true,
    parking: 'LARGE_LOT',
    blue_flag: true,
    amenities: ['beach_bar', 'sunbeds', 'umbrellas', 'showers', 'toilets']
  },
  {
    id: 'pebbly-wavy-unorganized-roadside-no-blue-amenities',
    slug: 'beta',
    name: 'Beta Beach',
    area: 'Rhodes',
    type: 'PEBBLY',
    wave_conditions: 'WAVY',
    organized: false,
    parking: 'ROADSIDE',
    blue_flag: false,
    amenities: []
  },
  {
    id: 'sandy-moderate-organized-smalllot-no-blue-food',
    slug: 'gamma',
    name: 'Gamma Beach',
    area: 'Paros',
    type: 'SANDY',
    wave_conditions: 'MODERATE',
    organized: true,
    parking: 'SMALL_LOT',
    blue_flag: false,
    amenities: ['food']
  },
  {
    id: 'mixed-calm-unorganized-none-blueflag-lifeguard',
    slug: 'delta',
    name: 'Delta Beach',
    area: 'Naxos',
    type: 'MIXED',
    wave_conditions: 'CALM',
    organized: false,
    parking: 'NONE',
    blue_flag: true,
    amenities: ['lifeguard']
  },
  {
    id: 'sandy-calm-organized-roadside-no-blue-taverna',
    slug: 'epsilon',
    name: 'Epsilon Beach',
    area: 'Crete',
    type: 'SANDY',
    wave_conditions: 'CALM',
    organized: true,
    parking: 'ROADSIDE',
    blue_flag: false,
    amenities: ['taverna', 'sunbeds']
  }
];



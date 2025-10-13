import { describe, it, expect } from 'vitest';
import { buildExplanation } from '@/lib/explanations/explanationEngine';
import type { FilterState } from '@/hooks/useUrlState';

const baseFilters = (): FilterState => ({
  search: '',
  originalQuery: undefined,
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
  nearMe: false,
});

describe('explanation engine', () => {
  it('no filters and results > 0 → "showing all available beaches"', () => {
    const exp = buildExplanation({ filters: baseFilters(), resultCount: 5, userLocation: null });
    expect(exp.primary.join(', ')).toContain('showing all available beaches');
    expect(exp.secondaryCount).toBe(0);
  });

  it('no filters and results = 0 → "no beaches found"', () => {
    const exp = buildExplanation({ filters: baseFilters(), resultCount: 0, userLocation: null });
    expect(exp.primary.join(', ')).toContain('no beaches found');
  });

  it('location search only', () => {
    const f = baseFilters();
    f.search = 'naxos agios prokopios';
    const exp = buildExplanation({ filters: f, resultCount: 12, userLocation: null });
    expect(exp.primary[0]).toMatch(/^in /);
    expect(exp.fullText).toContain('in ');
  });

  it('multiple extracted locations are capitalized and Oxford-comma formatted', () => {
    const f = baseFilters();
    f.locations = ['agios prokopios', 'agia anna', 'plaka'];
    const exp = buildExplanation({ filters: f, resultCount: 9, userLocation: null });
    expect(exp.fullText).toMatch(/in Agios Prokopios, Agia Anna, and Plaka/);
  });

  it('type + blue flag + waves → primary capped at 3', () => {
    const f = baseFilters();
    f.type = ['SANDY'];
    f.blueFlag = true;
    f.waveConditions = ['CALM'];
    const exp = buildExplanation({ filters: f, resultCount: 7, userLocation: null });
    expect(exp.primary.length).toBeLessThanOrEqual(3);
    expect(exp.fullText.length).toBeGreaterThan(0);
  });

  it('amenities grouped phrasing', () => {
    const f = baseFilters();
    f.amenities = ['toilets', 'showers', 'beach_bar', 'sunbeds', 'snorkeling'];
    const exp = buildExplanation({ filters: f, resultCount: 3, userLocation: null });
    expect(exp.fullText).toMatch(/with .* (toilets|showers)/i);
    expect(exp.fullText).toMatch(/offering .* (Beach Bar|Sunbeds)/i);
    expect(exp.fullText.toLowerCase()).toContain('perfect for snorkeling');
  });

  it('parking NONE special case', () => {
    const f = baseFilters();
    f.parking = ['NONE'];
    const exp = buildExplanation({ filters: f, resultCount: 2, userLocation: null });
    expect(exp.fullText).toContain('no parking available');
  });
});



import type { FilterState } from '@/hooks/useUrlState';
import { analytics } from '@/lib/analytics';
import {
  FacetKey,
  getAmenitiesPart,
  getBlueFlagPart,
  getLocationPart,
  getOrganizationPart,
  getParkingPart,
  getTypePart,
  getWavesPart,
} from './phrasing';

export type ExplanationInput = {
  filters: FilterState;
  resultCount: number;
  userLocation: GeolocationPosition | null;
};

export type ReasonPart = {
  id: string;
  text: string;
  facet: FacetKey;
  weight: number;
  trace: { source: 'filter' | 'derived'; keys: string[] };
};

export type Explanation = {
  reasonParts: ReasonPart[];
  primary: string[];
  secondaryCount: number;
  fullText: string;
};

const PRIORITY: FacetKey[] = [
  'location',
  'type',
  'blue_flag',
  'waves',
  'amenities',
  'parking',
  'organization',
  'other',
];

function toSentence(parts: string[]): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
}

export function buildExplanation(input: ExplanationInput): Explanation {
  const { filters, resultCount, userLocation } = input;

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.location ||
    (filters.locations && filters.locations.length > 0) ||
    (filters.organized && filters.organized.length > 0) ||
    filters.blueFlag ||
    (filters.parking && filters.parking.length > 0) ||
    (filters.amenities && filters.amenities.length > 0) ||
    (filters.waveConditions && filters.waveConditions.length > 0) ||
    (filters.type && filters.type.length > 0)
  );

  const base: ReasonPart[] = [];

  if (!hasActiveFilters && resultCount > 0) {
    base.push({ id: 'all', text: 'showing all available beaches', facet: 'other', weight: 0, trace: { source: 'derived', keys: [] } });
  }
  if (!hasActiveFilters && resultCount === 0) {
    base.push({ id: 'none', text: 'no beaches found', facet: 'other', weight: 0, trace: { source: 'derived', keys: [] } });
  }

  const loc = getLocationPart(filters, userLocation);
  if (loc) base.push({ id: 'location', text: loc, facet: 'location', weight: 100, trace: { source: 'filter', keys: ['search', 'nearMe'] } });

  const type = getTypePart(filters);
  if (type) base.push({ id: 'type', text: type, facet: 'type', weight: 90, trace: { source: 'filter', keys: ['type'] } });

  const blue = getBlueFlagPart(filters);
  if (blue) base.push({ id: 'blue_flag', text: blue, facet: 'blue_flag', weight: 80, trace: { source: 'filter', keys: ['blueFlag'] } });

  const waves = getWavesPart(filters);
  if (waves) base.push({ id: 'waves', text: waves, facet: 'waves', weight: 70, trace: { source: 'filter', keys: ['waveConditions'] } });

  const amenities = getAmenitiesPart(filters);
  amenities.forEach((text, idx) =>
    base.push({ id: `amenities_${idx}`, text, facet: 'amenities', weight: 60 - idx, trace: { source: 'filter', keys: ['amenities'] } })
  );

  const parking = getParkingPart(filters);
  if (parking) base.push({ id: 'parking', text: parking, facet: 'parking', weight: 50, trace: { source: 'filter', keys: ['parking'] } });

  const org = getOrganizationPart(filters);
  if (org) base.push({ id: 'organization', text: org, facet: 'organization', weight: 40, trace: { source: 'filter', keys: ['organized'] } });

  // Sort deterministically by facet priority then weight then text
  base.sort((a, b) => {
    const pa = PRIORITY.indexOf(a.facet);
    const pb = PRIORITY.indexOf(b.facet);
    if (pa !== pb) return pa - pb;
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.text.localeCompare(b.text);
  });

  // Select primary (up to 3)
  const primary: string[] = [];
  for (const part of base) {
    if (primary.length >= 3) break;
    // Prefer at most one amenities part in primary (keep variety)
    if (part.facet === 'amenities' && primary.some(p => p.startsWith('with ') || p.startsWith('offering ') || p.startsWith('perfect for '))) {
      continue;
    }
    primary.push(part.text);
  }

  const secondaryCount = Math.max(0, base.length - primary.length);
  const fullText = toSentence(base.map(p => p.text));

  // Fire lightweight analytics (safe in browser only)
  analytics.event('results_explanation_composed', {
    partsCount: base.length,
    primaryCount: primary.length,
    facetsIncluded: Array.from(new Set(base.map(p => p.facet))).join(','),
  });

  return { reasonParts: base, primary, secondaryCount, fullText };
}



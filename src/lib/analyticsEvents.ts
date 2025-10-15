/**
 * Analytics Event Types and Schemas
 * 
 * This file defines the TypeScript types for all analytics events to ensure
 * consistency and prevent drift in event payloads.
 */

export type AnalyticsProps = Record<string, unknown>;

// Base event payloads
export interface PageViewEvent {
  path: string;
  referrer?: string;
}

export interface SearchSubmitEvent {
  q: string;
  q_len: number;
  chips_count: number;
  has_place: boolean;
  context: 'homepage' | 'area';
  extracted: {
    type: string[];
    wave_conditions: string[];
    parking: string[];
    amenities: string[];
    blue_flag: boolean;
    place: string | null;
    cleaned_term: string;
  };
}

export interface ResultsViewEvent {
  count: number;
  relaxed: boolean;
}

export interface FilterApplyEvent {
  name: string;
  value: string;
  results: number;
}

export interface FilterClearEvent {
  name: string;
}

export interface MapOpenEvent {
  entry: 'home' | 'area' | 'nav';
}

export interface MapInteractEvent {
  action: 'pan' | 'zoom';
}

export interface MapPinOpenEvent {
  beach_id: string;
}

export interface BeachViewEvent {
  beach_id: string;
}

export interface StartDirectionsEvent {
  beach_id: string;
  from: 'card' | 'detail' | 'map';
}

export interface ShareBeachEvent {
  beach_id: string;
  method: 'webshare' | 'copy' | 'dialog';
}

export interface CBMEvent {
  beach_id: string;
  method: 'directions' | 'share';
}

export interface NotFoundEvent {
  path: string;
}

// Event name constants for type safety
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  SEARCH_SUBMIT: 'search_submit',
  RESULTS_VIEW: 'results_view',
  FILTER_APPLY: 'filter_apply',
  FILTER_CLEAR: 'filter_clear',
  MAP_OPEN: 'map_open',
  MAP_INTERACT: 'map_interact',
  MAP_PIN_OPEN: 'map_pin_open',
  BEACH_VIEW: 'beach_view',
  START_DIRECTIONS: 'start_directions',
  SHARE_BEACH: 'share_beach',
  CBM: 'cbm',
  NOT_FOUND: '404',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// Helper functions to create properly typed events
export const createPageViewEvent = (path: string, referrer?: string): PageViewEvent => ({
  path,
  referrer,
});

export const createSearchSubmitEvent = (
  q: string,
  extracted: SearchSubmitEvent['extracted'],
  context: SearchSubmitEvent['context']
): SearchSubmitEvent => ({
  q,
  q_len: q.length,
  chips_count: Object.values(extracted).filter(v => Array.isArray(v) ? v.length > 0 : v).length,
  has_place: !!extracted.place,
  context,
  extracted,
});

export const createResultsViewEvent = (count: number, relaxed: boolean): ResultsViewEvent => ({
  count,
  relaxed,
});

export const createFilterApplyEvent = (name: string, value: string, results: number): FilterApplyEvent => ({
  name,
  value,
  results,
});

export const createFilterClearEvent = (name: string): FilterClearEvent => ({
  name,
});

export const createMapOpenEvent = (entry: MapOpenEvent['entry']): MapOpenEvent => ({
  entry,
});

export const createMapInteractEvent = (action: MapInteractEvent['action']): MapInteractEvent => ({
  action,
});

export const createMapPinOpenEvent = (beach_id: string): MapPinOpenEvent => ({
  beach_id,
});

export const createBeachViewEvent = (beach_id: string): BeachViewEvent => ({
  beach_id,
});

export const createStartDirectionsEvent = (beach_id: string, from: StartDirectionsEvent['from']): StartDirectionsEvent => ({
  beach_id,
  from,
});

export const createShareBeachEvent = (beach_id: string, method: ShareBeachEvent['method']): ShareBeachEvent => ({
  beach_id,
  method,
});

export const createCBMEvent = (beach_id: string, method: CBMEvent['method']): CBMEvent => ({
  beach_id,
  method,
});

export const createNotFoundEvent = (path: string): NotFoundEvent => ({
  path,
});

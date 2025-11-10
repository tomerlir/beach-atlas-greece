/**
 * Analytics Event Types and Schemas
 *
 * This file defines the TypeScript types for all analytics events to ensure
 * consistency and prevent drift in event payloads.
 */

export type AnalyticsProps = Record<string, unknown>;

// Umami global interface for type safety
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
      enable?: () => void;
      disable?: () => void;
    };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Import common types from centralized location
export type FilterName =
  | "blue_flag"
  | "near_me"
  | "organized"
  | "beach_type"
  | "wave_conditions"
  | "parking"
  | "amenities"
  | "type"
  | "wave"
  | "all";

// Base event payloads
export interface PageViewEvent extends AnalyticsProps {
  page_path: string;
  referrer?: string;
  previous_path?: string;
}

export interface SearchSubmitEvent extends AnalyticsProps {
  q: string;
  q_len: number;
  chips_count: number;
  has_place: boolean;
  context: "homepage" | "area";
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

export interface ResultsViewEvent extends AnalyticsProps {
  count: number;
  relaxed: boolean;
  query_hash?: string;
}

export interface FilterApplyEvent extends AnalyticsProps {
  name: FilterName;
  value: string;
  results: number;
}

export interface FilterClearEvent extends AnalyticsProps {
  name: FilterName;
}

export interface MapOpenEvent extends AnalyticsProps {
  entry: "home" | "area" | "nav";
}

export interface MapEngagementEvent extends AnalyticsProps {
  duration_ms: number;
  total_interactions: number;
  unique_beaches_viewed: number;
  exploration_intensity: "low" | "medium" | "high";
}

export interface BeachEngagementEvent extends AnalyticsProps {
  beach_id: string;
  source: "search" | "map" | "browsing" | "area_explore";
  query_hash?: string;
  page_path?: string;
}

export interface BeachConversionEvent extends AnalyticsProps {
  beach_id: string;
  action: "directions" | "share" | "save";
  source: "detail" | "card" | "map";
}

export interface SearchQualityEvent extends AnalyticsProps {
  query_hash: string;
  outcome: "success" | "empty" | "relaxed" | "abandoned";
  first_engagement_beach_id?: string;
  time_to_engagement_ms?: number;
}

export interface SessionSummaryEvent extends AnalyticsProps {
  searches_count: number;
  beaches_engaged: number;
  conversions_count: number;
  session_duration_ms: number;
  outcome: "converted" | "browsed" | "bounced";
}

export interface NotFoundEvent extends AnalyticsProps {
  page_path: string;
}

// Event name constants for type safety
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  SEARCH_SUBMIT: "search_submit",
  RESULTS_VIEW: "results_view",
  SEARCH_QUALITY: "search_quality",
  BEACH_ENGAGEMENT: "beach_engagement",
  BEACH_CONVERSION: "beach_conversion",
  SESSION_SUMMARY: "session_summary",
  FILTER_APPLY: "filter_apply",
  FILTER_CLEAR: "filter_clear",
  MAP_OPEN: "map_open",
  MAP_ENGAGEMENT: "map_engagement",
  NOT_FOUND: "404",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// Helper functions to create properly typed events
export const createPageViewEvent = (
  page_path: string,
  referrer?: string,
  previous_path?: string
): PageViewEvent => ({
  page_path,
  referrer,
  previous_path,
});

export const createSearchSubmitEvent = (
  q: string,
  extracted: SearchSubmitEvent["extracted"],
  context: SearchSubmitEvent["context"]
): SearchSubmitEvent => ({
  q,
  q_len: q.length,
  chips_count: Object.values(extracted).filter((v) => (Array.isArray(v) ? v.length > 0 : v)).length,
  has_place: !!extracted.place,
  context,
  extracted,
});

export const createResultsViewEvent = (
  count: number,
  relaxed: boolean,
  query_hash?: string
): ResultsViewEvent => {
  const event: ResultsViewEvent = {
    count,
    relaxed,
  };

  // Only include query_hash if it exists
  if (query_hash) {
    event.query_hash = query_hash;
  }

  return event;
};

export const createFilterApplyEvent = (
  name: FilterName,
  value: string,
  results: number
): FilterApplyEvent => ({
  name,
  value,
  results,
});

export const createFilterClearEvent = (name: FilterName): FilterClearEvent => ({
  name,
});

export const createMapOpenEvent = (entry: MapOpenEvent["entry"]): MapOpenEvent => ({
  entry,
});

export const createMapEngagementEvent = (
  duration_ms: number,
  total_interactions: number,
  unique_beaches_viewed: number,
  exploration_intensity: MapEngagementEvent["exploration_intensity"]
): MapEngagementEvent => ({
  duration_ms,
  total_interactions,
  unique_beaches_viewed,
  exploration_intensity,
});

export const createBeachEngagementEvent = (
  beach_id: string,
  source: BeachEngagementEvent["source"],
  query_hash?: string,
  page_path?: string
): BeachEngagementEvent => ({
  beach_id,
  source,
  query_hash,
  page_path,
});

export const createBeachConversionEvent = (
  beach_id: string,
  action: BeachConversionEvent["action"],
  source: BeachConversionEvent["source"]
): BeachConversionEvent => ({
  beach_id,
  action,
  source,
});

export const createSearchQualityEvent = (
  query_hash: string,
  outcome: SearchQualityEvent["outcome"],
  first_engagement_beach_id?: string,
  time_to_engagement_ms?: number
): SearchQualityEvent => ({
  query_hash,
  outcome,
  first_engagement_beach_id,
  time_to_engagement_ms,
});

export const createSessionSummaryEvent = (
  searches_count: number,
  beaches_engaged: number,
  conversions_count: number,
  session_duration_ms: number,
  outcome: SessionSummaryEvent["outcome"]
): SessionSummaryEvent => ({
  searches_count,
  beaches_engaged,
  conversions_count,
  session_duration_ms,
  outcome,
});

export const createNotFoundEvent = (page_path: string): NotFoundEvent => ({
  page_path,
});

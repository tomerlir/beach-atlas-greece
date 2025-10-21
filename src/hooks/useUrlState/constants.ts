import { BaseFilterState } from "./types";

/**
 * Default values for base filter state
 */
export const DEFAULT_BASE_FILTERS: BaseFilterState = {
  search: "",
  originalQuery: undefined,
  organized: [],
  blueFlag: false,
  parking: [],
  amenities: [],
  waveConditions: [],
  type: [],
  sort: "name.asc",
  page: 1,
  nearMe: false,
};

/**
 * Valid sort options
 */
export const VALID_SORT_OPTIONS = [
  "name.asc",
  "name.desc",
  "distance.asc",
  "distance.desc",
] as const;

/**
 * URL parameter keys
 */
export const URL_KEYS = {
  SEARCH: "search",
  ORIGINAL_QUERY: "originalQuery",
  LOCATION: "location",
  LOCATIONS: "locations",
  AREA: "area",
  ORGANIZED: "organized",
  BLUE_FLAG: "blueFlag",
  PARKING: "parking",
  AMENITIES: "amenities",
  WAVE_CONDITIONS: "waveConditions",
  TYPE: "type",
  SORT: "sort",
  PAGE: "page",
  NEAR_ME: "nearMe",
} as const;

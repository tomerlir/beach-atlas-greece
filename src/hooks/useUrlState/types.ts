import { WaveCondition, BeachType } from "@/types/common";

// Base filter state (shared fields)
export interface BaseFilterState {
  search: string;
  originalQuery?: string;
  organized: string[];
  blueFlag: boolean;
  parking: string[];
  amenities: string[];
  waveConditions: WaveCondition[];
  type: BeachType[];
  sort: string | null;
  page: number;
  nearMe: boolean;
}

// Global filter state (with location fields)
export interface FilterState extends BaseFilterState {
  location?: string;
  locations?: string[];
}

// Area-specific filter state (with locked area)
export interface AreaFilterState extends BaseFilterState {
  area: string;
}

// Union type for type safety
export type UnifiedFilterState = FilterState | AreaFilterState;

// Type guards for runtime discrimination
export function isAreaFilterState(filters: UnifiedFilterState): filters is AreaFilterState {
  return "area" in filters && filters.area !== undefined;
}

export function isGlobalFilterState(filters: UnifiedFilterState): filters is FilterState {
  return !isAreaFilterState(filters);
}

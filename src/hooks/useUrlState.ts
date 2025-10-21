import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterState, AreaFilterState, UnifiedFilterState } from "./useUrlState/types";
import {
  parseStringParam,
  parseArrayParam,
  parseBooleanParam,
  parseIntParam,
  parseWaveConditions,
  parseBeachTypes,
  parseSortParam,
} from "./useUrlState/parsers";
import { createURLParamsBuilder } from "./useUrlState/updaters";
import { DEFAULT_BASE_FILTERS, URL_KEYS } from "./useUrlState/constants";

// Re-export types for backward compatibility
export type { FilterState, AreaFilterState, UnifiedFilterState };

const defaultFilters: FilterState = {
  ...DEFAULT_BASE_FILTERS,
  location: undefined,
  locations: undefined,
};

// Function overloads for type safety
export function useUrlState(): {
  filters: FilterState;
  updateFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
};

export function useUrlState(areaName: string): {
  filters: AreaFilterState;
  updateFilters: (updates: Partial<Omit<AreaFilterState, "area">>) => void;
  resetFilters: () => void;
};

export function useUrlState(areaName?: string) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    if (areaName) {
      // Area-specific state
      const state: AreaFilterState = {
        ...DEFAULT_BASE_FILTERS,
        area: areaName,
      };

      // Parse all parameters using utility functions
      state.search = parseStringParam(searchParams, URL_KEYS.SEARCH) || "";
      state.originalQuery = parseStringParam(searchParams, URL_KEYS.ORIGINAL_QUERY);
      state.organized = parseArrayParam(searchParams, URL_KEYS.ORGANIZED);
      state.blueFlag = parseBooleanParam(searchParams, URL_KEYS.BLUE_FLAG);
      state.parking = parseArrayParam(searchParams, URL_KEYS.PARKING);
      state.amenities = parseArrayParam(searchParams, URL_KEYS.AMENITIES);
      state.waveConditions = parseWaveConditions(searchParams);
      state.type = parseBeachTypes(searchParams);
      state.sort = parseSortParam(searchParams);
      state.nearMe = parseBooleanParam(searchParams, URL_KEYS.NEAR_ME);
      state.page = parseIntParam(searchParams, URL_KEYS.PAGE, 1);

      return state;
    } else {
      // Global state
      const state: FilterState = { ...defaultFilters };

      // Parse all parameters using utility functions
      state.search = parseStringParam(searchParams, URL_KEYS.SEARCH) || "";
      state.originalQuery = parseStringParam(searchParams, URL_KEYS.ORIGINAL_QUERY);
      state.location = parseStringParam(searchParams, URL_KEYS.LOCATION);
      state.locations = parseArrayParam(searchParams, URL_KEYS.LOCATIONS);
      state.organized = parseArrayParam(searchParams, URL_KEYS.ORGANIZED);
      state.blueFlag = parseBooleanParam(searchParams, URL_KEYS.BLUE_FLAG);
      state.parking = parseArrayParam(searchParams, URL_KEYS.PARKING);
      state.amenities = parseArrayParam(searchParams, URL_KEYS.AMENITIES);
      state.waveConditions = parseWaveConditions(searchParams);
      state.type = parseBeachTypes(searchParams);
      state.sort = parseSortParam(searchParams);
      state.nearMe = parseBooleanParam(searchParams, URL_KEYS.NEAR_ME);
      state.page = parseIntParam(searchParams, URL_KEYS.PAGE, 1);

      return state;
    }
  }, [searchParams, areaName]);

  const updateFilters = useCallback(
    (updates: Partial<FilterState> | Partial<Omit<AreaFilterState, "area">>) => {
      setSearchParams((prev) => {
        const builder = createURLParamsBuilder(prev);

        // Update all parameters using builder pattern
        if (updates.search !== undefined) {
          builder.setString(URL_KEYS.SEARCH, updates.search);
        }
        if (updates.originalQuery !== undefined) {
          builder.setString(URL_KEYS.ORIGINAL_QUERY, updates.originalQuery);
        }

        // Only update location fields for global state
        if (!areaName) {
          const globalUpdates = updates as Partial<FilterState>;
          if (globalUpdates.location !== undefined) {
            builder.setString(URL_KEYS.LOCATION, globalUpdates.location);
          }
          if (globalUpdates.locations !== undefined) {
            builder.setArray(URL_KEYS.LOCATIONS, globalUpdates.locations);
          }
        }

        if (updates.organized !== undefined) {
          builder.setArray(URL_KEYS.ORGANIZED, updates.organized);
        }
        if (updates.blueFlag !== undefined) {
          builder.setBoolean(URL_KEYS.BLUE_FLAG, updates.blueFlag);
        }
        if (updates.parking !== undefined) {
          builder.setArray(URL_KEYS.PARKING, updates.parking);
        }
        if (updates.amenities !== undefined) {
          builder.setArray(URL_KEYS.AMENITIES, updates.amenities);
        }
        if (updates.waveConditions !== undefined) {
          builder.setArray(URL_KEYS.WAVE_CONDITIONS, updates.waveConditions);
        }
        if (updates.type !== undefined) {
          builder.setArray(URL_KEYS.TYPE, updates.type);
        }
        if (updates.sort !== undefined) {
          builder.setSort(URL_KEYS.SORT, updates.sort, defaultFilters.sort || "name.asc");
        }
        if (updates.nearMe !== undefined) {
          builder.setBoolean(URL_KEYS.NEAR_ME, updates.nearMe);
        }
        if (updates.page !== undefined) {
          builder.setInteger(URL_KEYS.PAGE, updates.page);
        }

        return builder.build();
      });
    },
    [setSearchParams, areaName]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}

import { useState, useCallback, useEffect } from 'react';
import { FilterState } from './useUrlState';

export const useDraftState = (initialFilters: FilterState) => {
  const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilters);

  // Update draft when initial filters change
  useEffect(() => {
    setDraftFilters(initialFilters);
  }, [initialFilters]);

  const updateDraft = useCallback((updates: Partial<FilterState>) => {
    setDraftFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftFilters(initialFilters);
  }, [initialFilters]);

  const clearDraft = useCallback(() => {
    setDraftFilters({
      search: initialFilters.search, // Keep search term
      type: [],
      organized: [],
      blueFlag: false,
      parking: [],
      amenities: [],
      waveConditions: [],
      sort: initialFilters.sort,
      page: 1,
      nearMe: false,
    });
  }, [initialFilters]);

  return {
    draftFilters,
    updateDraft,
    resetDraft,
    clearDraft,
  };
};

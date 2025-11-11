/**
 * Custom hook to handle search submission logic
 * Includes NLQ extraction, analytics tracking, and filter application
 */

import { useCallback } from "react";
import { FilterState } from "@/hooks/useUrlState";
import { analytics } from "@/lib/analytics";
import { createSearchSubmitEvent } from "@/lib/analyticsEvents";
import {
  extractFromNaturalLanguage,
  applyExtractedFilters,
  applyExtractedFiltersForArea,
  doesPlaceMatchArea,
} from "@/lib/naturalLanguageSearch";
import { createEmptyFilters } from "../utils";

const isBrowser = typeof window !== "undefined";

interface UseSearchSubmitProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onClearAll?: () => void;
  onNaturalLanguageSearch?: (wasUsed: boolean) => void;
  onPlaceMismatch?: (place: string, areaName: string) => void;
  areaName?: string;
}

interface UseSearchSubmitReturn {
  handleSearchSubmit: (searchInput: string) => Promise<void>;
}

/**
 * Handles search submission with NLQ extraction and analytics
 * @param props - Configuration and callbacks
 * @returns Object with handleSearchSubmit function
 */
export function useSearchSubmit({
  filters,
  onFiltersChange,
  onClearAll,
  onNaturalLanguageSearch,
  onPlaceMismatch,
  areaName,
}: UseSearchSubmitProps): UseSearchSubmitReturn {
  const handleSearchSubmit = useCallback(
    async (searchInput: string) => {
      const trimmedInput = searchInput.trim();

      // If input is empty, clear all filters
      if (trimmedInput === "") {
        if (onClearAll) {
          onClearAll();
        } else {
          onFiltersChange(createEmptyFilters());
        }
        onNaturalLanguageSearch?.(false);
        return;
      }

      // Early return if search hasn't changed
      if (trimmedInput === filters.search && !filters.originalQuery) {
        return;
      }

      try {
        // ALWAYS extract filters from the query
        // The extraction logic is smart enough to handle both:
        // - Natural language queries (extracts filters)
        // - Simple searches (returns empty filters, just location/name)
        const extracted = await extractFromNaturalLanguage(trimmedInput);

        // Determine if this was actually a natural language query (had filters extracted)
        const hasExtractedFilters = Object.keys(extracted.filters).length > 0;

        // Notify parent whether NL extraction found anything
        onNaturalLanguageSearch?.(hasExtractedFilters);

        if (areaName) {
          // Area page context
          const newFilters = applyExtractedFiltersForArea(filters, extracted);
          // Store BOTH the cleaned search term AND the original query
          onFiltersChange({
            ...newFilters,
            originalQuery: trimmedInput, // Always preserve user's exact input
          });

          // Check for place mismatch
          if (
            extracted.place &&
            !doesPlaceMatchArea(extracted.place, areaName) &&
            onPlaceMismatch
          ) {
            onPlaceMismatch(extracted.place, areaName);
          }
        } else {
          // Homepage context
          const newFilters = applyExtractedFilters(filters, extracted);
          // Store BOTH the cleaned search term AND the original query
          onFiltersChange({
            ...newFilters,
            originalQuery: trimmedInput, // Always preserve user's exact input
          });
        }

        // Generate query hash for linking search → results → engagement
        const queryHash = analytics.generateQueryHash(trimmedInput, extracted.filters);

        // Store query hash in sessionStorage for linking to beach engagements
        if (isBrowser) {
          sessionStorage.setItem("current_query_hash", queryHash);
        }

        // Track analytics with detailed info
        const searchEvent = createSearchSubmitEvent(
          trimmedInput,
          {
            type: extracted.filters.type || [],
            wave_conditions: extracted.filters.waveConditions || [],
            parking: extracted.filters.parking || [],
            amenities: extracted.filters.amenities || [],
            blue_flag: extracted.filters.blueFlag || false,
            place: extracted.place || null,
            cleaned_term: extracted.cleanedSearchTerm,
          },
          areaName ? "area" : "homepage"
        );

        analytics.event("search_submit", searchEvent);

        // Track search for session management and quality tracking
        analytics.trackSearch(queryHash);
      } catch (error) {
        console.error("Search extraction failed:", error);
        // Fallback to basic search
        onFiltersChange({
          search: trimmedInput,
          originalQuery: trimmedInput,
          page: 1,
        });
      }
    },
    [filters, onFiltersChange, onClearAll, onNaturalLanguageSearch, onPlaceMismatch, areaName]
  );

  return { handleSearchSubmit };
}

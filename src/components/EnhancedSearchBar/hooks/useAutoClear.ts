/**
 * Custom hook to handle auto-clear behavior
 * When user manually empties search, clear all filters automatically
 * Refactored to avoid the isClearing flag by using useEffect properly
 */

import { useEffect, useRef } from "react";
import { FilterState } from "@/hooks/useUrlState";
import { hasActiveFilters } from "../utils";

interface UseAutoClearProps {
  searchInput: string;
  previousValue: string;
  filters: FilterState;
  onClearAll?: () => void;
  onNaturalLanguageSearch?: (wasUsed: boolean) => void;
}

/**
 * Automatically clears all filters when user manually empties the search input
 * Prevents infinite loops by tracking whether the clear was user-initiated
 * @param props - Search input state and callbacks
 */
export function useAutoClear({
  searchInput,
  previousValue,
  filters,
  onClearAll,
  onNaturalLanguageSearch,
}: UseAutoClearProps): void {
  const userInitiatedClearRef = useRef(false);

  // Track when user manually clears (non-empty -> empty)
  useEffect(() => {
    const wasNonEmpty = previousValue.trim().length > 0;
    const isNowEmpty = searchInput.trim().length === 0;

    // If user cleared a non-empty input, mark as user-initiated
    if (wasNonEmpty && isNowEmpty) {
      userInitiatedClearRef.current = true;
    }
  }, [searchInput, previousValue]);

  // Separate effect to handle the actual clearing
  // This runs AFTER the ref is updated, preventing loops
  useEffect(() => {
    // Only proceed if this was a user-initiated clear
    if (!userInitiatedClearRef.current) {
      return;
    }

    const isInputEmpty = searchInput.trim().length === 0;
    const hasFilters = hasActiveFilters(filters);

    // Clear all filters if input is empty and filters are active
    if (isInputEmpty && hasFilters) {
      if (onClearAll) {
        onClearAll();
      }
      onNaturalLanguageSearch?.(false);

      // Reset the flag after clearing
      userInitiatedClearRef.current = false;
    } else if (isInputEmpty && !hasFilters) {
      // Input is empty and no filters - reset flag
      userInitiatedClearRef.current = false;
    }
  }, [searchInput, filters, onClearAll, onNaturalLanguageSearch]);
}

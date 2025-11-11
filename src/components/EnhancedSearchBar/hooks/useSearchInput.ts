/**
 * Custom hook to manage search input state and synchronization
 * Handles bidirectional sync between local input and external filter state
 */

import { useState, useEffect, useRef } from "react";
import { FilterState } from "@/hooks/useUrlState";
import { getDisplayValue } from "../utils";

interface UseSearchInputReturn {
  searchInput: string;
  setSearchInput: (value: string) => void;
  previousValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Manages the search input field state with external filter synchronization
 * @param filters - Current filter state from URL
 * @returns Search input state, setter, previous value, and input ref
 */
export function useSearchInput(filters: FilterState): UseSearchInputReturn {
  const displayValue = getDisplayValue(filters);
  const [searchInput, setSearchInput] = useState(displayValue);
  const prevSearchInputRef = useRef(displayValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when filters change externally (e.g., clear button, navigation, back button)
  // ALWAYS prefer originalQuery if it exists (user's raw input), otherwise fall back to search (cleaned term)
  useEffect(() => {
    const newDisplayValue = filters.originalQuery || filters.search;
    setSearchInput(newDisplayValue);
    prevSearchInputRef.current = newDisplayValue;
  }, [filters.originalQuery, filters.search]);

  return {
    searchInput,
    setSearchInput,
    previousValue: prevSearchInputRef.current,
    inputRef,
  };
}

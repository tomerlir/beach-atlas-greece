/**
 * EnhancedSearchBar Component
 *
 * Refactored to be a pure presentation component that composes custom hooks
 * All business logic extracted into dedicated hooks for better maintainability
 */

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { FilterState } from "@/hooks/useUrlState";
import { setKnownPlaces } from "@/lib/naturalLanguageSearch";
import { useAreas } from "@/hooks/useAreas";
import { useSearchInput } from "./hooks/useSearchInput";
import { useSearchPlaceholder } from "./hooks/useSearchPlaceholder";
import { useSearchSubmit } from "./hooks/useSearchSubmit";
import { useAutoClear } from "./hooks/useAutoClear";
import { createEmptyFilters } from "./utils";

interface EnhancedSearchBarProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onClearAll?: () => void; // Callback to clear all filters including location
  className?: string;
  placeholder?: string;
  // Area context for place mismatch detection
  areaName?: string;
  // Callback for place mismatch notifications
  onPlaceMismatch?: (place: string, areaName: string) => void;
  // Callback for when natural language search is used
  onNaturalLanguageSearch?: (wasUsed: boolean) => void;
}

export default function EnhancedSearchBar({
  filters,
  onFiltersChange,
  onClearAll,
  className = "",
  areaName,
  onPlaceMismatch,
  onNaturalLanguageSearch,
}: EnhancedSearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const isMobile = useIsMobile();
  const { data: areas } = useAreas();

  // Custom hooks for separation of concerns
  const { searchInput, setSearchInput, previousValue, inputRef } = useSearchInput(filters);

  const placeholder = useSearchPlaceholder({
    isMobile,
    searchInput,
  });

  const { handleSearchSubmit } = useSearchSubmit({
    filters,
    onFiltersChange,
    onClearAll,
    onNaturalLanguageSearch,
    onPlaceMismatch,
    areaName,
  });

  // Auto-clear filters when user manually empties search
  useAutoClear({
    searchInput,
    previousValue,
    filters,
    onClearAll,
    onNaturalLanguageSearch,
  });

  // Keep NLQ place dictionary in sync with active areas
  useEffect(() => {
    if (areas && areas.length > 0) {
      const names = areas.map((a) => a.name).filter(Boolean) as string[];
      setKnownPlaces(names);
    }
  }, [areas]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit(searchInput);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClearSearch();
    }
  };

  // Handle clear search - now clears ALL filters including location
  const handleClearSearch = () => {
    setSearchInput("");
    if (onClearAll) {
      // Use the full clear all function if provided
      onClearAll();
    } else {
      // Fallback to clearing search and originalQuery if onClearAll not provided
      onFiltersChange({
        ...createEmptyFilters(),
        // Keep only essential reset fields
        search: "",
        originalQuery: undefined,
        location: undefined,
        locations: undefined,
        page: 1,
      });
    }
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative group flex">
        {/* Search Icon */}
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5 transition-colors group-focus-within:text-primary z-10" />

        {/* Main Search Input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`
              w-full pl-10 pr-2 md:pl-12 md:pr-4 h-12 md:h-14 text-base md:text-lg bg-card/95 border-2 rounded-l-xl md:rounded-l-2xl rounded-r-none border-r-0
              transition-all duration-200 ease-in-out
              text-foreground
              ${
                searchFocused
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-border hover:border-primary/50 hover:shadow-md"
              }
              focus:ring-0 focus:border-primary focus:shadow-lg focus:shadow-primary/20
              placeholder:text-muted-foreground/70 placeholder:text-sm md:placeholder:text-base
            `}
            aria-label="Search beaches by name or location"
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={() => handleSearchSubmit(searchInput)}
          className="h-12 md:h-14 px-3 md:px-8 bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-l-0 border-accent rounded-r-xl md:rounded-r-2xl rounded-l-none font-medium text-sm md:text-base"
          aria-label="Search beaches"
        >
          Search
        </Button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';
import { analytics } from '@/lib/analytics';
import { extractFromQuery } from '@/lib/nlpExtractor';

interface EnhancedSearchBarProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  className?: string;
  placeholder?: string;
  enableNLP?: boolean; // Enable natural language processing
  currentArea?: string; // Current area context (for area pages)
}

export default function EnhancedSearchBar({
  filters,
  onFiltersChange,
  className = '',
  placeholder = "Search beaches, islands, or places in Greece...",
  enableNLP = true,
  currentArea,
}: EnhancedSearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Sync local state when filters.search changes externally (e.g., clear button)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Handle search submission with NLP extraction
  const handleSearchSubmit = () => {
    if (searchInput !== filters.search) {
      // If NLP is enabled, extract structured filters
      if (enableNLP && searchInput.trim()) {
        const extracted = extractFromQuery(searchInput);
        
        // Build filter updates
        const updates: Partial<FilterState> = { page: 1 };
        
        // Homepage: apply filters + place text for search
        if (!currentArea) {
          // NOTE: We currently don't have a dedicated 'type' filter in FilterState
          // so type extraction is implicit through search text matching
          if (extracted.waveConditions && extracted.waveConditions.length > 0) {
            updates.waveConditions = extracted.waveConditions;
          }
          if (extracted.parking && extracted.parking.length > 0) {
            updates.parking = extracted.parking;
          }
          if (extracted.amenities && extracted.amenities.length > 0) {
            updates.amenities = extracted.amenities;
          }
          if (extracted.blueFlag) {
            updates.blueFlag = true;
          }
          // Use place as search text if provided (for substring matching on name/area)
          updates.search = extracted.place || searchInput;
        } else {
          // Area page: apply filters only (ignore place unless it's different)
          if (extracted.waveConditions && extracted.waveConditions.length > 0) {
            updates.waveConditions = extracted.waveConditions;
          }
          if (extracted.parking && extracted.parking.length > 0) {
            updates.parking = extracted.parking;
          }
          if (extracted.amenities && extracted.amenities.length > 0) {
            updates.amenities = extracted.amenities;
          }
          if (extracted.blueFlag) {
            updates.blueFlag = true;
          }
          // Keep search text for name matching within area
          updates.search = searchInput;
          
          // Store the extracted place for mismatch detection
          if (extracted.place) {
            updates.extractedPlace = extracted.place;
          } else {
            // Clear extractedPlace if no place detected
            updates.extractedPlace = '';
          }
        }
        
        onFiltersChange(updates);
        analytics.event('nlp_search_submit', { 
          q_length: searchInput.length,
          extracted_filters: Object.keys(extracted).length
        });
      } else {
        // No NLP: just use as plain search text
        onFiltersChange({ search: searchInput, page: 1 });
        analytics.event('search_submit', { q_length: searchInput.length });
      }
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('');
    onFiltersChange({ search: '', extractedPlace: '', page: 1 });
    inputRef.current?.focus();
  };

  const showClearButton = searchInput.length > 0;

  // Create responsive placeholder text
  const getResponsivePlaceholder = () => {
    if (isMobile) {
      // Short placeholder for mobile
      if (placeholder.includes('Search beaches in')) {
        return 'Search beaches...';
      }
      return 'Search beaches...';
    }
    return placeholder;
  };

  const responsivePlaceholder = getResponsivePlaceholder();

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative group flex">
        {/* Search Icon */}
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary z-10" />
        
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={responsivePlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ color: '#4b5563' }}
            className={`
              w-full pl-12 pr-4 h-14 text-lg bg-white/95 border-2 rounded-l-2xl rounded-r-none border-r-0
              transition-all duration-200 ease-in-out
              text-gray-600
              ${searchFocused 
                ? 'border-primary shadow-lg shadow-primary/20' 
                : 'border-border hover:border-primary/50 hover:shadow-md'
              }
              focus:ring-0 focus:border-primary focus:shadow-lg focus:shadow-primary/20
              placeholder:text-muted-foreground/70
            `}
            aria-label="Search beaches by name or location"
          />
          
          {/* Clear Button - positioned within input field */}
          {showClearButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full z-10 text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearchSubmit}
          className="h-14 px-8 bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-l-0 border-accent rounded-r-2xl rounded-l-none font-medium"
          aria-label="Search beaches"
        >
          Search
        </Button>

      </div>

      {/* Search Tips - Commented out */}
      {/* {searchFocused && searchInput.length < 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-lg p-4 z-40">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2 text-foreground">Search tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• Try beach names like "Sarakiniko" or "Porto Katsiki"</li>
              <li>• Search by island or region like "Milos" or "Corfu"</li>
              <li>• Filter by specific amenities and more</li>
            </ul>
          </div>
        </div>
      )} */}
    </div>
  );
}

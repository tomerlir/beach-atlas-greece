import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';
import { analytics } from '@/lib/analytics';
import { createSearchSubmitEvent } from '@/lib/analyticsEvents';
import { extractFromNaturalLanguage, applyExtractedFilters, applyExtractedFiltersForArea, doesPlaceMatchArea, setKnownPlaces } from '@/lib/naturalLanguageSearch';
import { useAreas } from '@/hooks/useAreas';

const isBrowser = typeof window !== 'undefined';

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
  className = '',
  placeholder = "Search beaches...",
  areaName,
  onPlaceMismatch,
  onNaturalLanguageSearch,
}: EnhancedSearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.originalQuery || filters.search);
  const [isClearing, setIsClearing] = useState(false); // Prevent infinite loops during clearing
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { data: areas } = useAreas();
  
  // Track previous search input to detect manual clearing
  const prevSearchInputRef = useRef(searchInput);
  // Keep NLQ place dictionary in sync with active areas
  useEffect(() => {
    if (areas && areas.length > 0) {
      const names = areas.map(a => a.name).filter(Boolean) as string[];
      setKnownPlaces(names);
    }
  }, [areas]);

  
  // Sync local state when filters change externally (e.g., clear button, navigation, back button)
  // ALWAYS prefer originalQuery if it exists (user's raw input), otherwise fall back to search (cleaned term)
  useEffect(() => {
    const displayValue = filters.originalQuery || filters.search;
    setSearchInput(displayValue);
    prevSearchInputRef.current = displayValue;
  }, [filters.originalQuery, filters.search]);
  
  // Auto-clear all filters when user manually empties the search input
  useEffect(() => {
    // Prevent clearing when already in the process of clearing to avoid infinite loops
    if (isClearing) {
      return;
    }
    
    const wasNonEmpty = prevSearchInputRef.current.trim().length > 0;
    const isNowEmpty = searchInput.trim().length === 0;
    const hasActiveFiltersOrSearch = filters.search || filters.originalQuery || 
      filters.location || (filters.locations && filters.locations.length > 0) ||
      filters.type.length > 0 || filters.waveConditions.length > 0 ||
      filters.parking.length > 0 || filters.amenities.length > 0 ||
      filters.organized.length > 0 || filters.blueFlag;
    
    // If user manually cleared a non-empty search AND there are active filters, clear everything
    if (wasNonEmpty && isNowEmpty && hasActiveFiltersOrSearch) {
      setIsClearing(true);
      
      // Use setTimeout to avoid state update during render
      const timer = setTimeout(() => {
        if (onClearAll) {
          onClearAll();
        } else {
          // Fallback to clearing search and originalQuery
          onFiltersChange({ 
            search: '', 
            originalQuery: undefined,
            location: undefined,
            locations: undefined,
            type: [],
            waveConditions: [],
            parking: [],
            amenities: [],
            organized: [],
            blueFlag: false,
            page: 1 
          });
        }
        onNaturalLanguageSearch?.(false); // Reset NL search flag
        setIsClearing(false);
      }, 100); // Small delay to batch the update
      
      return () => {
        clearTimeout(timer);
        setIsClearing(false);
      };
    }
    
    // Update the previous value
    prevSearchInputRef.current = searchInput;
  }, [searchInput, filters, onClearAll, onFiltersChange, onNaturalLanguageSearch, isClearing]);

  // Handle search submission - ALWAYS use NLQ extraction (simpler and more robust)
  const handleSearchSubmit = async () => {
    const trimmedInput = searchInput.trim();
    
    // If input is empty, clear all filters
    if (trimmedInput === '') {
      if (onClearAll) {
        onClearAll();
      } else {
        onFiltersChange({ 
          search: '', 
          originalQuery: undefined,
          location: undefined,
          locations: undefined,
          type: [],
          waveConditions: [],
          parking: [],
          amenities: [],
          organized: [],
          blueFlag: false,
          page: 1 
        });
      }
      onNaturalLanguageSearch?.(false); // Reset NL search flag
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
        if (extracted.place && !doesPlaceMatchArea(extracted.place, areaName) && onPlaceMismatch) {
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
        sessionStorage.setItem('current_query_hash', queryHash);
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
        areaName ? 'area' : 'homepage'
      );
      
      analytics.event('search_submit', searchEvent);
      
      // Track search for session management and quality tracking
      analytics.trackSearch(queryHash);
    } catch (error) {
      console.error('Search extraction failed:', error);
      // Fallback to basic search
      onFiltersChange({
        search: trimmedInput,
        originalQuery: trimmedInput,
        page: 1
      });
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClearSearch();
    }
  };


  // Handle clear search - now clears ALL filters including location
  const handleClearSearch = () => {
    setSearchInput('');
    if (onClearAll) {
      // Use the full clear all function if provided
      onClearAll();
    } else {
      // Fallback to just clearing search and originalQuery if onClearAll not provided
      onFiltersChange({ search: '', originalQuery: undefined, location: undefined, locations: undefined, page: 1 });
    }
    inputRef.current?.focus();
  };


  // AI-powered dynamic placeholder text showcasing NLQ intelligence
  // Use useState to ensure placeholder only changes when searchInput is empty and component mounts
  const [aiPlaceholder, setAiPlaceholder] = useState(() => {
    const examples = [
      "Ask me: 'Show me secluded beaches with crystal clear water near Crete'",
      "Try: 'Find family-friendly beaches with shallow water and lifeguards'", 
      "Ask: 'What are the best beaches for windsurfing with strong winds?'",
      "Search: 'Beaches with beach bars and music, not too crowded'",
      "Ask: 'Show me beaches where I can see the sunset with my partner'",
      "Try: 'Find beaches with good snorkeling and marine life'",
      "Ask: 'What beaches have the softest sand and are wheelchair accessible?'",
      "Search: 'Beaches with traditional Greek tavernas right on the sand'",
      "Ask: 'Show me beaches with ancient ruins or historical sites nearby'",
      "Try: 'Find beaches with the bluest water and best for Instagram photos'",
      "Ask: 'What are the quietest beaches away from tourist crowds?'",
      "Search: 'Beaches with beach volleyball courts and water sports'"
    ];
    
    if (isMobile) {
      return 'Ask me about beaches...';
    }
    return examples[Math.floor(Math.random() * examples.length)];
  });

  // Only change placeholder when searchInput becomes empty (user cleared search)
  useEffect(() => {
    if (searchInput.length === 0) {
      const examples = [
        "Ask me: 'Show me sandy beaches with calm waters near Crete'",
        "Try: 'Find family-friendly beaches with lifeguards'", 
        "Ask: 'What are the best beaches for windsurfing with strong winds?'",
        "Search: 'Beaches with beach bars and music'",
        "Try: 'Find calm beaches with good snorkeling'",
        "Search: 'Beaches with traditional Greek tavernas in Corfu'",
        "Try: 'Find beaches for Instagram photos'",
        "Search: 'Beaches with water sports'"
      ];
      
      if (isMobile) {
        setAiPlaceholder('Ask me about beaches...');
      } else {
        setAiPlaceholder(examples[Math.floor(Math.random() * examples.length)]);
      }
    }
  }, [searchInput, isMobile]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative group flex">
        {/* Search Icon */}
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5 transition-colors group-focus-within:text-primary z-10" />
        
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={aiPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`
              w-full pl-10 pr-2 md:pl-12 md:pr-4 h-12 md:h-14 text-base md:text-lg bg-card/95 border-2 rounded-l-xl md:rounded-l-2xl rounded-r-none border-r-0
              transition-all duration-200 ease-in-out
              text-foreground
              ${searchFocused 
                ? 'border-primary shadow-lg shadow-primary/20' 
                : 'border-border hover:border-primary/50 hover:shadow-md'
              }
              focus:ring-0 focus:border-primary focus:shadow-lg focus:shadow-primary/20
              placeholder:text-muted-foreground/70 placeholder:text-sm md:placeholder:text-base
            `}
            aria-label="Search beaches by name or location"
          />
          
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearchSubmit}
          className="h-12 md:h-14 px-3 md:px-8 bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-l-0 border-accent rounded-r-xl md:rounded-r-2xl rounded-l-none font-medium text-sm md:text-base"
          aria-label="Search beaches"
        >
          Search
        </Button>
      </div>

    </div>
  );
}

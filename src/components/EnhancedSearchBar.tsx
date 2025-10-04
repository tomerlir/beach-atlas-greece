import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';
import { analytics } from '@/lib/analytics';
import { extractFromNaturalLanguage, applyExtractedFilters, applyExtractedFiltersForArea, doesPlaceMatchArea } from '@/lib/naturalLanguageSearch';

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
  placeholder = "Search beaches, islands, or places in Greece...",
  areaName,
  onPlaceMismatch,
  onNaturalLanguageSearch,
}: EnhancedSearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.originalQuery || filters.search);
  const [isClearing, setIsClearing] = useState(false); // Prevent infinite loops during clearing
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  
  // Track previous search input to detect manual clearing
  const prevSearchInputRef = useRef(searchInput);
  
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
  const handleSearchSubmit = () => {
    const trimmedInput = searchInput.trim();
    
    // Early return if search hasn't changed
    if (trimmedInput === filters.search && !filters.originalQuery) {
      return;
    }
    
    // ALWAYS extract filters from the query
    // The extraction logic is smart enough to handle both:
    // - Natural language queries (extracts filters)
    // - Simple searches (returns empty filters, just location/name)
    const extracted = extractFromNaturalLanguage(trimmedInput);
    
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
    
    // Track analytics with detailed info
    analytics.event('search_submit', { 
      q_length: trimmedInput.length,
      extracted_filters: Object.keys(extracted.filters).length,
      has_place: !!extracted.place,
      cleaned_term_length: extracted.cleanedSearchTerm.length,
      is_nlq: hasExtractedFilters,
      context: areaName ? 'area' : 'homepage'
    });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
      onFiltersChange({ search: '', originalQuery: undefined, page: 1 });
    }
    textareaRef.current?.focus();
  };


  // Create AI-style placeholder text that encourages natural language queries
  const getResponsivePlaceholder = () => {
    if (isMobile) {
      return 'Ask me about beaches...';
    }
    return 'Ask me about beaches in Greece... (e.g., "Show me sandy beaches with parking near Corfu")';
  };

  const responsivePlaceholder = getResponsivePlaceholder();

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative group">
        {/* AI-Style Textarea Container */}
        <div className={`relative bg-white/95 border-2 rounded-2xl transition-all duration-200 ease-in-out
          ${searchFocused 
            ? 'border-primary shadow-lg shadow-primary/20' 
            : 'border-border hover:border-primary/50 hover:shadow-md'
          } focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20`}>
          
          {/* Main AI-Style Textarea */}
          <textarea
            ref={textareaRef}
            placeholder={responsivePlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full min-h-[3.5rem] max-h-32 px-4 py-3 pr-12 text-lg bg-transparent border-0 rounded-2xl resize-none
              text-gray-600 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 cursor-text"
            style={{ 
              color: '#4b5563',
              lineHeight: '1.5'
            }}
            rows={2}
            aria-label="Ask about beaches in Greece"
            title="Press Esc to clear"
          />
          

          {/* Send Button - positioned at bottom right */}
          <Button
            onClick={handleSearchSubmit}
            className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-primary hover:bg-primary/90 rounded-full z-10 text-white shadow-lg"
            aria-label="Send message"
            disabled={!searchInput.trim()}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI-Style Help Text - positioned above to avoid hero section overflow */}
      {searchFocused && searchInput.length < 2 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-border rounded-2xl shadow-xl p-4 z-[9999]">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2 text-foreground">💡 AI Search Tips:</p>
            <ul className="space-y-1 text-sm">
              <li>Ask naturally: "Show me sandy beaches with parking near Corfu"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

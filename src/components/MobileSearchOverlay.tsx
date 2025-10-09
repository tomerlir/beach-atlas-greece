import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterState } from '@/hooks/useUrlState';
import { analytics } from '@/lib/analytics';
import { extractFromNaturalLanguage, applyExtractedFilters, applyExtractedFiltersForArea, doesPlaceMatchArea } from '@/lib/naturalLanguageSearch';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onClearAll?: () => void;
  areaName?: string;
  onPlaceMismatch?: (place: string, areaName: string) => void;
  onNaturalLanguageSearch?: (wasUsed: boolean) => void;
}

export default function MobileSearchOverlay({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearAll,
  areaName,
  onPlaceMismatch,
  onNaturalLanguageSearch,
}: MobileSearchOverlayProps) {
  const [searchInput, setSearchInput] = useState(filters.originalQuery || filters.search);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with filters
  useEffect(() => {
    const displayValue = filters.originalQuery || filters.search;
    setSearchInput(displayValue);
  }, [filters.originalQuery, filters.search]);

  // Auto-focus when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearchSubmit = () => {
    const trimmedInput = searchInput.trim();
    
    if (trimmedInput === filters.search && !filters.originalQuery) {
      onClose();
      return;
    }
    
    const extracted = extractFromNaturalLanguage(trimmedInput);
    const hasExtractedFilters = Object.keys(extracted.filters).length > 0;
    
    onNaturalLanguageSearch?.(hasExtractedFilters);
    
    if (areaName) {
      const newFilters = applyExtractedFiltersForArea(filters, extracted);
      onFiltersChange({
        ...newFilters,
        originalQuery: trimmedInput,
      });
      
      if (extracted.place && !doesPlaceMatchArea(extracted.place, areaName) && onPlaceMismatch) {
        onPlaceMismatch(extracted.place, areaName);
      }
    } else {
      const newFilters = applyExtractedFilters(filters, extracted);
      onFiltersChange({
        ...newFilters,
        originalQuery: trimmedInput,
      });
    }
    
    analytics.event('mobile_search_submit', { 
      q_length: trimmedInput.length,
      extracted_filters: Object.keys(extracted.filters).length,
      has_place: !!extracted.place,
      is_nlq: hasExtractedFilters,
      context: areaName ? 'area' : 'homepage',
    });
    
    onClose();
  };

  const handleClear = () => {
    setSearchInput('');
    if (onClearAll) {
      onClearAll();
    } else {
      onFiltersChange({ search: '', originalQuery: undefined, page: 1 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background animate-in fade-in duration-200">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
          <Input
            ref={inputRef}
            placeholder="Ask me about beaches..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-3 h-12 text-base border-2 border-primary/30 focus:border-primary bg-background"
            aria-label="Search beaches"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Try asking:</p>
          <div className="grid gap-2">
            {[
              "Sandy beaches with calm waters",
              "Beaches with beach bars in Corfu",
              "Family-friendly beaches with lifeguards",
              "Secluded beaches for snorkeling",
              "Beaches with parking nearby",
            ].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setSearchInput(suggestion)}
                className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-3">
          <Button
            onClick={handleSearchSubmit}
            className="w-full h-12 text-base bg-accent hover:bg-accent/90"
            size="lg"
          >
            Search
          </Button>
          
          {searchInput && (
            <Button
              onClick={handleClear}
              variant="outline"
              className="w-full h-12"
            >
              Clear Search
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

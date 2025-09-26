import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { FilterState } from '@/hooks/useUrlState';

interface EnhancedSearchBarProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  userLocation: GeolocationPosition | null;
  hasResults: boolean;
  className?: string;
}

export default function EnhancedSearchBar({
  filters,
  onFiltersChange,
  userLocation,
  hasResults,
  className = '',
}: EnhancedSearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounced search with 200ms delay for better responsiveness
  const { searchInput, setSearchInput, clearSearchInput } = useDebouncedSearch(
    filters.search,
    (value: string) => onFiltersChange({ search: value, page: 1 }),
    200
  );

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  // Handle clear search
  const handleClearSearch = () => {
    clearSearchInput();
    onFiltersChange({ search: '', page: 1 });
    inputRef.current?.focus();
  };

  const showClearButton = searchInput.length > 0;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative group">
        {/* Search Icon */}
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
        
        {/* Main Search Input */}
        <Input
          ref={inputRef}
          placeholder="Search areas or beaches..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{ color: '#1f2937' }}
          className={`
            pl-12 pr-12 h-14 text-lg bg-white border-2 rounded-2xl
            transition-all duration-200 ease-in-out
            text-gray-900 text-foreground
            ${searchFocused 
              ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' 
              : 'border-border hover:border-primary/50 shadow-md hover:shadow-lg'
            }
            focus:ring-0 focus:border-primary focus:shadow-lg focus:shadow-primary/10
            placeholder:text-muted-foreground/70
          `}
          aria-label="Search beaches by name or location"
        />

        {/* Clear Button */}
        {showClearButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted rounded-full"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

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

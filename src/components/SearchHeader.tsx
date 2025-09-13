import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Filter, ChevronDown, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { FilterState } from '@/hooks/useUrlState';

interface SearchHeaderProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  userLocation: GeolocationPosition | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
  onOpenAllFilters: () => void;
  locationPermission: 'granted' | 'denied' | 'prompt' | null;
}

// Sort options for the dropdown
const sortOptions = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'blueFlag', label: 'Blue Flag first' },
  { value: 'distance', label: 'Distance (near me first)' },
];

export default function SearchHeader({
  filters,
  onFiltersChange,
  userLocation,
  onLocationRequest,
  isLoadingLocation,
  onOpenAllFilters,
  locationPermission,
}: SearchHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { searchInput, setSearchInput } = useDebouncedSearch(
    filters.search,
    (value: string) => onFiltersChange({ search: value, page: 1 }),
    250
  );

  // Auto-enable distance sorting when location is obtained and nearMe is enabled
  useEffect(() => {
    if (userLocation && filters.nearMe && filters.sort !== 'distance') {
      onFiltersChange({ sort: 'distance', page: 1 });
    }
  }, [userLocation, filters.nearMe, filters.sort, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const toggleNearMe = () => {
    if (filters.nearMe) {
      // Turn off "Near me" - revert to last non-distance sort
      const newSort = filters.sort === 'distance' ? 'name' : filters.sort;
      onFiltersChange({ nearMe: false, sort: newSort, page: 1 });
    } else {
      // Turn on "Near me" - request location if needed
      if (userLocation) {
        onFiltersChange({ nearMe: true, sort: 'distance', page: 1 });
      } else {
        // Request location and enable near me mode
        onFiltersChange({ nearMe: true, page: 1 });
        onLocationRequest();
      }
    }
  };

  const handleSortChange = (sort: string) => {
    onFiltersChange({ sort: sort as FilterState['sort'], page: 1 });
  };

  // Calculate active filter counts (excluding nearMe as it's not a filter)
  const activeFiltersCount = [
    filters.blueFlag,
    filters.organized !== null,
    filters.parking !== 'any',
    filters.amenities.length > 0,
  ].filter(Boolean).length;

  const isNearMeActive = filters.nearMe && userLocation;
  const isLocationDenied = locationPermission === 'denied';

  return (
    <TooltipProvider>
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          {/* Large Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
            <Input
              ref={searchInputRef}
              placeholder="Search beaches or places…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-14 h-14 text-lg bg-white shadow-soft border-border focus:ring-primary rounded-xl"
              aria-label="Search beaches by name or location"
            />
          </div>

          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side: Near Me chip and Sort dropdown */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Near Me Chip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isNearMeActive ? "default" : "outline"}
                    size="sm"
                    onClick={toggleNearMe}
                    disabled={isLoadingLocation}
                    className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors min-h-[44px] min-w-[44px]"
                    aria-pressed={isNearMeActive ? "true" : "false"}
                    aria-label={userLocation ? "Sort by distance" : "Use my location"}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {isLoadingLocation ? "Getting location..." : 
                     isNearMeActive ? "Near me" : "Near me"}
                  </Button>
                </TooltipTrigger>
                {isLocationDenied && (
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Location blocked. Enable in browser settings.</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Sort:</span>
                <Select
                  value={filters.sort}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="w-40 sm:w-48 min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.value === 'distance' && !userLocation}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right side: All Filters button */}
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAllFilters}
                className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors min-h-[44px] min-w-[44px]"
                aria-expanded="false"
                aria-label="Open all filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                All Filters
                {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  MapPin,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Car,
  Flag,
  Sun,
  Umbrella,
  Waves,
  X,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';
import AmenitiesDropdown from '@/components/AmenitiesDropdown';
import SortDropdown from '@/components/SortDropdown';
import { getAmenityLabel } from '@/lib/amenities';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  userLocation: GeolocationPosition | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
  onOpenAllFilters: () => void;
  locationPermission: 'granted' | 'denied' | 'prompt' | null;
  resultCount: number;
  showCountBadge?: boolean;
}


const organizedOptions = [
  { value: 'both', label: 'Both' },
  { value: 'organized', label: 'Organized' },
  { value: 'unorganized', label: 'Unorganized' },
];

const parkingOptions = [
  { value: 'any', label: 'Any' },
  { value: 'NONE', label: 'None' },
  { value: 'ROADSIDE', label: 'Roadside' },
  { value: 'SMALL_LOT', label: 'Small lot' },
  { value: 'LARGE_LOT', label: 'Large lot' },
];



const parkingLabels: Record<string, string> = {
  'any': 'Any',
  'NONE': 'None',
  'ROADSIDE': 'Roadside',
  'SMALL_LOT': 'Small lot',
  'LARGE_LOT': 'Large lot',
};

export default function FilterBar({
  filters,
  onFiltersChange,
  userLocation,
  onLocationRequest,
  isLoadingLocation,
  onOpenAllFilters,
  locationPermission,
  resultCount,
  showCountBadge = false,
}: FilterBarProps) {
  const isMobile = useIsMobile();
  const [organizedOpen, setOrganizedOpen] = useState(false);
  const [parkingOpen, setParkingOpen] = useState(false);

  const organizedTriggerRef = useRef<HTMLButtonElement>(null);
  const parkingTriggerRef = useRef<HTMLButtonElement>(null);

  // Debounced search with 250ms delay
  const { searchInput, setSearchInput, clearSearchInput } = useDebouncedSearch(
    filters.search,
    (value: string) => onFiltersChange({ search: value, page: 1 }),
    250
  );


  // Handle filter changes

  const handleOrganizedChange = useCallback((value: string) => {
    const organized = value === 'both' ? null : value === 'organized';
    onFiltersChange({ organized, page: 1 });
    setOrganizedOpen(false);
  }, [onFiltersChange]);

  const handleParkingChange = useCallback((value: string) => {
    onFiltersChange({ parking: value, page: 1 });
    setParkingOpen(false);
  }, [onFiltersChange]);

  const handleBlueFlagToggle = useCallback((checked: boolean) => {
    onFiltersChange({ blueFlag: checked, page: 1 });
  }, [onFiltersChange]);

  const handleNearMeToggle = useCallback((checked: boolean) => {
    if (checked && !userLocation) {
      onLocationRequest();
    }

    // When enabling Near me, automatically set distance sorting
    // When disabling Near me, revert to A->Z sorting
    const updates: Partial<FilterState> = { nearMe: checked, page: 1 };
    if (checked) {
      updates.sort = 'distance.asc';
    } else {
      // When turning off near me, revert to A->Z sorting
      updates.sort = 'name.asc';
    }

    onFiltersChange(updates);
  }, [onFiltersChange, userLocation, onLocationRequest]);


  // Remove individual filters
  const handleRemoveFilter = useCallback((filterType: keyof FilterState, value?: any) => {
    switch (filterType) {
      case 'search':
        onFiltersChange({ search: '', page: 1 });
        break;
      case 'organized':
        onFiltersChange({ organized: null, page: 1 });
        break;
      case 'blueFlag':
        onFiltersChange({ blueFlag: false, page: 1 });
        break;
      case 'parking':
        onFiltersChange({ parking: 'any', page: 1 });
        break;
      case 'amenities':
        const newAmenities = filters.amenities.filter(amenity => amenity !== value);
        onFiltersChange({ amenities: newAmenities, page: 1 });
        break;
    }
  }, [onFiltersChange, filters.amenities]);

  const handleClearAllFilters = useCallback(() => {
    clearSearchInput(); // Clear search input immediately
    onFiltersChange({
      search: '', // Clear search term
      organized: null,
      blueFlag: false,
      parking: 'any',
      amenities: [],
      sort: 'name.asc', // Reset to default sort
      page: 1,
      nearMe: false,
    });
  }, [onFiltersChange, clearSearchInput]);

  // Calculate active filter counts
  const activeFiltersCount = [
    filters.blueFlag,
    filters.organized !== null,
    filters.parking !== 'any',
    filters.amenities.length > 0,
  ].filter(Boolean).length;

  const hasActiveFilters = filters.search ||
    filters.organized !== null ||
    filters.blueFlag ||
    filters.parking !== 'any' ||
    filters.amenities.length > 0;

  // Get filter pills for display
  const getFilterPills = useMemo(() => {
    const pills = [];

    if (filters.search) {
      pills.push({
        id: 'search',
        label: `"${filters.search}"`,
        onRemove: () => handleRemoveFilter('search'),
      });
    }

    if (filters.organized !== null) {
      pills.push({
        id: 'organized',
        label: filters.organized ? 'Organized' : 'Unorganized',
        onRemove: () => handleRemoveFilter('organized'),
      });
    }

    if (filters.blueFlag) {
      pills.push({
        id: 'blueFlag',
        label: 'Blue Flag',
        onRemove: () => handleRemoveFilter('blueFlag'),
      });
    }

    if (filters.parking !== 'any') {
      pills.push({
        id: 'parking',
        label: `Parking: ${parkingLabels[filters.parking] || filters.parking}`,
        onRemove: () => handleRemoveFilter('parking'),
      });
    }

    filters.amenities.forEach((amenity) => {
      pills.push({
        id: `amenity-${amenity}`,
        label: getAmenityLabel(amenity),
        onRemove: () => handleRemoveFilter('amenities', amenity),
      });
    });

    return pills;
  }, [filters, handleRemoveFilter]);




  // Focus management
  useEffect(() => {
    if (!organizedOpen && !parkingOpen) {
      return;
    }

    // Focus first focusable element in open dropdown
    const openDropdown = document.querySelector('[role="listbox"]:not([hidden])');
    if (openDropdown) {
      const firstFocusable = openDropdown.querySelector('button, [tabindex="0"]') as HTMLElement;
      firstFocusable?.focus();
    }
  }, [organizedOpen, parkingOpen]);

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        {/* Main Filter Bar */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Search Input - Full Row */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
                <Input
                  placeholder="Search beaches or places…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-11 bg-white border-border focus:ring-primary w-full"
                  aria-label="Search beaches by name or location"
                />
              </div>
            </div>

            {/* Facets Group - Second Row */}
            {!isMobile ? (
              <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-center">


                {/* Near Me Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={filters.nearMe ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNearMeToggle(!filters.nearMe)}
                      disabled={isLoadingLocation}
                      className="px-3 py-2 rounded-xl border h-auto"
                      role="switch"
                      aria-checked={filters.nearMe}
                      aria-label={`Near me (${filters.nearMe ? 'on' : 'off'})`}
                    >
                      <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="ml-2 text-sm">Near me</span>
                    </Button>
                  </TooltipTrigger>
                  {locationPermission === 'denied' && (
                    <TooltipContent>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Location blocked in browser settings.</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>


                {/* Blue Flag Toggle */}
                <Button
                  variant={filters.blueFlag ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBlueFlagToggle(!filters.blueFlag)}
                  className="px-3 py-2 rounded-xl border h-auto"
                  role="switch"
                  aria-checked={filters.blueFlag}
                  aria-label={`Blue Flag (${filters.blueFlag ? 'on' : 'off'})`}
                >
                  <Flag className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="ml-2 text-sm">Blue Flag</span>
                </Button>

                {/* Amenities Dropdown */}
                <AmenitiesDropdown
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  onOpenAllFilters={onOpenAllFilters}
                  showCountBadge={showCountBadge}
                />

                {/* Organized Dropdown */}
                <Popover open={organizedOpen} onOpenChange={setOrganizedOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      ref={organizedTriggerRef}
                      variant="outline"
                      size="sm"
                      className="px-3 py-2 rounded-xl border h-auto max-w-[180px]"
                      aria-expanded={organizedOpen}
                      aria-label="Organized"
                    >
                      <Waves className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Beach setup</span>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <div className="p-2">
                      {organizedOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOrganizedChange(option.value)}
                          className="w-full justify-start h-10"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Parking Dropdown */}
                <Popover open={parkingOpen} onOpenChange={setParkingOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      ref={parkingTriggerRef}
                      variant="outline"
                      size="sm"
                      className="px-3 py-2 rounded-xl border h-auto max-w-[180px]"
                      aria-expanded={parkingOpen}
                      aria-label="Parking"
                    >
                      <Car className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Parking</span>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <div className="p-2">
                      {parkingOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleParkingChange(option.value)}
                          className="w-full justify-start h-10"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* All Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenAllFilters}
                  className="px-3 py-2 rounded-xl border h-auto"
                  aria-label="Open all filters"
                >
                  <Filter className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  All Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Vertical Separator */}
                <div className="h-6 w-px bg-border mx-1" />

                {/* Sort Dropdown */}
                <SortDropdown
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  userLocation={userLocation}
                  locationPermission={locationPermission}
                  onLocationRequest={onLocationRequest}
                  isLoadingLocation={isLoadingLocation}
                />
              </div>
            ) : (
              /* Mobile: Scrollable facet chips */
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide justify-center">


                {/* Near Me Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={filters.nearMe ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNearMeToggle(!filters.nearMe)}
                      disabled={isLoadingLocation}
                      className="px-3 py-2 rounded-xl border h-auto"
                      role="switch"
                      aria-checked={filters.nearMe}
                      aria-label={`Near me (${filters.nearMe ? 'on' : 'off'})`}
                    >
                      <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="ml-2 text-sm">Near me</span>
                    </Button>
                  </TooltipTrigger>
                  {locationPermission === 'denied' && (
                    <TooltipContent>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Location blocked in browser settings.</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>


                {/* Blue Flag Toggle */}
                <Button
                  variant={filters.blueFlag ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBlueFlagToggle(!filters.blueFlag)}
                  className="px-3 py-2 rounded-xl border h-auto"
                  role="switch"
                  aria-checked={filters.blueFlag}
                  aria-label={`Blue Flag (${filters.blueFlag ? 'on' : 'off'})`}
                >
                  <Flag className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="ml-2 text-sm">blue flag</span>
                </Button>

                {/* Amenities Dropdown */}
                <AmenitiesDropdown
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  onOpenAllFilters={onOpenAllFilters}
                  showCountBadge={showCountBadge}
                />

                {/* Organized Dropdown */}
                <Popover open={organizedOpen} onOpenChange={setOrganizedOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0"
                      aria-expanded={organizedOpen}
                      aria-label="Organized"
                    >
                      <Umbrella className="h-4 w-4 mr-2" />
                      Setup
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <div className="p-2">
                      {organizedOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOrganizedChange(option.value)}
                          className="w-full justify-start h-10"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Parking Dropdown */}
                <Popover open={parkingOpen} onOpenChange={setParkingOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0"
                      aria-expanded={parkingOpen}
                      aria-label="Parking"
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Parking
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <div className="p-2">
                      {parkingOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleParkingChange(option.value)}
                          className="w-full justify-start h-10"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>


                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenAllFilters}
                  className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0"
                  aria-label="Open all filters"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All Filters
                </Button>

                {/* Vertical Separator */}
                <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />

                {/* Sort Dropdown for Mobile */}
                <div className="flex-shrink-0">
                  <SortDropdown
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                    userLocation={userLocation}
                    locationPermission={locationPermission}
                    onLocationRequest={onLocationRequest}
                    isLoadingLocation={isLoadingLocation}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        {hasActiveFilters && (
          <div className="container mx-auto px-4 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {getFilterPills.map((pill) => (
                <Badge
                  key={pill.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border-primary/20"
                >
                  <span>{pill.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={pill.onRemove}
                    className="h-8 w-8 p-0 hover:bg-primary/20 rounded-full flex items-center justify-center"
                    aria-label={`Remove filter: ${pill.label}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-muted-foreground hover:text-foreground min-h-[44px] px-2"
              >
                Clear all
              </Button>
            </div>
          </div>
        )}

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {resultCount} beaches found
        </div>
      </div>
  );
}
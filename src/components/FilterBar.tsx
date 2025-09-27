import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
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
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';
import AmenitiesDropdown from '@/components/AmenitiesDropdown';
import ParkingDropdown from '@/components/ParkingDropdown';
import WaveConditionsDropdown from '@/components/WaveConditionsDropdown';
import OrganizedDropdown from '@/components/OrganizedDropdown';
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
  areaName?: string; // Optional area name for area-specific pages
}




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
  areaName,
}: FilterBarProps) {
  const isMobile = useIsMobile();


  // Handle filter changes


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
        onFiltersChange({ organized: [], page: 1 });
        break;
      case 'blueFlag':
        onFiltersChange({ blueFlag: false, page: 1 });
        break;
      case 'parking':
        if (value !== undefined) {
          // Remove specific parking type
          const newParking = filters.parking.filter(p => p !== value);
          onFiltersChange({ parking: newParking, page: 1 });
        } else {
          // Clear all parking
          onFiltersChange({ parking: [], page: 1 });
        }
        break;
      case 'amenities':
        const newAmenities = filters.amenities.filter(amenity => amenity !== value);
        onFiltersChange({ amenities: newAmenities, page: 1 });
        break;
      case 'waveConditions':
        if (value !== undefined) {
          // Remove specific wave condition
          const newWaveConditions = filters.waveConditions.filter(wc => wc !== value);
          onFiltersChange({ waveConditions: newWaveConditions, page: 1 });
        } else {
          // Clear all wave conditions
          onFiltersChange({ waveConditions: [], page: 1 });
        }
        break;
    }
  }, [onFiltersChange, filters.amenities, filters.waveConditions]);

  const handleClearAllFilters = useCallback(() => {
    onFiltersChange({
      search: '', // Clear search term
      organized: [],
      blueFlag: false,
      parking: [],
      amenities: [],
      waveConditions: [],
      sort: 'name.asc', // Reset to default sort
      page: 1,
      nearMe: false,
    });
  }, [onFiltersChange]);

  // Calculate active filter counts
  const activeFiltersCount = [
    filters.blueFlag,
    filters.organized.length > 0,
    filters.parking.length > 0,
    filters.amenities.length > 0,
    filters.waveConditions.length > 0,
  ].filter(Boolean).length;

  const hasActiveFilters = filters.search ||
    filters.organized.length > 0 ||
    filters.blueFlag ||
    filters.parking.length > 0 ||
    filters.amenities.length > 0 ||
    filters.waveConditions.length > 0;

  // Get filter pills for display
  const getFilterPills = useMemo(() => {
    const pills = [];

    // Area filter (locked when areaName is provided)
    if (areaName) {
      pills.push({
        id: 'area',
        label: areaName,
        onRemove: null, // Cannot be removed
        locked: true,
      });
    }

    if (filters.search) {
      pills.push({
        id: 'search',
        label: filters.search,
        onRemove: () => handleRemoveFilter('search'),
        locked: false,
      });
    }

    if (filters.organized.length > 0) {
      filters.organized.forEach(organizedType => {
        pills.push({
          id: `organized-${organizedType}`,
          label: organizedType === 'organized' ? 'Organized' : 'Unorganized',
          onRemove: () => {
            const newOrganized = filters.organized.filter(type => type !== organizedType);
            onFiltersChange({ organized: newOrganized, page: 1 });
          },
          locked: false,
        });
      });
    }

    if (filters.blueFlag) {
      pills.push({
        id: 'blueFlag',
        label: 'Blue Flag',
        onRemove: () => handleRemoveFilter('blueFlag'),
        locked: false,
      });
    }

    // Individual parking pills
    filters.parking.forEach((parkingType) => {
      const parkingLabels: Record<string, string> = {
        'NONE': 'None',
        'ROADSIDE': 'Roadside',
        'SMALL_LOT': 'Small lot',
        'LARGE_LOT': 'Large lot',
      };
      pills.push({
        id: `parking-${parkingType}`,
        label: parkingLabels[parkingType] || parkingType,
        onRemove: () => handleRemoveFilter('parking', parkingType),
        locked: false,
      });
    });

    filters.amenities.forEach((amenity) => {
      pills.push({
        id: `amenity-${amenity}`,
        label: getAmenityLabel(amenity),
        onRemove: () => handleRemoveFilter('amenities', amenity),
        locked: false,
      });
    });

    // Individual wave conditions pills
    filters.waveConditions.forEach((waveCondition) => {
      const waveConditionLabels: Record<string, string> = {
        'CALM': 'Calm',
        'MODERATE': 'Moderate',
        'WAVY': 'Wavy',
        'SURFABLE': 'Surfable',
      };
      pills.push({
        id: `wave-${waveCondition}`,
        label: waveConditionLabels[waveCondition] || waveCondition,
        onRemove: () => handleRemoveFilter('waveConditions', waveCondition),
        locked: false,
      });
    });

    return pills;
  }, [filters, handleRemoveFilter, areaName, onFiltersChange]);





  return (
    <div className="relative z-20">
      {/* Main Filter Bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Facets Group - First Row */}
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
                    className={`px-3 py-2 rounded-xl border h-auto ${!filters.nearMe ? 'text-foreground' : ''}`}
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
                className={`px-3 py-2 rounded-xl border h-auto ${!filters.blueFlag ? 'text-foreground' : ''}`}
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
              <OrganizedDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                onOpenAllFilters={onOpenAllFilters}
                showCountBadge={showCountBadge}
              />

              {/* Parking Dropdown */}
              <ParkingDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                onOpenAllFilters={onOpenAllFilters}
                showCountBadge={showCountBadge}
              />

              {/* Wave Conditions Dropdown */}
              <WaveConditionsDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                onOpenAllFilters={onOpenAllFilters}
                showCountBadge={showCountBadge}
              />

              {/* All Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAllFilters}
                className="px-3 py-2 rounded-xl border h-auto text-foreground"
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
                    className={`px-3 py-2 rounded-xl border h-auto ${!filters.nearMe ? 'text-foreground' : ''}`}
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
                className={`px-3 py-2 rounded-xl border h-auto ${!filters.blueFlag ? 'text-foreground' : ''}`}
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
              <OrganizedDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                onOpenAllFilters={onOpenAllFilters}
                showCountBadge={showCountBadge}
              />

              {/* Parking Dropdown */}
              <ParkingDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                onOpenAllFilters={onOpenAllFilters}
                showCountBadge={showCountBadge}
              />

              {/* Wave Conditions Dropdown */}
              <WaveConditionsDropdown
                filters={filters}
                onFiltersChange={onFiltersChange}
                onOpenAllFilters={onOpenAllFilters}
                showCountBadge={showCountBadge}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAllFilters}
                className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0 text-foreground"
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
      {getFilterPills.length > 0 && (
        <div className="container mx-auto px-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {getFilterPills.map((pill) => (
              <Badge
                key={pill.id}
                variant="outline"
                className={`flex items-center gap-2 px-3 py-1 ${pill.locked
                  ? 'bg-white/90 text-foreground border-border'
                  : 'bg-white/90 text-foreground border-border'
                  }`}
              >
                <span>{pill.label}</span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pill.locked ? undefined : pill.onRemove}
                  disabled={pill.locked}
                  className={`h-8 w-8 p-0 rounded-full flex items-center justify-center ${
                    pill.locked 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-primary/20'
                  }`}
                  aria-label={pill.locked ? `${pill.label} (locked)` : `Remove filter: ${pill.label}`}
                >
                  <X className="h-3 w-3" />
                </Button>

              </Badge>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-muted-foreground hover:text-foreground min-h-[44px] px-2"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {resultCount} beaches found{areaName ? ` in ${areaName}` : ''}
      </div>
    </div>
  );
}
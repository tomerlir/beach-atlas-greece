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


  // Calculate active filter counts for "All Filters" button
  const activeFiltersCount = [
    filters.blueFlag,
    filters.organized.length > 0,
    filters.parking.length > 0,
    filters.amenities.length > 0,
    filters.waveConditions.length > 0,
  ].filter(Boolean).length;





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
                    className={`px-3 py-2 rounded-xl border h-auto shadow-lg backdrop-blur-sm ${!filters.nearMe ? 'text-foreground' : ''}`}
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
                className={`px-3 py-2 rounded-xl border h-auto shadow-lg backdrop-blur-sm ${!filters.blueFlag ? 'text-foreground' : ''}`}
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
                className="px-3 py-2 rounded-xl border h-auto text-foreground shadow-lg backdrop-blur-sm"
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
                    className={`px-3 py-2 rounded-xl border h-auto shadow-lg backdrop-blur-sm ${!filters.nearMe ? 'text-foreground' : ''}`}
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
                className={`px-3 py-2 rounded-xl border h-auto shadow-lg backdrop-blur-sm ${!filters.blueFlag ? 'text-foreground' : ''}`}
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
                className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0 text-foreground shadow-lg backdrop-blur-sm"
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


      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {resultCount} beaches found{areaName ? ` in ${areaName}` : ''}
      </div>
    </div>
  );
}
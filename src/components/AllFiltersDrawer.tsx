import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, Sun, CheckCircle, Car, Flag, X, Search, Check, Waves } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useBeachCount } from '@/hooks/useBeachCount';
import { useDraftState } from '@/hooks/useDraftState';
import { FilterState } from '@/hooks/useUrlState';
import { getAllAmenities } from '@/lib/amenities';

interface AllFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  userLocation: GeolocationPosition | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt' | null;
}

// Get all amenities from centralized map
const allAmenities = getAllAmenities();

const parkingOptions = [
  { value: 'any', label: 'Any' },
  { value: 'NONE', label: 'None' },
  { value: 'ROADSIDE', label: 'Roadside' },
  { value: 'SMALL_LOT', label: 'Small lot' },
  { value: 'LARGE_LOT', label: 'Large lot' },
];

const waveConditionsOptions = [
  { value: 'CALM', label: 'Calm' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'WAVY', label: 'Wavy' },
  { value: 'SURFABLE', label: 'Surfable' },
];

export default function AllFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  userLocation,
  onLocationRequest,
  isLoadingLocation,
  locationPermission,
}: AllFiltersDrawerProps) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  
  // Use draft state hook for proper state management
  const { draftFilters, updateDraft, resetDraft, clearDraft } = useDraftState(filters);

  // Debounced search with 250ms delay - synchronized with FilterBar
  const { searchInput, setSearchInput, clearSearchInput } = useDebouncedSearch(
    draftFilters.search,
    (value: string) => updateDraft({ search: value }),
    250
  );

  // Debounce the draft filters for live count updates
  const debouncedDraftFilters = useDebounce(draftFilters, 250);

  // Live count query with debouncing
  const { data: liveCount } = useBeachCount(debouncedDraftFilters, isOpen);

  // Focus management when drawer opens
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  const handleReset = () => {
    resetDraft();
  };

  const handleClearAll = () => {
    clearSearchInput(); // Clear search input immediately
    // Clear all filters including search
    updateDraft({
      search: '',
      organized: [],
      blueFlag: false,
      parking: [],
      amenities: [],
      sort: 'name.asc',
      page: 1,
      nearMe: false,
    });
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = draftFilters.amenities.includes(amenityId)
      ? draftFilters.amenities.filter(id => id !== amenityId)
      : [...draftFilters.amenities, amenityId];
    updateDraft({ amenities: newAmenities });
  };

  const handleNearMeToggle = () => {
    if (draftFilters.nearMe) {
      // Turning off near me - revert to A->Z sorting
      updateDraft({ nearMe: false, sort: 'name.asc' });
    } else {
      // Turning on near me - request location and set distance sorting
      updateDraft({ nearMe: true, sort: 'distance.asc' });
      onLocationRequest();
    }
  };

  // Calculate selected amenities count
  const selectedAmenitiesCount = draftFilters.amenities.length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg flex flex-col p-0"
        onKeyDown={handleKeyDown}
      >
        {/* Sticky Header */}
        <SheetHeader className="p-6 pb-4 sticky top-0 bg-background z-10 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
            <Button
              ref={firstFocusableRef}
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground h-auto p-2"
            >
              Clear all
            </Button>
          </div>
          {/* Live result count */}
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {liveCount !== undefined ? `${liveCount} results` : 'Loading...'}
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Search Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Search
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search beaches or places…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 bg-white border-border focus:ring-primary"
                aria-label="Search beaches by name or location"
              />
            </div>
          </div>

          {/* Near me Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Near me
            </h3>
            
            <div className="space-y-3">
              <Button
                variant={draftFilters.nearMe ? "default" : "outline"}
                onClick={handleNearMeToggle}
                disabled={isLoadingLocation}
                className="w-full justify-start min-h-[44px]"
                aria-pressed={draftFilters.nearMe}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isLoadingLocation ? "Getting location..." : 
                 draftFilters.nearMe ? "On" : 
                 locationPermission === 'denied' ? "Permission denied" : "Off"}
              </Button>
              
              {locationPermission === 'denied' && (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Location access denied. Enable location services to find nearby beaches.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLocationRequest}
                    className="min-h-[44px]"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Blue Flag Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Blue Flag
            </h3>
            
            <div className="flex items-center space-x-3 min-h-[44px]">
              <Checkbox
                id="blue-flag"
                checked={draftFilters.blueFlag}
                onCheckedChange={(checked) => updateDraft({ blueFlag: !!checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="blue-flag" className="text-sm cursor-pointer">
                Blue Flag certified beaches only
              </Label>
            </div>
          </div>

          {/* Beach Setup Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Beach setup
              </div>
              {draftFilters.organized.length > 0 && (
                <span className="text-muted-foreground text-xs font-normal">
                  • {draftFilters.organized.length} selected
                </span>
              )}
            </h3>
            
            <div className="space-y-1">
              {[
                { value: 'organized', label: 'Organized' },
                { value: 'unorganized', label: 'Unorganized' },
              ].map((option) => {
                const isSelected = draftFilters.organized.includes(option.value);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      const newOrganized = isSelected
                        ? draftFilters.organized.filter(org => org !== option.value)
                        : [...draftFilters.organized, option.value];
                      updateDraft({ organized: newOrganized });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors min-h-[44px] rounded-md ${
                      isSelected ? 'bg-muted/30' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parking Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Parking
              </div>
              {draftFilters.parking.length > 0 && (
                <span className="text-muted-foreground text-xs font-normal">
                  • {draftFilters.parking.length} selected
                </span>
              )}
            </h3>
            
            <div className="space-y-1">
              {parkingOptions.filter(option => option.value !== 'any').map((option) => {
                const isSelected = draftFilters.parking.includes(option.value);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      const newParking = isSelected
                        ? draftFilters.parking.filter(p => p !== option.value)
                        : [...draftFilters.parking, option.value];
                      updateDraft({ parking: newParking });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors min-h-[44px] rounded-md ${
                      isSelected ? 'bg-muted/30' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wave Conditions Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-primary" />
                Wave Conditions
              </div>
              {draftFilters.waveConditions.length > 0 && (
                <span className="text-muted-foreground text-xs font-normal">
                  • {draftFilters.waveConditions.length} selected
                </span>
              )}
            </h3>
            
            <div className="space-y-1">
              {waveConditionsOptions.map((option) => {
                const isSelected = draftFilters.waveConditions.includes(option.value);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      const newWaveConditions = isSelected
                        ? draftFilters.waveConditions.filter(wc => wc !== option.value)
                        : [...draftFilters.waveConditions, option.value];
                      updateDraft({ waveConditions: newWaveConditions });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors min-h-[44px] rounded-md ${
                      isSelected ? 'bg-muted/30' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amenities Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-primary" />
                Amenities
              </div>
              {selectedAmenitiesCount > 0 && (
                <span className="text-muted-foreground text-xs font-normal">
                  • {selectedAmenitiesCount} selected
                </span>
              )}
            </h3>
            
            <div className="space-y-1">
              {allAmenities.map((amenity) => {
                const isSelected = draftFilters.amenities.includes(amenity.id);
                
                return (
                  <button
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors min-h-[44px] rounded-md ${
                      isSelected ? 'bg-muted/30' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="text-sm font-medium">{amenity.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <SheetFooter className="p-6 pt-4 pb-8 border-t sticky bottom-0 bg-background pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 min-h-[44px]"
            >
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 min-h-[44px]"
            >
              Show results ({liveCount || 0})
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

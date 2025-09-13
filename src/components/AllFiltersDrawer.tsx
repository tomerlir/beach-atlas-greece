import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Sun, CheckCircle, Car, Flag, Waves, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDebounce } from '@/hooks/useDebounce';
import { useBeachCount } from '@/hooks/useBeachCount';
import { FilterState } from '@/hooks/useUrlState';

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

// Amenity taxonomy as specified
const amenityGroups = {
  'Common': [
    { id: 'sunbeds', label: 'Sunbeds' },
    { id: 'umbrellas', label: 'Umbrellas' },
    { id: 'beach_bar', label: 'Beach Bar' },
    { id: 'taverna', label: 'Taverna' },
  ],
  'Activities': [
    { id: 'snorkeling', label: 'Snorkeling' },
    { id: 'water_sports', label: 'Water Sports' },
    { id: 'boat_trips', label: 'Boat Trips' },
    { id: 'fishing', label: 'Fishing' },
    { id: 'photography', label: 'Photography' },
    { id: 'hiking', label: 'Hiking' },
    { id: 'birdwatching', label: 'Birdwatching' },
    { id: 'music', label: 'Music' },
  ],
  'Family & Safety': [
    { id: 'family_friendly', label: 'Family Friendly' },
    // { id: 'lifeguard', label: 'Lifeguard' }, // Add later
  ],
};

const parkingOptions = [
  { value: 'any', label: 'Any parking' },
  { value: 'NONE', label: 'None' },
  { value: 'ROADSIDE', label: 'Roadside' },
  { value: 'SMALL_LOT', label: 'Small lot' },
  { value: 'LARGE_LOT', label: 'Large lot' },
];

const waveConditionOptions = [
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
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [amenitySearch, setAmenitySearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  
  const debouncedAmenitySearch = useDebounce(amenitySearch, 250);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Focus management when drawer opens
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Live count query with debouncing
  const { data: liveCount } = useBeachCount(localFilters, isOpen);

  const updateLocalFilter = (updates: Partial<FilterState>) => {
    setLocalFilters(prev => ({ ...prev, ...updates }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      search: filters.search, // Keep search term
      organized: null,
      blueFlag: false,
      parking: 'any',
      amenities: [],
      sort: filters.sort,
      page: 1,
      nearMe: false,
    };
    setLocalFilters(resetFilters);
  };

  const handleClearAll = () => {
    const clearFilters: FilterState = {
      search: filters.search, // Keep search term
      organized: null,
      blueFlag: false,
      parking: 'any',
      amenities: [],
      sort: filters.sort,
      page: 1,
      nearMe: false,
    };
    setLocalFilters(clearFilters);
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = localFilters.amenities.includes(amenityId)
      ? localFilters.amenities.filter(id => id !== amenityId)
      : [...localFilters.amenities, amenityId];
    updateLocalFilter({ amenities: newAmenities });
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Filter amenities based on search
  const filteredAmenityGroups = useMemo(() => {
    if (!debouncedAmenitySearch) return amenityGroups;
    
    const filtered: Partial<typeof amenityGroups> = {};
    Object.entries(amenityGroups).forEach(([groupName, amenities]) => {
      const filteredAmenities = amenities.filter(amenity =>
        amenity.label.toLowerCase().includes(debouncedAmenitySearch.toLowerCase())
      );
      if (filteredAmenities.length > 0) {
        filtered[groupName as keyof typeof amenityGroups] = filteredAmenities;
      }
    });
    return filtered;
  }, [debouncedAmenitySearch]);

  // Calculate active filter count
  const activeFilterCount = [
    localFilters.organized !== null,
    localFilters.blueFlag,
    localFilters.parking !== 'any',
    localFilters.amenities.length > 0,
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
        {/* Sticky Header */}
        <SheetHeader className="pb-6 sticky top-0 bg-background z-10 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary" />
              Filters
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          </div>
          {/* Live result count */}
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {liveCount !== undefined ? `${liveCount} results` : 'Loading...'}
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-8 py-6">
          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Location 
            </h3>
            
            <div className="space-y-3">
              <Button
                ref={firstFocusableRef}
                variant={userLocation ? "default" : "outline"}
                onClick={onLocationRequest}
                disabled={isLoadingLocation}
                className="w-full justify-start min-h-[44px]"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isLoadingLocation ? "Getting location..." : 
                 userLocation ? "Using your location" : 
                 locationPermission === 'denied' ? "Permission denied" : "Use my location"}
              </Button>
              
              {locationPermission === 'denied' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLocationRequest}
                  className="w-full min-h-[44px]"
                >
                  Retry location access
                </Button>
              )}
              
              <div className="text-sm text-muted-foreground">
                {userLocation ? "Using your location" : 
                 locationPermission === 'denied' ? "Location off" : "Location off"}
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-6">
            <h3 className="font-semibold text-base">Quick Filters</h3>
            
            {/* Organized */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Organized
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={localFilters.organized === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateLocalFilter({ organized: null })}
                  className="text-xs min-h-[44px]"
                  aria-pressed={localFilters.organized === null}
                >
                  Both
                </Button>
                <Button
                  variant={localFilters.organized === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateLocalFilter({ organized: true })}
                  className="text-xs min-h-[44px]"
                  aria-pressed={localFilters.organized === true}
                >
                  Organized
                </Button>
                <Button
                  variant={localFilters.organized === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateLocalFilter({ organized: false })}
                  className="text-xs min-h-[44px]"
                  aria-pressed={localFilters.organized === false}
                >
                  Unorganized
                </Button>
              </div>
            </div>

            {/* Parking */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Parking
              </h4>
              <RadioGroup
                value={localFilters.parking}
                onValueChange={(value) => updateLocalFilter({ parking: value })}
              >
                {parkingOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`parking-${option.value}`} />
                    <Label htmlFor={`parking-${option.value}`} className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Blue Flag */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" />
                Blue Flag
              </h4>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="blue-flag"
                  checked={localFilters.blueFlag}
                  onCheckedChange={(checked) => updateLocalFilter({ blueFlag: !!checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="blue-flag" className="text-sm cursor-pointer">
                  Blue Flag certified beaches only
                </Label>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Amenities
            </h3>
            
            {/* Search amenities */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search amenities"
                value={amenitySearch}
                onChange={(e) => setAmenitySearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Amenity groups */}
            <div className="space-y-4">
              {Object.entries(filteredAmenityGroups).map(([groupName, amenities]) => {
                const selectedCount = amenities.filter(amenity => 
                  localFilters.amenities.includes(amenity.id)
                ).length;
                const isExpanded = expandedGroups[groupName] ?? true;
                
                return (
                  <Collapsible
                    key={groupName}
                    open={isExpanded}
                    onOpenChange={() => toggleGroup(groupName)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-0 h-auto font-medium"
                        aria-expanded={isExpanded}
                      >
                        <span className="flex items-center gap-2">
                          {groupName}
                          {selectedCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedCount}
                            </Badge>
                          )}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      {amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={amenity.id}
                            checked={localFilters.amenities.includes(amenity.id)}
                            onCheckedChange={() => toggleAmenity(amenity.id)}
                            className="h-4 w-4 rounded-none border-2 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white"
                          />
                          <Label htmlFor={amenity.id} className="text-sm cursor-pointer">
                            {amenity.label}
                          </Label>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <SheetFooter className="pt-6 border-t sticky bottom-0 bg-background pb-safe">
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

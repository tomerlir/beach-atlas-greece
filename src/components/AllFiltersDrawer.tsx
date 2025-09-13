import { useState, useEffect, useRef } from 'react';
import { MapPin, Sun, CheckCircle, Car, Flag, Waves, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterState } from '@/hooks/useUrlState';

interface AllFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  userLocation: GeolocationPosition | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
}

const amenityOptions = [
  { id: 'sunbeds', label: 'Sunbeds' },
  { id: 'umbrellas', label: 'Umbrellas' },
  { id: 'taverna', label: 'Taverna' },
  { id: 'water_sports', label: 'Water Sports' },
  { id: 'beach_bar', label: 'Beach Bar' },
  { id: 'family_friendly', label: 'Family Friendly' },
  { id: 'snorkeling', label: 'Snorkeling' },
  { id: 'photography', label: 'Photography' },
  { id: 'music', label: 'Music' },
  { id: 'hiking', label: 'Hiking' },
  { id: 'birdwatching', label: 'Birdwatching' },
  { id: 'boat_trips', label: 'Boat Trips' },
  { id: 'fishing', label: 'Fishing' },
];

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
}: AllFiltersDrawerProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

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
      radius: 25,
      sort: filters.sort,
      page: 1,
    };
    setLocalFilters(resetFilters);
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = localFilters.amenities.includes(amenityId)
      ? localFilters.amenities.filter(id => id !== amenityId)
      : [...localFilters.amenities, amenityId];
    updateLocalFilter({ amenities: newAmenities });
  };

  // Calculate active filter count
  const activeFilterCount = [
    localFilters.organized !== null,
    localFilters.blueFlag,
    localFilters.parking !== 'any',
    localFilters.amenities.length > 0,
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            All Filters
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          {/* Location & Radius */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Location & Radius
            </h3>
            
            <div className="space-y-3">
              <Button
                ref={firstFocusableRef}
                variant={userLocation ? "default" : "outline"}
                onClick={onLocationRequest}
                disabled={isLoadingLocation}
                className="w-full justify-start"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isLoadingLocation ? "Getting location..." : 
                 userLocation ? "Update my location" : "Use my location"}
              </Button>
              
              {userLocation && (
                <div className="space-y-2">
                  <Label htmlFor="radius">Search radius</Label>
                  <Select 
                    value={localFilters.radius.toString()} 
                    onValueChange={(value) => updateLocalFilter({ radius: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Amenities
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {amenityOptions.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={amenity.id}
                    checked={localFilters.amenities.includes(amenity.id)}
                    onCheckedChange={() => toggleAmenity(amenity.id)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor={amenity.id} className="text-sm cursor-pointer">
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Organized */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Organized
            </h3>
            <RadioGroup
              value={localFilters.organized === null ? 'both' : localFilters.organized.toString()}
              onValueChange={(value) => {
                if (value === 'both') {
                  updateLocalFilter({ organized: null });
                } else {
                  updateLocalFilter({ organized: value === 'true' });
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="organized-true" />
                <Label htmlFor="organized-true">Organized only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="organized-false" />
                <Label htmlFor="organized-false">Unorganized only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="organized-both" />
                <Label htmlFor="organized-both">Both</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Parking */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              Parking
            </h3>
            <RadioGroup
              value={localFilters.parking}
              onValueChange={(value) => updateLocalFilter({ parking: value })}
            >
              {parkingOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`parking-${option.value}`} />
                  <Label htmlFor={`parking-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Blue Flag */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Blue Flag
            </h3>
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

          {/* Wave Conditions (Optional) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Waves className="h-4 w-4 text-primary" />
              Wave Conditions
            </h3>
            <div className="text-sm text-muted-foreground">
              <p>Wave condition filtering is available but not yet implemented in the current data schema.</p>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-6 border-t">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
            >
              Apply {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

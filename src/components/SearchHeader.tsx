import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Flag, CheckCircle, Car, Sun, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterState } from '@/hooks/useUrlState';

interface SearchHeaderProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  userLocation: GeolocationPosition | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
  onOpenAllFilters: () => void;
}

const parkingOptions = [
  { value: 'any', label: 'Any parking' },
  { value: 'NONE', label: 'None' },
  { value: 'ROADSIDE', label: 'Roadside' },
  { value: 'SMALL_LOT', label: 'Small lot' },
  { value: 'LARGE_LOT', label: 'Large lot' },
];

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

export default function SearchHeader({
  filters,
  onFiltersChange,
  userLocation,
  onLocationRequest,
  isLoadingLocation,
  onOpenAllFilters,
}: SearchHeaderProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 250);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, filters.search, onFiltersChange]);

  // Update local input when URL search changes
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const toggleNearMe = () => {
    if (userLocation) {
      // Toggle distance sorting - if already sorting by distance, switch to name sorting
      onFiltersChange({ sort: filters.sort === 'distance' ? 'name' : 'distance', page: 1 });
    } else {
      // Request location permission
      onLocationRequest();
    }
  };

  const toggleBlueFlag = () => {
    onFiltersChange({ blueFlag: !filters.blueFlag, page: 1 });
  };

  const toggleOrganized = () => {
    if (filters.organized === null) {
      onFiltersChange({ organized: true, page: 1 });
    } else if (filters.organized === true) {
      onFiltersChange({ organized: false, page: 1 });
    } else {
      onFiltersChange({ organized: null, page: 1 });
    }
  };

  const handleParkingChange = (value: string) => {
    onFiltersChange({ parking: value, page: 1 });
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(id => id !== amenityId)
      : [...filters.amenities, amenityId];
    onFiltersChange({ amenities: newAmenities, page: 1 });
  };

  // Calculate active filter counts
  const activeFiltersCount = [
    filters.blueFlag,
    filters.organized !== null,
    filters.parking !== 'any',
    filters.amenities.length > 0,
  ].filter(Boolean).length;

  const isNearMeActive = userLocation && filters.sort === 'distance';

  return (
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

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-3">
          {/* Near Me Chip */}
          <Button
            variant={isNearMeActive ? "default" : "outline"}
            size="sm"
            onClick={toggleNearMe}
            disabled={isLoadingLocation}
            className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
            aria-pressed={isNearMeActive}
            aria-label={userLocation ? "Toggle distance sorting" : "Use my location"}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isLoadingLocation ? "Getting location..." : 
             isNearMeActive ? "Near me" : "Near me"}
          </Button>

          {/* Blue Flag Chip */}
          <Button
            variant={filters.blueFlag ? "default" : "outline"}
            size="sm"
            onClick={toggleBlueFlag}
            className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
            aria-pressed={filters.blueFlag}
            aria-label="Filter by Blue Flag certification"
          >
            <Flag className="h-4 w-4 mr-2" />
            Blue Flag
            {filters.blueFlag && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">1</Badge>}
          </Button>

          {/* Organized Chip */}
          <Button
            variant={filters.organized !== null ? "default" : "outline"}
            size="sm"
            onClick={toggleOrganized}
            className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
            aria-pressed={filters.organized !== null}
            aria-label="Filter by organized beaches"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Organized
            {filters.organized !== null && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">1</Badge>}
          </Button>

          {/* Parking Chip with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={filters.parking !== 'any' ? "default" : "outline"}
                size="sm"
                className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
                aria-expanded="false"
                aria-label="Filter by parking availability"
              >
                <Car className="h-4 w-4 mr-2" />
                Parking
                {filters.parking !== 'any' && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">1</Badge>}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="start">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Parking Options</h4>
                {parkingOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="parking"
                      value={option.value}
                      checked={filters.parking === option.value}
                      onChange={(e) => handleParkingChange(e.target.value)}
                      className="text-primary"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Amenities Chip with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={filters.amenities.length > 0 ? "default" : "outline"}
                size="sm"
                className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
                aria-expanded="false"
                aria-label="Filter by amenities"
              >
                <Sun className="h-4 w-4 mr-2" />
                Amenities
                {filters.amenities.length > 0 && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">{filters.amenities.length}</Badge>}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Amenities</h4>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {amenityOptions.map((amenity) => (
                    <label key={amenity.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* More Filters Chip */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAllFilters}
            className="h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
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
  );
}

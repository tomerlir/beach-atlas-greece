import { useState } from "react";
import { Search, MapPin, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Filters {
  search: string;
  organized: boolean | null;
  blueFlag: boolean;
  parking: string;
  amenities: string[];
  radius: number;
}

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  userLocation: GeolocationPosition | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
}

const amenityOptions = [
  { id: "sunbeds", label: "Sunbeds" },
  { id: "umbrellas", label: "Umbrellas" },
  { id: "taverna", label: "Taverna" },
  { id: "water_sports", label: "Water Sports" },
  { id: "beach_bar", label: "Beach Bar" },
  { id: "family_friendly", label: "Family Friendly" },
  { id: "snorkeling", label: "Snorkeling" },
  { id: "photography", label: "Photography" },
];

const SearchFilters = ({ 
  filters, 
  onFiltersChange, 
  userLocation, 
  onLocationRequest, 
  isLoadingLocation 
}: SearchFiltersProps) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const updateFilters = (updates: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(id => id !== amenityId)
      : [...filters.amenities, amenityId];
    updateFilters({ amenities: newAmenities });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      organized: null,
      blueFlag: false,
      parking: "",
      amenities: [],
      radius: 25
    });
  };

  const hasActiveFilters = filters.search || filters.organized !== null || filters.blueFlag || 
                          filters.parking || filters.amenities.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search beaches by name or location..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10 bg-white shadow-soft border-border focus:ring-primary"
        />
      </div>

      {/* Location Tools */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onLocationRequest}
          disabled={isLoadingLocation}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          {isLoadingLocation ? "Getting location..." : 
           userLocation ? "Update location" : "Use my location"}
        </Button>
        
        {userLocation && (
          <Select value={filters.radius.toString()} onValueChange={(value) => updateFilters({ radius: parseInt(value) })}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 km</SelectItem>
              <SelectItem value="10">10 km</SelectItem>
              <SelectItem value="25">25 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Filters Toggle */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && <span className="ml-1 text-primary">•</span>}
            </Button>
          </CollapsibleTrigger>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organized Toggle */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Beach Type</h4>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="organized"
                      checked={filters.organized === true}
                      onChange={() => updateFilters({ organized: true })}
                      className="text-primary"
                    />
                    <span className="text-sm">Organized</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="organized"
                      checked={filters.organized === false}
                      onChange={() => updateFilters({ organized: false })}
                      className="text-primary"
                    />
                    <span className="text-sm">Unorganized</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="organized"
                      checked={filters.organized === null}
                      onChange={() => updateFilters({ organized: null })}
                      className="text-primary"
                    />
                    <span className="text-sm">Both</span>
                  </label>
                </div>
              </div>

              {/* Blue Flag */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blue-flag"
                  checked={filters.blueFlag}
                  onCheckedChange={(checked) => updateFilters({ blueFlag: !!checked })}
                />
                <label htmlFor="blue-flag" className="text-sm font-medium cursor-pointer">
                  Blue Flag certified
                </label>
              </div>

              {/* Parking */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Parking</label>
                <Select value={filters.parking} onValueChange={(value) => updateFilters({ parking: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any parking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any parking</SelectItem>
                    <SelectItem value="ample">Ample parking</SelectItem>
                    <SelectItem value="limited">Limited parking</SelectItem>
                    <SelectItem value="none">No parking needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Amenities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {amenityOptions.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={filters.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <label htmlFor={amenity.id} className="text-sm cursor-pointer">
                        {amenity.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SearchFilters;
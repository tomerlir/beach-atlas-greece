import { useState } from "react";
import { 
  Search, 
  MapPin, 
  Filter, 
  X, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Car, 
  Sun, 
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getAllAmenities } from "@/lib/amenities";

interface Filters {
  search: string;
  organized: boolean | null;
  blueFlag: boolean;
  parking: string;
  amenities: string[];
}

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  userLocation: GeolocationPosition | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
}

// Get all amenities from centralized map
const amenityOptions = getAllAmenities();

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
      parking: "any",
      amenities: []
    });
  };

  const hasActiveFilters = filters.search || filters.organized !== null || filters.blueFlag || 
                          (filters.parking && filters.parking !== "any") || filters.amenities.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          placeholder="Search beaches by name or location..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-12 h-12 bg-card shadow-soft border-border focus:ring-primary text-base rounded-xl"
        />
      </div>

      {/* Location Tools */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={onLocationRequest}
          disabled={isLoadingLocation}
          className="flex items-center gap-3 h-12 px-6 rounded-xl border-2 hover:border-primary/50 transition-colors"
        >
          <MapPin className="h-5 w-5" />
          <span className="font-medium">
            {isLoadingLocation ? "Getting location..." : 
             userLocation ? "Update location" : "Use my location"}
          </span>
        </Button>
      </div>

      {/* Filters Toggle */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-3 h-12 px-6 rounded-xl border-2 hover:border-primary/50 transition-colors">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Advanced Filters</span>
              {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>}
            </Button>
          </CollapsibleTrigger>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-10 px-4 rounded-lg">
              <X className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-6">
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Organized Toggle */}
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Beach Type
                </h4>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="organized"
                      checked={filters.organized === true}
                      onChange={() => updateFilters({ organized: true })}
                      className="text-primary w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Organized</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="organized"
                      checked={filters.organized === false}
                      onChange={() => updateFilters({ organized: false })}
                      className="text-primary w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Unorganized</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="organized"
                      checked={filters.organized === null}
                      onChange={() => updateFilters({ organized: null })}
                      className="text-primary w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">Both</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Blue Flag */}
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Checkbox
                  id="blue-flag"
                  checked={filters.blueFlag}
                  onCheckedChange={(checked) => updateFilters({ blueFlag: !!checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="blue-flag" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  Blue Flag certified beaches only
                </label>
              </div>

              {/* Parking */}
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  Parking Availability
                </label>
                <Select value={filters.parking} onValueChange={(value) => updateFilters({ parking: value })}>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Select parking preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        Any parking
                      </div>
                    </SelectItem>
                    <SelectItem value="LARGE_LOT">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Large lot
                      </div>
                    </SelectItem>
                    <SelectItem value="SMALL_LOT">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        Small lot
                      </div>
                    </SelectItem>
                    <SelectItem value="ROADSIDE">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Roadside
                      </div>
                    </SelectItem>
                    <SelectItem value="NONE">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        No parking
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <Sun className="h-4 w-4 text-primary" />
                  Amenities
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenityOptions.map((amenity) => {
                    const IconComponent = amenity.icon;
                    return (
                      <div key={amenity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={amenity.id}
                          checked={filters.amenities.includes(amenity.id)}
                          onCheckedChange={() => toggleAmenity(amenity.id)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={amenity.id} className="text-sm cursor-pointer flex items-center gap-2 flex-1">
                          <IconComponent className={`h-4 w-4 ${amenity.color}`} />
                          <span className="font-medium">{amenity.label}</span>
                        </label>
                      </div>
                    );
                  })}
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
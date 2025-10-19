import React, { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { AMENITY_MAP, getAmenitiesByCategory, AmenityConfig } from "@/lib/amenities";
import { cn } from "@/lib/utils";

// Define the exact type for amenities with ID - matches what getAmenitiesByCategory returns
type AmenityWithId = {
  id: string;
} & AmenityConfig;

interface AmenitiesMultiselectProps {
  value: string[];
  onChange: (amenities: string[]) => void;
  className?: string;
}

const AmenitiesMultiselect: React.FC<AmenitiesMultiselectProps> = ({
  value = [],
  onChange,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["facilities", "services"]) // Expand most common categories by default
  );

  // Filter amenities based on search term
  const filteredAmenities = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        facilities: getAmenitiesByCategory("facilities"),
        safety: getAmenitiesByCategory("safety"),
        services: getAmenitiesByCategory("services"),
        activities: getAmenitiesByCategory("activities"),
      };
    }

    const searchLower = searchTerm.toLowerCase();
    const allAmenities = Object.entries(AMENITY_MAP).map(([id, config]) => ({ id, ...config }));

    const filtered = allAmenities.filter(
      (amenity) =>
        amenity.label.toLowerCase().includes(searchLower) ||
        amenity.id.toLowerCase().includes(searchLower)
    );

    // Group filtered amenities by category
    return {
      facilities: filtered.filter((a) => a.category === "facilities"),
      safety: filtered.filter((a) => a.category === "safety"),
      services: filtered.filter((a) => a.category === "services"),
      activities: filtered.filter((a) => a.category === "activities"),
    };
  }, [searchTerm]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAmenity = (amenityId: string) => {
    const newValue = value.includes(amenityId)
      ? value.filter((id) => id !== amenityId)
      : [...value, amenityId];
    onChange(newValue);
  };

  const removeAmenity = (amenityId: string) => {
    onChange(value.filter((id) => id !== amenityId));
  };

  const clearAll = () => {
    onChange([]);
  };

  const categoryLabels = {
    facilities: "Facilities",
    safety: "Safety",
    services: "Services",
    activities: "Activities",
  };

  const renderCategory = (category: keyof typeof categoryLabels, amenities: AmenityWithId[]) => {
    if (amenities.length === 0) return null;

    const isExpanded = expandedCategories.has(category);
    const selectedCount = amenities.filter((a) => value.includes(a.id)).length;

    return (
      <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto font-medium">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span>{categoryLabels[category]}</span>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCount}
                </Badge>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-6">
          {amenities.map((amenity) => {
            const Icon = amenity.icon;
            const isSelected = value.includes(amenity.id);

            return (
              <div
                key={amenity.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={amenity.id}
                  checked={isSelected}
                  onCheckedChange={() => toggleAmenity(amenity.id)}
                />
                <label
                  htmlFor={amenity.id}
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Icon className={cn("h-4 w-4", amenity.color)} />
                  <span className="text-sm">{amenity.label}</span>
                </label>
              </div>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search amenities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected amenities */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected ({value.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.map((amenityId) => {
              const amenity = AMENITY_MAP[amenityId];
              if (!amenity) return null;
              const Icon = amenity.icon;

              return (
                <Badge key={amenityId} variant="secondary" className="flex items-center gap-1 pr-1">
                  <Icon className={cn("h-3 w-3", amenity.color)} />
                  <span className="text-xs">{amenity.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAmenity(amenityId)}
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-1 border rounded-md">
        {renderCategory("facilities", filteredAmenities.facilities)}
        {renderCategory("safety", filteredAmenities.safety)}
        {renderCategory("services", filteredAmenities.services)}
        {renderCategory("activities", filteredAmenities.activities)}
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name="amenities" value={value.join(",")} />
    </div>
  );
};

export default AmenitiesMultiselect;

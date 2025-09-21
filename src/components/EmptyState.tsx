import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Waves, X, MapPin, Car } from "lucide-react";
import { FilterState } from "@/hooks/useUrlState";
import { useBeachSuggestions } from "@/hooks/useBeachSuggestions";
import BeachCard from "./BeachCard";

interface EmptyStateProps {
  filters: FilterState;
  userLocation: GeolocationPosition | null;
  onClearAllFilters: () => void;
  onTurnOffNearMe: () => void;
  onResetParking: () => void;
}

export default function EmptyState({
  filters,
  userLocation,
  onClearAllFilters,
  onTurnOffNearMe,
  onResetParking,
}: EmptyStateProps) {
  // Check if any filters are active (excluding nearMe as it's not a traditional filter)
  const hasActiveFilters = 
    filters.search ||
    filters.organized.length > 0 ||
    filters.blueFlag ||
    filters.parking.length > 0 ||
    filters.amenities.length > 0 ||
    filters.waveConditions.length > 0;

  // Check if near me is enabled
  const isNearMeEnabled = filters.nearMe;

  // Check if parking is filtered
  const isParkingFiltered = filters.parking.length > 0;

  // Get suggestions
  const { suggestions, isLoading: isLoadingSuggestions, hasSuggestions } = useBeachSuggestions({
    filters,
    userLocation,
    hasResults: false
  });

  // Determine subtext based on near me activation
  const suggestionsSubtext = filters.nearMe && userLocation
    ? "Based on your location and similar options nearby"
    : "Based on similar options nearby";

  return (
    <div role="status" aria-live="polite" className="py-16">
      {/* No Results Card */}
      <div className="text-center mb-12">
        <div className="bg-muted/30 border border-muted rounded-xl p-12 max-w-lg mx-auto">
          <Waves className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-xl font-medium mb-2">
            No beaches match your current filters
          </p>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria or clear some filters to see more results.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Clear all filters button - always show if any filters are active */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onClearAllFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear all
              </Button>
            )}
            
            {/* Turn off Near me button - only show if near me is enabled */}
            {isNearMeEnabled && (
              <Button
                variant="outline"
                onClick={onTurnOffNearMe}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Turn off Near me
              </Button>
            )}
            
            {/* Reset Parking button - only show if parking is filtered */}
            {isParkingFiltered && (
              <Button
                variant="outline"
                onClick={onResetParking}
                className="flex items-center gap-2"
              >
                <Car className="h-4 w-4" />
                Reset Parking
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Beaches Section */}
      {(hasSuggestions || isLoadingSuggestions) && (
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Suggested beaches</h2>
            <p className="text-muted-foreground">{suggestionsSubtext}</p>
          </div>

          {/* Suggestions Grid - Desktop */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {isLoadingSuggestions ? (
              // Skeleton cards while loading
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-xl h-80 shadow-soft"></div>
                </div>
              ))
            ) : (
              // Actual suggestion cards
              suggestions.map((beach) => (
                <BeachCard 
                  key={beach.id}
                  beach={beach} 
                  distance={beach.distance}
                />
              ))
            )}
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
              {isLoadingSuggestions ? (
                // Skeleton cards while loading
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-80 animate-pulse">
                    <div className="bg-muted rounded-xl h-80 shadow-soft"></div>
                  </div>
                ))
              ) : (
              // Actual suggestion cards
              suggestions.map((beach) => (
                <div key={beach.id} className="flex-shrink-0 w-80 snap-center">
                  <BeachCard 
                    beach={beach} 
                    distance={beach.distance}
                  />
                </div>
              ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

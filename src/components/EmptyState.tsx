import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Waves, X, MapPin, Car, AlertCircle } from "lucide-react";
import { FilterState } from "@/hooks/useUrlState";
import { useBeachSuggestions } from "@/hooks/useBeachSuggestions";
import BeachCard from "./BeachCard";
import { Link } from "react-router-dom";
import { generateAreaUrl } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface EmptyStateProps {
  filters: FilterState;
  userLocation: GeolocationPosition | null;
  onClearAllFilters: () => void;
  onTurnOffNearMe: () => void;
  onResetParking: () => void;
  onClearSearch?: () => void;
  onRemoveOrganized?: (value: string) => void;
  onRemoveParking?: (value: string) => void;
  onRemoveWaveCondition?: (value: string) => void;
  onRemoveAmenity?: (value: string) => void;
  onClearBlueFlag?: () => void;
  // Optional: when present, restrict suggestions to this area only
  areaName?: string;
}

export default function EmptyState({
  filters,
  userLocation,
  onClearAllFilters,
  onTurnOffNearMe,
  onResetParking,
  onClearSearch,
  onRemoveOrganized,
  onRemoveParking,
  onRemoveWaveCondition,
  onRemoveAmenity,
  onClearBlueFlag,
  areaName,
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
    hasResults: false,
    areaName
  });

  // Determine subtext based on near me activation
  const suggestionsSubtext = filters.nearMe && userLocation
    ? "Based on your location and similar options nearby"
    : "Based on similar options nearby";

  // Humanize enum-like values (e.g., LARGE_LOT -> "large lot")
  const humanize = (value: string) => value.replace(/_/g, " ").toLowerCase();

  // Render removable chips for each active filter (value-only labels)
  const chips: Array<{ key: string; label: string; onRemove?: () => void }> = [];
  if (filters.search) chips.push({ key: `search:${filters.search}`, label: `${filters.search}`.trim(), onRemove: onClearSearch });
  filters.organized.forEach((v) => chips.push({ key: `org:${v}`, label: humanize(v), onRemove: onRemoveOrganized ? () => onRemoveOrganized(v) : undefined }));
  if (filters.blueFlag) chips.push({ key: `blueflag`, label: `blue flag`, onRemove: onClearBlueFlag });
  filters.parking.forEach((v) => chips.push({ key: `parking:${v}`, label: humanize(v), onRemove: onRemoveParking ? () => onRemoveParking(v) : undefined }));
  filters.waveConditions.forEach((v) => chips.push({ key: `waves:${v}`, label: humanize(v), onRemove: onRemoveWaveCondition ? () => onRemoveWaveCondition(v) : undefined }));
  filters.amenities.forEach((v) => chips.push({ key: `amenity:${v}`, label: humanize(v), onRemove: onRemoveAmenity ? () => onRemoveAmenity(v) : undefined }));

  // Limit visible chips and show overflow summary
  const MAX_CHIPS = 5;
  const visibleChips = chips.slice(0, MAX_CHIPS);
  const overflowCount = Math.max(chips.length - MAX_CHIPS, 0);

  return (
    <div role="status" aria-live="polite">
      {/* Compact Inline Banner */}
      <div className="bg-muted/30 border border-muted rounded-xl p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-foreground font-medium">
              No beaches match your current filters
            </p>
            <p className="text-muted-foreground text-sm">
              Adjust using the quick toggles or{' '}
              <button
                type="button"
                onClick={onClearAllFilters}
                className="text-blue-600 underline underline-offset-2 hover:no-underline"
              >
                clear all
              </button>
              .
            </p>
          </div>
        </div>

        {/* Active filters overview */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleChips.map(({ key, label, onRemove }) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-8 pl-3 pr-2 py-0 rounded-full gap-1"
                onClick={onRemove}
                disabled={!onRemove}
                aria-label={onRemove ? `Remove ${label}` : undefined}
              >
                <span className="text-xs">{label}</span>
                {onRemove && <X className="h-3 w-3" />}
              </Button>
            ))}
            {overflowCount > 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-8 pl-3 pr-2 py-0 rounded-full gap-1"
                disabled
              >
                <span className="text-xs">+{overflowCount} more filters</span>
              </Button>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {isNearMeEnabled && (
            <Button
              variant="outline"
              onClick={onTurnOffNearMe}
              className="h-9"
            >
              <MapPin className="h-4 w-4" />
              Turn off Near me
            </Button>
          )}
          {isParkingFiltered && (
            <Button
              variant="outline"
              onClick={onResetParking}
              className="h-9"
            >
              <Car className="h-4 w-4" />
              Reset Parking
            </Button>
          )}
        </div>
      </div>

      {/* Suggested Beaches Section (carousel like MoreInArea) */}
      {(hasSuggestions || isLoadingSuggestions) && (
        <div className="max-w-7xl mx-auto mt-6">
          <h2 className="text-xl font-medium">
            {areaName ? `More beaches in ${areaName}` : "Suggested beaches"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{suggestionsSubtext}</p>

          <div className="mt-4">
            <Carousel className="relative">
              <CarouselContent>
                {isLoadingSuggestions
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <CarouselItem key={i} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
                        <div className="bg-muted rounded-xl h-56 shadow-soft animate-pulse"></div>
                      </CarouselItem>
                    ))
                  : (
                    <>
                      {suggestions.map((b) => (
                        <CarouselItem key={b.slug} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
                          <BeachCard beach={b as any} distance={b.distance} compact />
                        </CarouselItem>
                      ))}
                      <CarouselItem className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
                        {areaName ? (
                          <Link
                            to={generateAreaUrl(areaName)}
                            className="block h-full w-full border rounded-lg hover:bg-gray-50 transition-colors"
                            aria-label={`View all beaches in ${areaName}`}
                          >
                            <div className="flex h-full items-center justify-center p-4 text-center">
                              View all beaches in {areaName} →
                            </div>
                          </Link>
                        ) : (
                          <Link
                            to="/"
                            className="block h-full w-full border rounded-lg hover:bg-gray-50 transition-colors"
                            aria-label="View all beaches"
                          >
                            <div className="flex h-full items-center justify-center p-4 text-center">
                              View all beaches →
                            </div>
                          </Link>
                        )}
                      </CarouselItem>
                    </>
                  )}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </div>
        </div>
      )}
    </div>
  );
}

import { MapPin } from "lucide-react";
import { FilterState } from "@/hooks/useUrlState";
import { buildExplanation } from "@/lib/explanations/explanationEngine";
import { analytics } from "@/lib/analytics";
import { createResultsViewEvent } from "@/lib/analyticsEvents";
import { useEffect } from "react";

interface ResultsSummaryProps {
  resultCount: number;
  filters: FilterState;
  userLocation: GeolocationPosition | null;
  onClearAllFilters: () => void;
  isLoading?: boolean;
}

export default function ResultsSummary({
  resultCount,
  filters,
  userLocation,
  onClearAllFilters,
  isLoading = false,
}: ResultsSummaryProps) {
  // Track results view with query hash and search quality classification
  useEffect(() => {
    // Only track results_view if there's an actual search query
    if (!filters.search) {
      return;
    }

    const isRelaxed = resultCount > 0 && resultCount < 10; // Simple heuristic
    const queryHash =
      typeof window !== "undefined"
        ? sessionStorage.getItem("current_query_hash") || undefined
        : undefined;

    // Emit results_view only when there's a search
    analytics.event("results_view", createResultsViewEvent(resultCount, isRelaxed, queryHash));

    // Emit search_quality signals based on results
    if (resultCount === 0) {
      analytics.trackSearchQuality("empty");
    } else if (isRelaxed) {
      analytics.trackSearchQuality("relaxed");
    }
  }, [resultCount, filters.search]);

  // Do not render in EmptyState: that component already conveys the explanation
  if (!isLoading && resultCount === 0) {
    return null;
  }
  const hasActiveFilters =
    filters.search ||
    filters.location ||
    (filters.locations && filters.locations.length > 0) ||
    filters.organized.length > 0 ||
    filters.blueFlag ||
    filters.parking.length > 0 ||
    filters.amenities.length > 0 ||
    filters.waveConditions.length > 0 ||
    filters.type.length > 0;

  const explanation = buildExplanation({ filters, resultCount, userLocation });
  const explanationParts = explanation.primary.length > 0 ? explanation.primary : [];
  const hasExplanation = explanationParts.length > 0;

  // Generate a friendly result count message
  const getResultCountMessage = () => {
    if (isLoading) {
      return "Searching...";
    }

    if (resultCount === 0) {
      return "No beaches found";
    }

    if (resultCount === 1) {
      return "1 beach";
    }

    if (resultCount < 10) {
      return `${resultCount} beaches`;
    }

    if (resultCount < 50) {
      return `Over ${Math.floor(resultCount / 10) * 10} beaches`;
    }

    return `Over ${Math.floor(resultCount / 50) * 50}+ beaches`;
  };

  return (
    <div className="py-4">
      <div className="flex flex-row items-center justify-between gap-3">
        {/* Left side: Result count and explanation */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="text-muted-foreground min-w-0 flex-1">
            <div className="text-sm flex flex-col gap-1">
              <span
                className="font-medium text-foreground"
                aria-live="polite"
                aria-label={
                  hasExplanation
                    ? `${getResultCountMessage()}, ${explanation.fullText}`
                    : getResultCountMessage()
                }
              >
                {getResultCountMessage()}
                {hasExplanation && (
                  <span className="font-normal text-muted-foreground ml-1">
                    {explanationParts.join(", ")}
                    {explanation.secondaryCount > 0
                      ? `, and ${explanation.secondaryCount} more criteria`
                      : ""}
                  </span>
                )}
              </span>

              {/* Full explanation tooltip-like text on hover would go here */}
              {/* {hasExplanation && explanation.secondaryCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {explanation.fullText}
                                </span>
                            )} */}
            </div>
          </div>

          {userLocation && filters.nearMe && filters.sort?.startsWith("distance") && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full flex-shrink-0">
              <MapPin className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-primary">sorted by distance</span>
            </div>
          )}
        </div>

        {/* Right side: Clear all */}
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            className="text-secondary hover:text-secondary/80 underline text-sm flex-shrink-0 bg-transparent border-none cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

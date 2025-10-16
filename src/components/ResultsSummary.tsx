import { MapPin } from "lucide-react";
import { FilterState } from "@/hooks/useUrlState";
import { getAmenityLabel } from "@/lib/amenities";
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

const parkingLabels: Record<string, string> = {
  NONE: "no parking",
  ROADSIDE: "roadside parking",
  SMALL_LOT: "small parking lot",
  LARGE_LOT: "large parking lot",
};

const waveConditionLabels: Record<string, string> = {
  CALM: "calm waters",
  MODERATE: "moderate waves",
  WAVY: "wavy conditions",
  SURFABLE: "surfable waves",
};

const beachTypeLabels: Record<string, string> = {
  SANDY: "sandy",
  PEBBLY: "pebbly",
  MIXED: "mixed sand & pebbles",
  OTHER: "rocky",
};

// Helper function to capitalize first letter
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Capitalize each word in a location string, preserving hyphenated parts
const capitalizeLocation = (str: string): string => {
  return str
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-")
    )
    .join(" ");
};

// Helper function to format list with proper Oxford commas
const formatList = (items: string[], conjunction = "and"): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
};

// Exported pure function for testing explainable picks outside the component
export function generateResultsExplanation(
  filters: FilterState,
  resultCount: number,
  userLocation: GeolocationPosition | null
): string[] {
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

  const generateNaturalExplanation = () => {
    const parts: string[] = [];

    if (!hasActiveFilters && resultCount > 0) {
      return ["showing all available beaches"];
    }

    if (!hasActiveFilters && resultCount === 0) {
      return ["no beaches found"];
    }

    if (filters.search) {
      const searchTerm = capitalizeLocation(filters.search);
      parts.push(`in ${searchTerm}`);
    }

    if (filters.nearMe && userLocation) {
      if (filters.search) {
        parts[0] = `near ${capitalizeLocation(filters.search)}`;
      } else {
        parts.push("near your current location");
      }
    }

    if (filters.type.length > 0) {
      const types = filters.type.map((type) => beachTypeLabels[type] || type.toLowerCase());
      if (types.length === 1) {
        parts.push(`with ${types[0]} shores`);
      } else {
        parts.push(`with ${formatList(types)} shores`);
      }
    }

    if (filters.waveConditions.length > 0) {
      const conditions = filters.waveConditions.map(
        (condition) => waveConditionLabels[condition] || condition.toLowerCase()
      );
      if (conditions.length === 1) {
        parts.push(`featuring ${conditions[0]}`);
      } else {
        parts.push(`with ${formatList(conditions, "or")}`);
      }
    }

    if (filters.parking.length > 0) {
      const parkingTypes = filters.parking.map(
        (parking) => parkingLabels[parking] || parking.toLowerCase()
      );
      if (parkingTypes.includes("no parking")) {
        parts.push("no parking available");
      } else if (parkingTypes.length === 1) {
        parts.push(`with ${parkingTypes[0]}`);
      } else {
        parts.push(`with ${formatList(parkingTypes, "or")}`);
      }
    }

    if (filters.amenities.length > 0) {
      const amenityLabels = filters.amenities.map((amenity) => getAmenityLabel(amenity));
      const essentialAmenities = amenityLabels.filter((amenity) =>
        ["toilets", "showers", "lifeguard"].includes(amenity.toLowerCase())
      );
      const leisureAmenities = amenityLabels.filter((amenity) =>
        ["beach bar", "taverna", "food", "sunbeds", "umbrellas"].includes(amenity.toLowerCase())
      );
      const activityAmenities = amenityLabels.filter((amenity) =>
        ["snorkeling", "water sports", "fishing", "hiking", "cliff jumping", "boat trips"].includes(
          amenity.toLowerCase()
        )
      );

      if (essentialAmenities.length > 0) {
        parts.push(`with ${formatList(essentialAmenities)}`);
      }
      if (leisureAmenities.length > 0) {
        parts.push(`offering ${formatList(leisureAmenities)}`);
      }
      if (activityAmenities.length > 0) {
        parts.push(`perfect for ${formatList(activityAmenities)}`);
      }
      if (
        essentialAmenities.length === 0 &&
        leisureAmenities.length === 0 &&
        activityAmenities.length === 0
      ) {
        const firstThree = amenityLabels.slice(0, 3);
        parts.push(`with ${formatList(firstThree)}${amenityLabels.length > 3 ? " and more" : ""}`);
      }
    }

    if (filters.blueFlag) {
      parts.push("Blue Flag certified for quality");
    }

    if (filters.organized.length > 0) {
      const organizedTypes = filters.organized.map((org) =>
        org === "organized" ? "well-organized" : "natural and unspoiled"
      );
      if (organizedTypes.length === 1) {
        parts.push(organizedTypes[0]);
      } else {
        parts.push(`either ${formatList(organizedTypes, "or")}`);
      }
    }

    return parts;
  };

  const allParts = generateNaturalExplanation();
  if (allParts.length === 0) {
    return resultCount > 0 ? ["all beaches"] : ["no beaches"];
  }
  if (allParts.length <= 2) {
    return allParts;
  }

  const prioritizedParts = [...allParts];
  const locationIndex = prioritizedParts.findIndex(
    (part) => part.startsWith("in ") || part.startsWith("near ")
  );
  const typeIndex = prioritizedParts.findIndex((part) => part.includes("shores"));
  const optimized: string[] = [];

  if (locationIndex !== -1) {
    optimized.push(prioritizedParts[locationIndex]);
  }
  if (typeIndex !== -1 && typeIndex !== locationIndex) {
    optimized.push(prioritizedParts[typeIndex]);
  }

  const blueFlagIndex = prioritizedParts.findIndex((part) => part.includes("Blue Flag"));
  if (blueFlagIndex !== -1 && optimized.length < 3) {
    optimized.push(prioritizedParts[blueFlagIndex]);
  }
  const waveIndex = prioritizedParts.findIndex(
    (part) =>
      part.startsWith("featuring ") || part.startsWith("with calm") || part.startsWith("with wavy")
  );
  if (waveIndex !== -1 && optimized.length < 3) {
    optimized.push(prioritizedParts[waveIndex]);
  }
  for (let i = 0; i < prioritizedParts.length && optimized.length < 3; i++) {
    if (
      !optimized.includes(prioritizedParts[i]) &&
      i !== locationIndex &&
      i !== typeIndex &&
      i !== blueFlagIndex &&
      i !== waveIndex
    ) {
      optimized.push(prioritizedParts[i]);
    }
  }

  const remainingCount = allParts.length - optimized.length;
  if (remainingCount > 0) {
    return [...optimized, `and ${remainingCount} more criteria`];
  }
  return optimized;
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

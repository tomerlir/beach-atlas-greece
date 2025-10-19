import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Beach } from "@/types/beach";
import { FilterState } from "./useUrlState";
import { useDebounce } from "./useDebounce";

// Haversine distance calculation
const haversine = (coord1: [number, number], coord2: [number, number]): number => {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Count intersection between two arrays
const intersectCount = (arr1: string[], arr2: string[]): number => {
  return arr1.filter((item) => arr2.includes(item)).length;
};

interface SuggestionWithReason extends Beach {
  reason: string;
  distance?: number;
}

interface UseBeachSuggestionsProps {
  filters: FilterState;
  userLocation: GeolocationPosition | null;
  hasResults: boolean;
  // When provided, restrict suggestions to this area name
  areaName?: string;
}

export const useBeachSuggestions = ({
  filters,
  userLocation,
  hasResults,
  areaName,
}: UseBeachSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionWithReason[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Map<string, SuggestionWithReason[]>>(new Map());

  // Create cache key from filter state
  const cacheKey = useMemo(() => {
    const key = JSON.stringify({
      nearMe: filters.nearMe,
      organized: filters.organized,
      blueFlag: filters.blueFlag,
      amenities: [...filters.amenities].sort(),
      coords: userLocation ? [userLocation.coords.latitude, userLocation.coords.longitude] : null,
    });
    return key;
  }, [filters.nearMe, filters.organized, filters.blueFlag, filters.amenities, userLocation]);

  // Debounce the suggestions fetch
  const debouncedHasResults = useDebounce(hasResults, 250);

  // Fetch all active beaches for suggestions with selective fields
  const { data: allBeaches = [] } = useQuery({
    queryKey: ["beaches-suggestions", areaName || null],
    queryFn: async () => {
      const base = supabase.from("beaches").select("id, name, area, slug, organized, blue_flag, parking, amenities, photo_url, photo_source, latitude, longitude").eq("status", "ACTIVE").order("name");

      // If areaName provided, limit suggestions to that area at the source
      // Note: `area` is a string column containing the human-readable area name
      const { data, error } = await (areaName ? base.eq("area", areaName) : base);

      if (error) throw error;
      return data as Beach[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const generateSuggestions = useCallback(async () => {
    if (hasResults || !allBeaches.length) {
      setSuggestions([]);
      return;
    }

    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      setSuggestions(cacheRef.current.get(cacheKey)!);
      return;
    }

    setIsLoading(true);

    try {
      const suggestions: SuggestionWithReason[] = [];
      const added = new Set<string>();

      const coords: [number, number] | null = userLocation
        ? [userLocation.coords.latitude, userLocation.coords.longitude]
        : null;

      // Tier 1 — Nearby (only if nearMe && coords)
      if (filters.nearMe && coords) {
        const nearby = allBeaches.map((b) => ({
          ...b,
          _dist: haversine(coords, [b.latitude, b.longitude]),
        }));

        for (const b of nearby.sort((a, b) => a._dist - b._dist)) {
          if (!added.has(b.id) && suggestions.length < 3) {
            suggestions.push({
              ...b,
              reason: "Nearby",
              distance: b._dist,
            });
            added.add(b.id);
          }
        }
      }

      // Tier 2 — Similar setup (organized/type/amenity overlap)
      if (suggestions.length < 3) {
        const score = (b: Beach) => {
          let score = 0;

          // Organized match
          if (filters.organized.length > 0) {
            const beachOrganizedType = b.organized ? "organized" : "unorganized";
            score += filters.organized.includes(beachOrganizedType) ? 2 : 0;
          } else {
            score += 1; // Neutral score when no preference
          }

          // Blue Flag match
          if (filters.blueFlag) {
            score += b.blue_flag ? 2 : 0;
          } else {
            score += 1; // Neutral score when no preference
          }

          // Amenities overlap
          if (filters.amenities.length > 0) {
            score += intersectCount(filters.amenities, b.amenities);
          }

          return score;
        };

        const pool = allBeaches.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));

        for (const b of pool) {
          if (!added.has(b.id) && suggestions.length < 3) {
            let reason = "Popular pick";

            // Prioritize reasons that don't duplicate existing badges
            if (
              filters.amenities.length > 0 &&
              intersectCount(filters.amenities, b.amenities) >= 1
            ) {
              reason = "Similar amenities";
            } else if (filters.organized.length > 0) {
              const beachOrganizedType = b.organized ? "organized" : "unorganized";
              if (filters.organized.includes(beachOrganizedType)) {
                reason = "Similar setup";
              }
            } else if (b.blue_flag) {
              reason = "Blue Flag";
            } else if (b.organized) {
              reason = "Organized";
            }

            suggestions.push({
              ...b,
              reason,
            });
            added.add(b.id);
          }
        }
      }

      // Tier 3 — Quality fallback
      if (suggestions.length < 3) {
        const picks = allBeaches.sort((a, b) => {
          // Sort by blue flag first, then by name
          if (a.blue_flag !== b.blue_flag) {
            return b.blue_flag ? 1 : -1;
          }
          return a.name.localeCompare(b.name);
        });

        for (const b of picks) {
          if (!added.has(b.id) && suggestions.length < 3) {
            let reason = "Popular pick";

            // Only show reasons if they're not already shown as badges
            if (b.blue_flag) {
              reason = "Blue Flag";
            } else if (b.organized) {
              reason = "Organized";
            }

            suggestions.push({
              ...b,
              reason,
            });
            added.add(b.id);
          }
        }
      }

      // Cache the results
      cacheRef.current.set(cacheKey, suggestions);
      setSuggestions(suggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    allBeaches,
    hasResults,
    cacheKey,
    filters.amenities,
    filters.blueFlag,
    filters.nearMe,
    filters.organized,
    userLocation,
  ]);

  // Trigger suggestions when no results
  useEffect(() => {
    if (debouncedHasResults === false) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedHasResults, generateSuggestions]);

  return {
    suggestions,
    isLoading,
    hasSuggestions: suggestions.length > 0,
  };
};

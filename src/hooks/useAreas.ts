import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaWithBeachCount } from "@/types/area";
import { calculateDistance } from "./useGeolocation";

export const useAreas = () => {
  return useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("status", "ACTIVE")
        .order("name");

      if (error) throw error;
      return data as Area[];
    },
  });
};

export const useAreasWithBeachCount = () => {
  return useQuery({
    queryKey: ["areas-with-beach-count"],
    queryFn: async () => {
      // First get all areas
      const { data: areas, error: areasError } = await supabase
        .from("areas")
        .select("*")
        .eq("status", "ACTIVE")
        .order("name");

      if (areasError) throw areasError;

      // Then get beach counts for each area
      const areasWithCounts = await Promise.all(
        areas.map(async (area) => {
          const { count, error: countError } = await supabase
            .from("beaches")
            .select("*", { count: "exact", head: true })
            .eq("area_id", area.id)
            .eq("status", "ACTIVE");

          if (countError) {
            console.error(`Error counting beaches for area ${area.name}:`, countError);
            return { ...area, beach_count: 0 };
          }

          return { ...area, beach_count: count || 0 };
        })
      );

      return areasWithCounts as AreaWithBeachCount[];
    },
  });
};

export const useAreaBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["area", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("slug", slug)
        .eq("status", "ACTIVE")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw error;
      }

      return data as Area;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry for "not found" errors
      if (error && typeof error === "object" && "code" in error && error.code === "PGRST116") {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook that provides optimistic loading by checking cached data first
export const useAreaBySlugOptimistic = (slug: string) => {
  const queryClient = useQueryClient();

  // Check if we have cached data for this area
  const cachedData = queryClient.getQueryData<Area>(["area", slug]);

  const query = useAreaBySlug(slug);

  return {
    ...query,
    // If we have cached data, show it immediately and don't show loading
    data: cachedData || query.data,
    isLoading: cachedData ? false : query.isLoading,
    // Only show error if we don't have cached data
    error: cachedData ? null : query.error,
  };
};

export interface AreaCentroid extends Area {
  centroid_latitude: number | null;
  centroid_longitude: number | null;
}

// Compute approximate centroid for each area based on its beaches' coordinates
export const useAreaCentroids = () => {
  return useQuery({
    queryKey: ["area-centroids"],
    queryFn: async (): Promise<AreaCentroid[]> => {
      // get active areas
      const { data: areas, error: areasError } = await supabase
        .from("areas")
        .select("*")
        .eq("status", "ACTIVE");
      if (areasError) throw areasError;

      // for each area, fetch minimal coords of its beaches and compute centroid
      const results = await Promise.all(
        (areas as Area[]).map(async (area) => {
          const { data: coords, error: beachesError } = await supabase
            .from("beaches")
            .select("latitude,longitude")
            .eq("status", "ACTIVE")
            .eq("area_id", area.id);
          if (beachesError) {
            return { ...area, centroid_latitude: null, centroid_longitude: null } as AreaCentroid;
          }
          if (!coords || coords.length === 0) {
            return { ...area, centroid_latitude: null, centroid_longitude: null } as AreaCentroid;
          }
          const sum = coords.reduce(
            (acc, cur) => ({ lat: acc.lat + cur.latitude, lon: acc.lon + cur.longitude }),
            { lat: 0, lon: 0 }
          );
          const centroid_latitude = sum.lat / coords.length;
          const centroid_longitude = sum.lon / coords.length;
          return { ...area, centroid_latitude, centroid_longitude } as AreaCentroid;
        })
      );

      return results;
    },
  });
};

export const useNearbyAreas = (currentAreaId: string | undefined, maxResults: number = 6) => {
  const { data: centroids = [], isLoading, error } = useAreaCentroids();

  const nearby = useMemo(() => {
    if (!currentAreaId) return [] as { area: AreaCentroid; distanceKm: number }[];
    const current = centroids.find((a) => a.id === currentAreaId);
    if (!current || current.centroid_latitude == null || current.centroid_longitude == null)
      return [];

    return centroids
      .filter(
        (a) => a.id !== currentAreaId && a.centroid_latitude != null && a.centroid_longitude != null
      )
      .map((a) => ({
        area: a,
        distanceKm: calculateDistance(
          current.centroid_latitude as number,
          current.centroid_longitude as number,
          a.centroid_latitude as number,
          a.centroid_longitude as number
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, maxResults);
  }, [centroids, currentAreaId, maxResults]);

  return { nearby, isLoading, error };
};

import { useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PrefetchOptions {
  delay?: number;
  preloadImages?: boolean;
  preloadData?: boolean;
}

export const useAdvancedPrefetch = (options: PrefetchOptions = {}) => {
  const { delay = 100, preloadImages = true, preloadData = true } = options;
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedUrls = useRef<Set<string>>(new Set());
  const prefetchedImages = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Prefetch beach data
  const prefetchBeachData = useCallback(
    async (slug: string) => {
      if (!preloadData) return;

      try {
        // Prefetch the beach data using React Query
        await queryClient.prefetchQuery({
          queryKey: ["beach", slug],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("beaches")
              .select("*")
              .eq("slug", slug)
              .eq("status", "ACTIVE")
              .single();

            if (error) {
              console.error("Beach prefetch error:", error);
              throw error;
            }

            return data;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      } catch (error) {
        console.warn("Failed to prefetch beach data:", error);
      }
    },
    [queryClient, preloadData]
  );

  // Prefetch image
  const prefetchImage = useCallback(
    (imageUrl: string) => {
      if (!preloadImages || !imageUrl || prefetchedImages.current.has(imageUrl)) {
        return;
      }

      const img = new Image();
      img.onload = () => {
        prefetchedImages.current.add(imageUrl);
      };
      img.onerror = () => {
        console.warn("Failed to prefetch image:", imageUrl);
      };
      img.src = imageUrl;
    },
    [preloadImages]
  );

  // Main prefetch function
  const prefetch = useCallback(
    (url: string) => {
      // Don't prefetch if already prefetched
      if (prefetchedUrls.current.has(url)) {
        return;
      }

      // Clear any existing timeout
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }

      // Set a new timeout for prefetching
      prefetchTimeoutRef.current = setTimeout(async () => {
        try {
          // Extract beach name from URL (format: /area/beach-name)
          const urlParts = url.split("/").filter(Boolean);
          if (urlParts.length < 2) return;

          const beachName = urlParts[urlParts.length - 1]; // Last part is the beach name
          if (!beachName) return;

          // Prefetch beach data
          await prefetchBeachData(beachName);

          // Prefetch the page using link prefetch
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = url;
          link.as = "document";
          document.head.appendChild(link);

          // Mark as prefetched
          prefetchedUrls.current.add(url);

          // Clean up the link element after a short delay
          setTimeout(() => {
            if (document.head.contains(link)) {
              document.head.removeChild(link);
            }
          }, 1000);
        } catch (error) {
          console.warn("Prefetch failed:", error);
        }
      }, delay);
    },
    [delay, prefetchBeachData]
  );

  // Prefetch with image
  const prefetchWithImage = useCallback(
    (url: string, imageUrl?: string) => {
      prefetch(url);
      if (imageUrl) {
        prefetchImage(imageUrl);
      }
    },
    [prefetch, prefetchImage]
  );

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Capture ref values at effect time to avoid stale closure issues
    const currentPrefetchedUrls = prefetchedUrls.current;
    const currentPrefetchedImages = prefetchedImages.current;
    const currentPrefetchTimeout = prefetchTimeoutRef.current;

    return () => {
      // Clear any active prefetch timeout
      if (currentPrefetchTimeout) {
        clearTimeout(currentPrefetchTimeout);
      }

      // Clear all prefetched data to prevent memory leaks
      currentPrefetchedUrls.clear();
      currentPrefetchedImages.clear();
    };
  }, []);

  return {
    prefetch,
    prefetchWithImage,
    prefetchImage,
    cancelPrefetch,
    isPrefetched: (url: string) => prefetchedUrls.current.has(url),
    isImagePrefetched: (url: string) => prefetchedImages.current.has(url),
  };
};

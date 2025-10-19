import { useCallback, useRef, useEffect } from "react";

interface ImagePreloadOptions {
  priority?: boolean;
  quality?: number;
  width?: number;
  height?: number;
}

interface PreloadResult {
  success: boolean;
  url: string;
  loadTime: number;
}

// Interface for objects that have a photo_url property (used by preloadVisibleBeachImages)
interface BeachWithPhoto {
  photo_url: string | null;
}

export const useImagePreloader = () => {
  const preloadedImages = useRef<Map<string, PreloadResult>>(new Map());
  const loadingImages = useRef<Set<string>>(new Set());
  const preloadQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);
  const activeIntervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
  const activeRequests = useRef<Map<string, AbortController>>(new Map());
  const concurrencyLimit = useRef(3);
  const activeLoads = useRef(0);
  const networkInfo = useRef<{ effectiveType?: string; downlink?: number } | null>(null);

  // Adaptive concurrency based on network conditions
  useEffect(() => {
    const updateConcurrency = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        networkInfo.current = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink
        };

        // Adjust concurrency based on network speed
        if (connection.effectiveType === '4g' && connection.downlink > 2) {
          concurrencyLimit.current = 6; // Fast connection
        } else if (connection.effectiveType === '3g' || connection.downlink < 1) {
          concurrencyLimit.current = 2; // Slow connection
        } else {
          concurrencyLimit.current = 3; // Default
        }
      }
    };

    updateConcurrency();
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConcurrency);
      return () => connection.removeEventListener('change', updateConcurrency);
    }
  }, []);

  // Generate optimized image URL (same logic as OptimizedImage)
  const getOptimizedImageUrl = useCallback(
    (src: string, width: number, height: number, quality: number = 80): string => {
      // If it's already a placeholder or optimized URL, return as is
      if (src.includes("placehold.co") || src.includes("res.cloudinary.com")) {
        return src;
      }

      // For Unsplash images, use their optimization API
      if (src.includes("unsplash.com")) {
        const url = new URL(src);
        url.searchParams.set("w", width.toString());
        url.searchParams.set("h", height.toString());
        url.searchParams.set("q", quality.toString());
        url.searchParams.set("fm", "webp");
        return url.toString();
      }

      return src;
    },
    []
  );

  // Preload a single image with concurrency control
  const preloadImage = useCallback(
    (src: string, options: ImagePreloadOptions = {}): Promise<PreloadResult> => {
      return new Promise((resolve) => {
        const { priority = false, quality = 80, width = 400, height = 225 } = options;

        // Check if already preloaded
        if (preloadedImages.current.has(src)) {
          resolve(preloadedImages.current.get(src)!);
          return;
        }

        // Check if currently loading
        if (loadingImages.current.has(src)) {
          // Wait for the existing load to complete with proper cleanup
          const checkInterval = setInterval(() => {
            if (preloadedImages.current.has(src)) {
              clearInterval(checkInterval);
              activeIntervals.current.delete(checkInterval);
              resolve(preloadedImages.current.get(src)!);
            }
          }, 50);
          activeIntervals.current.add(checkInterval);

          // Set a timeout to prevent infinite waiting
          const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            activeIntervals.current.delete(checkInterval);
            activeTimeouts.current.delete(timeout);
            resolve({
              success: false,
              url: src,
              loadTime: 0,
            });
          }, 10000); // 10 second timeout
          activeTimeouts.current.add(timeout);

          // Return early to avoid duplicate processing
          return;
        }

        // Check concurrency limit
        if (activeLoads.current >= concurrencyLimit.current) {
          // Queue the request for later processing
          preloadQueue.current.push(src);
          resolve({
            success: false,
            url: src,
            loadTime: 0,
          });
          return;
        }

        const startTime = Date.now();
        loadingImages.current.add(src);
        activeLoads.current++;

        // Create abort controller for this request
        const abortController = new AbortController();
        activeRequests.current.set(src, abortController);

        const optimizedSrc = getOptimizedImageUrl(src, width, height, quality);
        const img = new Image();

        // Check if request was aborted before setting up handlers
        if (abortController.signal.aborted) {
          loadingImages.current.delete(src);
          activeLoads.current--;
          activeRequests.current.delete(src);
          resolve({
            success: false,
            url: src,
            loadTime: 0,
          });
          return;
        }

        img.onload = () => {
          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }

          const loadTime = Date.now() - startTime;
          const result: PreloadResult = {
            success: true,
            url: optimizedSrc,
            loadTime,
          };

          preloadedImages.current.set(src, result);
          loadingImages.current.delete(src);
          activeLoads.current--;
          activeRequests.current.delete(src);

          if (process.env.NODE_ENV === "development") {
            console.warn(`Image preloaded: ${src} in ${loadTime}ms`);
          }

          resolve(result);
        };

        img.onerror = () => {
          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }

          const loadTime = Date.now() - startTime;
          const result: PreloadResult = {
            success: false,
            url: src,
            loadTime,
          };

          preloadedImages.current.set(src, result);
          loadingImages.current.delete(src);
          activeLoads.current--;
          activeRequests.current.delete(src);

          if (process.env.NODE_ENV === "development") {
            console.warn(`Image preload failed: ${src}`);
          }

          resolve(result);
        };

        // Set priority loading
        if (priority) {
          img.fetchPriority = "high";
        }

        img.src = optimizedSrc;
      });
    },
    [getOptimizedImageUrl]
  );

  // Process preload queue with concurrency control
  const processQueue = useCallback(async () => {
    if (isProcessing.current || preloadQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    while (preloadQueue.current.length > 0 && activeLoads.current < concurrencyLimit.current) {
      const availableSlots = concurrencyLimit.current - activeLoads.current;
      const batch = preloadQueue.current.splice(0, availableSlots);

      await Promise.allSettled(batch.map((src) => preloadImage(src)));

      // Small delay between batches to avoid overwhelming the browser
      if (preloadQueue.current.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    isProcessing.current = false;
  }, [preloadImage]);

  // Add images to preload queue
  const queueImages = useCallback(
    (urls: string[]) => {
      const newUrls = urls.filter(
        (url) =>
          !preloadedImages.current.has(url) &&
          !loadingImages.current.has(url) &&
          !preloadQueue.current.includes(url)
      );

      preloadQueue.current.push(...newUrls);
      processQueue();
    },
    [processQueue]
  );

  // Preload multiple images with priority
  const preloadImages = useCallback(
    async (urls: string[], _options: ImagePreloadOptions = {}): Promise<PreloadResult[]> => {
      const results = await Promise.allSettled(urls.map((url) => preloadImage(url, _options)));

      return results.map((result) =>
        result.status === "fulfilled"
          ? result.value
          : {
              success: false,
              url: "",
              loadTime: 0,
            }
      );
    },
    [preloadImage]
  );

  // Preload images for visible beach cards
  const preloadVisibleBeachImages = useCallback(
    (beaches: BeachWithPhoto[]) => {
      const imageUrls = beaches.filter((beach) => beach.photo_url).map((beach) => beach.photo_url!);

      if (imageUrls.length > 0) {
        queueImages(imageUrls);
      }
    },
    [queueImages]
  );

  // Check if image is preloaded
  const isPreloaded = useCallback((src: string): boolean => {
    return preloadedImages.current.has(src);
  }, []);

  // Get preload result
  const getPreloadResult = useCallback((src: string): PreloadResult | undefined => {
    return preloadedImages.current.get(src);
  }, []);

  // Clear preloaded images (for memory management)
  const clearPreloadedImages = useCallback(() => {
    // Abort all active requests
    activeRequests.current.forEach((controller) => controller.abort());
    activeRequests.current.clear();

    // Clear all active intervals and timeouts
    activeIntervals.current.forEach((interval) => clearInterval(interval));
    activeTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    activeIntervals.current.clear();
    activeTimeouts.current.clear();

    // Reset concurrency tracking
    activeLoads.current = 0;

    // Clear image data
    preloadedImages.current.clear();
    loadingImages.current.clear();
    preloadQueue.current = [];
  }, []);

  // Periodic cleanup to prevent memory leaks
  const performPeriodicCleanup = useCallback(() => {
    // Clean up stale intervals and timeouts
    // Clean up intervals that have been running too long
    const staleIntervals = Array.from(activeIntervals.current).filter((_interval) => {
      // This is a simplified check - in a real implementation, you'd track creation time
      return true; // For now, clean up all intervals periodically
    });

    staleIntervals.forEach((interval) => {
      clearInterval(interval);
      activeIntervals.current.delete(interval);
    });

    // Clean up timeouts that have been running too long
    const staleTimeouts = Array.from(activeTimeouts.current).filter((_timeout) => {
      return true; // For now, clean up all timeouts periodically
    });

    staleTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
      activeTimeouts.current.delete(timeout);
    });

    // Limit the size of preloaded images cache to prevent memory bloat
    if (preloadedImages.current.size > 100) {
      const entries = Array.from(preloadedImages.current.entries());
      const toKeep = entries.slice(-50); // Keep only the last 50 entries
      preloadedImages.current.clear();
      toKeep.forEach(([key, value]) => {
        preloadedImages.current.set(key, value);
      });
    }
  }, []);

  // Periodic cleanup effect to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      performPeriodicCleanup();
    }, 30000); // Run cleanup every 30 seconds

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [performPeriodicCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    // Capture current refs to avoid stale closure issues
    const currentRequests = activeRequests.current;
    const currentIntervals = activeIntervals.current;
    const currentTimeouts = activeTimeouts.current;

    return () => {
      // Abort all active requests
      currentRequests.forEach((controller) => controller.abort());
      currentRequests.clear();

      // Clear all active intervals and timeouts immediately
      currentIntervals.forEach((interval) => {
        clearInterval(interval);
      });
      currentTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      currentIntervals.clear();
      currentTimeouts.clear();

      // Reset concurrency tracking
      activeLoads.current = 0;

      // Clear all other data
      clearPreloadedImages();
    };
  }, [clearPreloadedImages]);

  return {
    preloadImage,
    preloadImages,
    queueImages,
    preloadVisibleBeachImages,
    isPreloaded,
    getPreloadResult,
    clearPreloadedImages,
    performPeriodicCleanup,
    preloadedCount: preloadedImages.current.size,
    loadingCount: loadingImages.current.size,
    queueCount: preloadQueue.current.length,
  };
};

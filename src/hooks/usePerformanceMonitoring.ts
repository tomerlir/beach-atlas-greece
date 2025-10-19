import { useEffect, useCallback, useMemo } from "react";

interface PerformanceMetrics {
  imageLoadTimes: Map<string, number>;
  totalImagesLoaded: number;
  failedImageLoads: number;
  averageLoadTime: number;
}

// Interface for layout shift entries with specific properties
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export const usePerformanceMonitoring = () => {
  const metrics: PerformanceMetrics = useMemo(
    () => ({
      imageLoadTimes: new Map(),
      totalImagesLoaded: 0,
      failedImageLoads: 0,
      averageLoadTime: 0,
    }),
    []
  );

  // Track image load performance
  const trackImageLoad = useCallback(
    (src: string, loadTime: number) => {
      metrics.imageLoadTimes.set(src, loadTime);
      metrics.totalImagesLoaded++;

      // Calculate average load time
      const times = Array.from(metrics.imageLoadTimes.values());
      metrics.averageLoadTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      // Log performance data in development
      if (process.env.NODE_ENV === "development") {
        console.warn(`Image loaded: ${src} in ${loadTime}ms`);
        console.warn(`Average load time: ${metrics.averageLoadTime.toFixed(2)}ms`);
      }
    },
    [metrics]
  );

  // Track failed image loads
  const trackImageError = useCallback(
    (src: string) => {
      metrics.failedImageLoads++;

      if (process.env.NODE_ENV === "development") {
        console.warn(`Image failed to load: ${src}`);
      }
    },
    [metrics]
  );

  // Monitor Core Web Vitals
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Monitor Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (process.env.NODE_ENV === "development") {
        console.warn("LCP:", lastEntry.startTime);
      }
    });

    try {
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (error) {
      // LCP not supported in this browser
      if (process.env.NODE_ENV === "development") {
        console.warn("LCP monitoring not supported:", error);
      }
    }

    // Monitor Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Type guard to check if entry is a layout shift entry
        if (entry.entryType === "layout-shift" && "hadRecentInput" in entry && "value" in entry) {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("CLS:", clsValue);
      }
    });

    try {
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      // CLS not supported in this browser
      if (process.env.NODE_ENV === "development") {
        console.warn("CLS monitoring not supported:", error);
      }
    }

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return {
      totalImages: metrics.totalImagesLoaded,
      failedImages: metrics.failedImageLoads,
      averageLoadTime: metrics.averageLoadTime,
      successRate:
        metrics.totalImagesLoaded > 0
          ? ((metrics.totalImagesLoaded - metrics.failedImageLoads) / metrics.totalImagesLoaded) *
            100
          : 100,
    };
  }, [metrics]);

  return {
    trackImageLoad,
    trackImageError,
    getPerformanceReport,
  };
};

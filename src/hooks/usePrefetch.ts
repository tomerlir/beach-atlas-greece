import { useCallback, useRef } from 'react';

interface PrefetchOptions {
  delay?: number;
}

export const usePrefetch = (options: PrefetchOptions = {}) => {
  const { delay = 100 } = options;
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedUrls = useRef<Set<string>>(new Set());

  const prefetch = useCallback((url: string) => {
    // Don't prefetch if already prefetched
    if (prefetchedUrls.current.has(url)) {
      return;
    }

    // Clear any existing timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Set a new timeout for prefetching
    prefetchTimeoutRef.current = setTimeout(() => {
      // Create a link element for prefetching
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      
      // Add to document head
      document.head.appendChild(link);
      
      // Mark as prefetched
      prefetchedUrls.current.add(url);
      
      // Clean up the link element after a short delay
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 1000);
    }, delay);
  }, [delay]);

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  return { prefetch, cancelPrefetch };
};

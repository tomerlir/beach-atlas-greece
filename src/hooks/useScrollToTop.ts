import { useEffect } from 'react';

/**
 * Custom hook that scrolls to the top of the page when dependencies change.
 * This is useful for ensuring pages start at the top when navigating or when
 * specific conditions are met.
 * 
 * @param dependencies - Array of dependencies to watch for changes
 * @param options - Configuration options for scroll behavior
 */
export const useScrollToTop = (
  dependencies: React.DependencyList = [],
  options: {
    immediate?: boolean;
    smooth?: boolean;
    delay?: number;
  } = {}
) => {
  const { immediate = true, smooth = false, delay = 0 } = options;

  useEffect(() => {
    const scrollToTop = () => {
      // Multiple methods for maximum compatibility, especially on mobile Safari
      if (smooth) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } else {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    if (immediate) {
      // Use requestAnimationFrame to ensure DOM is ready, then scroll once
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(scrollToTop);
      }, delay);
      return () => clearTimeout(timeoutId);
    }
  }, dependencies);
};

/**
 * Hook that scrolls to top immediately when called.
 * Useful for manual scroll-to-top functionality.
 */
export const useScrollToTopOnMount = (smooth = false) => {
  useScrollToTop([], { immediate: true, smooth });
};

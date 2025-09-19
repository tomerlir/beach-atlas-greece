import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that scrolls to the top of the page when the route changes.
 * This is essential for single-page applications to ensure users start at the top
 * of each new page, especially important on mobile Safari where scroll position
 * can be preserved incorrectly.
 * 
 * Features:
 * - Immediate scroll to top on route change
 * - Handles mobile Safari scroll restoration issues
 * - Uses both window.scrollTo and document.documentElement.scrollTop for maximum compatibility
 * - Includes a small delay to ensure DOM is ready on slower devices
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      // Multiple methods for maximum compatibility, especially on mobile Safari
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Use requestAnimationFrame to ensure DOM is ready, then scroll once
    requestAnimationFrame(() => {
      scrollToTop();
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

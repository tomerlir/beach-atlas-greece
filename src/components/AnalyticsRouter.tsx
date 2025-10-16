import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export default function AnalyticsRouter() {
  const location = useLocation();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Skip tracking for admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    // Skip initial load since it's already tracked by analytics.init()
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Track pageview for SPA navigation (route changes)
    analytics.trackPageview(location.pathname);
  }, [location.pathname]);

  return null;
}

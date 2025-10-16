import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export default function AnalyticsRouter() {
  const location = useLocation();

  useEffect(() => {
    // Skip tracking for admin routes
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    // Track pageview on route change
    analytics.trackPageview(location.pathname);
    
    // Update context with current route
    analytics.setContext({ route: location.pathname });
  }, [location.pathname]);

  return null;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export default function AnalyticsRouter() {
  const location = useLocation();

  useEffect(() => {
    // Track pageview on route change
    analytics.trackPageview(location.pathname);
    
    // Update context with current route
    analytics.setContext({ route: location.pathname });
  }, [location.pathname]);

  return null;
}

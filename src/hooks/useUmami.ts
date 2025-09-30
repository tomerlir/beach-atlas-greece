import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

export function useUmamiPageviews() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    analytics.pageview(pathname + search, document.title);
  }, [pathname, search]);
}



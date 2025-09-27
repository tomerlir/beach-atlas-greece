import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook to manage navigation state and provide reliable back navigation
 * This helps solve mobile browser issues with document.referrer and history management
 */
export const useNavigationState = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Store the current page as the navigation source
   * This should be called when navigating TO a page (like beach details)
   */
  const storeNavigationSource = useCallback(() => {
    try {
      const currentPath = location.pathname;
      sessionStorage.setItem('beach-navigation-source', currentPath);
    } catch (error) {
      console.warn('Session storage not available:', error);
    }
  }, [location.pathname]);

  /**
   * Navigate back to the stored source or fallback to a default location
   * This should be called when navigating FROM a page (like beach details back button)
   */
  const navigateBack = useCallback((fallbackPath: string = '/') => {
    try {
      const navigationSource = sessionStorage.getItem('beach-navigation-source');
      if (navigationSource) {
        // Clear the stored source after using it
        sessionStorage.removeItem('beach-navigation-source');
        navigate(navigationSource);
        return;
      }
    } catch (error) {
      console.warn('Session storage not available:', error);
    }
    
    // Fallback to provided path
    navigate(fallbackPath);
  }, [navigate]);

  /**
   * Clear any stored navigation source
   * Useful for cleanup or when navigation state should be reset
   */
  const clearNavigationSource = useCallback(() => {
    try {
      sessionStorage.removeItem('beach-navigation-source');
    } catch (error) {
      console.warn('Session storage not available:', error);
    }
  }, []);

  return {
    storeNavigationSource,
    navigateBack,
    clearNavigationSource,
  };
};

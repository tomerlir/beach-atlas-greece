import { useState, useCallback, useEffect } from 'react';

interface LocationState {
  lat: number | null;
  lng: number | null;
  permission: 'granted' | 'denied' | 'prompt' | null;
}

const LOCATION_STORAGE_KEY = 'beach-atlas-location';

export const useLocationState = () => {
  const [locationState, setLocationState] = useState<LocationState>(() => {
    // Try to restore from localStorage
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          permission: parsed.permission || null,
        };
      }
    } catch (error) {
      console.warn('Failed to restore location from localStorage:', error);
    }
    
    return {
      lat: null,
      lng: null,
      permission: null,
    };
  });

  const updateLocation = useCallback((lat: number, lng: number, permission: 'granted' | 'denied') => {
    const newState = { lat, lng, permission };
    setLocationState(newState);
    
    // Persist to localStorage
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save location to localStorage:', error);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState({ lat: null, lng: null, permission: null });
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear location from localStorage:', error);
    }
  }, []);

  return {
    location: locationState.lat && locationState.lng ? { lat: locationState.lat, lng: locationState.lng } : null,
    permission: locationState.permission,
    updateLocation,
    clearLocation,
  };
};

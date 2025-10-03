import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/lib/analytics';

interface GeolocationState {
  location: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: false,
    error: null,
    permission: null,
  });
  const { toast } = useToast();
  
  // Add refs for request cancellation and debouncing
  const currentWatchId = useRef<number | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const isRequestActive = useRef(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      setState(prev => ({ ...prev, error, permission: 'denied' }));
      toast({
        title: "Location not supported",
        description: error,
        variant: "destructive",
      });
      analytics.event('near_me_denied', { granted: false });
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Debounce multiple rapid calls
    debounceTimeout.current = setTimeout(() => {
      // Check if another request is already active
      if (isRequestActive.current) {
        return;
      }

      isRequestActive.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Clear any existing watch
      if (currentWatchId.current !== null) {
        navigator.geolocation.clearWatch(currentWatchId.current);
        currentWatchId.current = null;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Check if request is still active (not cancelled)
          if (!isRequestActive.current) {
            return;
          }

          setState({
            location: position,
            isLoading: false,
            error: null,
            permission: 'granted',
          });
          analytics.event('near_me_enable', { granted: true });
          toast({
            title: "Location found",
            description: "Using your location to show nearby beaches.",
          });
          isRequestActive.current = false;
        },
        (error) => {
          // Check if request is still active (not cancelled)
          if (!isRequestActive.current) {
            return;
          }

          let errorMessage = 'Unable to retrieve your location';
          let permission: 'granted' | 'denied' | 'prompt' | null = 'prompt';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              permission = 'denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          setState({
            location: null,
            isLoading: false,
            error: errorMessage,
            permission,
          });
          analytics.event('near_me_denied', { granted: false });
          
          toast({
            title: "Location error",
            description: errorMessage,
            variant: "destructive",
          });
          isRequestActive.current = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }, 300); // 300ms debounce
  }, [toast]);

  // Cancel any active location request
  const cancelLocationRequest = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null;
    }
    
    if (currentWatchId.current !== null) {
      navigator.geolocation.clearWatch(currentWatchId.current);
      currentWatchId.current = null;
    }
    
    isRequestActive.current = false;
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  return {
    ...state,
    getCurrentLocation,
    cancelLocationRequest,
  };
};

// Utility function to calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
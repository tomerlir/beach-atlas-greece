import { useMemo } from 'react';
import { calculateDistance } from './useGeolocation';
import { Beach } from '@/types/beach';

export const useDistanceCalculation = (
  beaches: Beach[],
  userLocation: GeolocationPosition | null,
  enabled: boolean
): (Beach & { distance?: number })[] => {
  return useMemo(() => {
    if (!enabled || !userLocation) {
      return beaches;
    }

    return beaches.map(beach => ({
      ...beach,
      distance: calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        beach.latitude,
        beach.longitude
      )
    }));
  }, [beaches, userLocation, enabled]);
};

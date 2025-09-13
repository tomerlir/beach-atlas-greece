import { useMemo } from 'react';
import { FilterState } from './useUrlState';
import { Beach } from '@/types/beach';

export const useBeachFiltering = (
  beaches: (Beach & { distance?: number })[],
  filters: FilterState,
  userLocation: GeolocationPosition | null
): (Beach & { distance?: number })[] => {
  return useMemo(() => {
    let filtered = beaches.filter(beach => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = beach.name.toLowerCase().includes(searchTerm);
        const matchesPlace = beach.place_text.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesPlace) return false;
      }

      // Organized filter
      if (filters.organized !== null && beach.organized !== filters.organized) {
        return false;
      }

      // Blue Flag filter
      if (filters.blueFlag && !beach.blue_flag) {
        return false;
      }

      // Parking filter
      if (filters.parking && filters.parking !== "any" && beach.parking !== filters.parking) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => 
          beach.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    // Sort beaches
    if (filters.sort === 'distance' && userLocation && filters.nearMe) {
      // Sort by distance if location is available and nearMe is enabled
      filtered = filtered.map(beach => ({
        ...beach,
        distance: beach.distance || 0
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (filters.sort === 'blueFlag') {
      // Sort by Blue Flag first
      filtered = [...filtered].sort((a, b) => {
        if (a.blue_flag && !b.blue_flag) return -1;
        if (!a.blue_flag && b.blue_flag) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Sort by name A-Z (default)
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [beaches, filters, userLocation]);
};

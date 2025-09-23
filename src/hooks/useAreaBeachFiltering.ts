import { useMemo } from 'react';
import { AreaFilterState } from './useAreaUrlState';
import { Beach } from '@/types/beach';

export const useAreaBeachFiltering = (
  beaches: (Beach & { distance?: number })[],
  filters: AreaFilterState,
  userLocation: GeolocationPosition | null
): (Beach & { distance?: number })[] => {
  return useMemo(() => {
    let filtered = beaches.filter(beach => {
      // Area filter (always applied and locked)
      if (beach.area !== filters.area) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = beach.name.toLowerCase().includes(searchTerm);
        const matchesPlace = beach.area.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesPlace) return false;
      }

      // Organized filter
      if (filters.organized.length > 0) {
        const beachOrganizedType = beach.organized ? 'organized' : 'unorganized';
        if (!filters.organized.includes(beachOrganizedType)) {
          return false;
        }
      }

      // Blue Flag filter
      if (filters.blueFlag && !beach.blue_flag) {
        return false;
      }

      // Parking filter
      if (filters.parking.length > 0 && !filters.parking.includes(beach.parking)) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => 
          beach.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      // Wave conditions filter
      if (filters.waveConditions.length > 0 && !filters.waveConditions.includes(beach.wave_conditions as any)) {
        return false;
      }

      return true;
    });

    // Sort beaches based on new sort format
    if (filters.sort) {
      const [sortKey, sortDir] = filters.sort.split('.');
      
      if (sortKey === 'name') {
        // Sort by name
        filtered = [...filtered].sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return sortDir === 'desc' ? -comparison : comparison;
        });
      } else if (sortKey === 'distance' && userLocation && filters.nearMe) {
        // Sort by distance if location is available and nearMe is enabled
        filtered = filtered.map(beach => ({
          ...beach,
          distance: beach.distance || 0
        })).sort((a, b) => {
          const comparison = (a.distance || 0) - (b.distance || 0);
          return sortDir === 'desc' ? -comparison : comparison;
        });
      }
    } else {
      // Default sort by name A-Z when no sort is specified
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [beaches, filters, userLocation]);
};

import { useEffect, useState } from 'react';
import { FilterState } from './useUrlState';
import { Beach } from '@/types/beach';

export interface RelaxationStep {
  type: 'waves' | 'parking' | 'amenities';
  label: string;
}

interface RelaxationResult {
  relaxedFilters: Partial<FilterState>;
  steps: RelaxationStep[];
}

/**
 * Auto-relaxation logic when no results found
 * Relaxes filters in order: waves → parking → non-essential amenities
 */
export function useFilterRelaxation(
  beaches: Beach[],
  filteredCount: number,
  filters: FilterState
): RelaxationResult | null {
  const [relaxation, setRelaxation] = useState<RelaxationResult | null>(null);

  useEffect(() => {
    // Only attempt relaxation if we have beaches but no filtered results
    if (beaches.length === 0 || filteredCount > 0) {
      setRelaxation(null);
      return;
    }

    // Check if any relaxable filters are applied
    const hasWaveFilter = filters.waveConditions.length > 0;
    const hasParkingFilter = filters.parking.length > 0;
    const hasAmenityFilter = filters.amenities.length > 0;

    if (!hasWaveFilter && !hasParkingFilter && !hasAmenityFilter) {
      setRelaxation(null);
      return;
    }

    // Try relaxation steps in order
    const steps: RelaxationStep[] = [];
    const relaxed: Partial<FilterState> = {};

    // Step 1: Relax wave conditions
    if (hasWaveFilter) {
      relaxed.waveConditions = [];
      steps.push({ type: 'waves', label: 'wave conditions' });
      
      // Check if this would give results
      if (countWithRelaxation(beaches, filters, relaxed) > 0) {
        setRelaxation({ relaxedFilters: relaxed, steps });
        return;
      }
    }

    // Step 2: Relax parking
    if (hasParkingFilter) {
      relaxed.parking = [];
      steps.push({ type: 'parking', label: 'parking requirements' });
      
      // Check if this would give results
      if (countWithRelaxation(beaches, filters, relaxed) > 0) {
        setRelaxation({ relaxedFilters: relaxed, steps });
        return;
      }
    }

    // Step 3: Relax non-essential amenities (keep lifeguard if present)
    if (hasAmenityFilter) {
      const essentialAmenities = filters.amenities.filter(a => a === 'lifeguard');
      relaxed.amenities = essentialAmenities;
      steps.push({ type: 'amenities', label: 'amenity requirements' });
      
      setRelaxation({ relaxedFilters: relaxed, steps });
      return;
    }

    setRelaxation(null);
  }, [beaches, filteredCount, filters]);

  return relaxation;
}

/**
 * Count beaches that would match with relaxed filters
 */
function countWithRelaxation(
  beaches: Beach[],
  originalFilters: FilterState,
  relaxedFilters: Partial<FilterState>
): number {
  const testFilters = { ...originalFilters, ...relaxedFilters };
  
  return beaches.filter(beach => {
    // Search filter
    if (testFilters.search) {
      const searchTerm = testFilters.search.toLowerCase();
      const matchesName = beach.name.toLowerCase().includes(searchTerm);
      const matchesPlace = beach.area.toLowerCase().includes(searchTerm);
      if (!matchesName && !matchesPlace) return false;
    }

    // Organized filter
    if (testFilters.organized.length > 0) {
      const beachOrganizedType = beach.organized ? 'organized' : 'unorganized';
      if (!testFilters.organized.includes(beachOrganizedType)) return false;
    }

    // Blue Flag filter
    if (testFilters.blueFlag && !beach.blue_flag) return false;

    // Parking filter
    if (testFilters.parking && testFilters.parking.length > 0 && !testFilters.parking.includes(beach.parking)) {
      return false;
    }

    // Amenities filter
    if (testFilters.amenities && testFilters.amenities.length > 0) {
      const hasAllAmenities = testFilters.amenities.every(amenity => 
        beach.amenities.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }

    // Wave conditions filter
    if (testFilters.waveConditions && testFilters.waveConditions.length > 0 && !testFilters.waveConditions.includes(beach.wave_conditions as any)) {
      return false;
    }

    return true;
  }).length;
}

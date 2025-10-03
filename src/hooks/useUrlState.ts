import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  search: string;
  organized: string[];
  blueFlag: boolean;
  parking: string[];
  amenities: string[];
  waveConditions: ('CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE')[];
  sort: string | null;
  page: number;
  nearMe: boolean; // New field to track if "Near me" is enabled
}

const defaultFilters: FilterState = {
  search: '',
  organized: [],
  blueFlag: false,
  parking: [],
  amenities: [],
  waveConditions: [],
  sort: 'name.asc',
  page: 1,
  nearMe: false,
};

export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const state: FilterState = { ...defaultFilters };
    
    // Parse search
    const search = searchParams.get('search');
    if (search) state.search = search;
    
    // Parse organized
    const organized = searchParams.get('organized');
    if (organized) {
      state.organized = organized.split(',').filter(Boolean);
    }
    
    // Parse blueFlag
    const blueFlag = searchParams.get('blueFlag');
    if (blueFlag === 'true') state.blueFlag = true;
    
    // Parse parking
    const parking = searchParams.get('parking');
    if (parking) {
      state.parking = parking.split(',').filter(Boolean);
    }
    
    // Parse amenities
    const amenities = searchParams.get('amenities');
    if (amenities) {
      state.amenities = amenities.split(',').filter(Boolean);
    }
    
    // Parse wave conditions
    const waveConditions = searchParams.get('waveConditions');
    if (waveConditions) {
      const validWaveConditions = ['CALM', 'MODERATE', 'WAVY', 'SURFABLE'] as const;
      state.waveConditions = waveConditions.split(',').filter((condition): condition is 'CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE' => 
        Boolean(condition) && validWaveConditions.includes(condition as any)
      );
    }
    
    // Parse sort
    const sort = searchParams.get('sort');
    if (sort && ['name.asc', 'name.desc', 'distance.asc', 'distance.desc'].includes(sort)) {
      state.sort = sort;
    }
    
    // Parse nearMe
    const nearMe = searchParams.get('nearMe');
    if (nearMe === 'true') state.nearMe = true;
    
    // Parse page
    const page = searchParams.get('page');
    if (page) {
      const parsedPage = parseInt(page, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) state.page = parsedPage;
    }
    
    return state;
  }, [searchParams]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      // Update search
      if (updates.search !== undefined) {
        if (updates.search) {
          newParams.set('search', updates.search);
        } else {
          newParams.delete('search');
        }
      }
      
      // Update organized
      if (updates.organized !== undefined) {
        if (updates.organized.length > 0) {
          newParams.set('organized', updates.organized.join(','));
        } else {
          newParams.delete('organized');
        }
      }
      
      // Update blueFlag
      if (updates.blueFlag !== undefined) {
        if (updates.blueFlag) {
          newParams.set('blueFlag', 'true');
        } else {
          newParams.delete('blueFlag');
        }
      }
      
      // Update parking
      if (updates.parking !== undefined) {
        if (updates.parking.length > 0) {
          newParams.set('parking', updates.parking.join(','));
        } else {
          newParams.delete('parking');
        }
      }
      
      // Update amenities
      if (updates.amenities !== undefined) {
        if (updates.amenities.length > 0) {
          newParams.set('amenities', updates.amenities.join(','));
        } else {
          newParams.delete('amenities');
        }
      }
      
      // Update wave conditions
      if (updates.waveConditions !== undefined) {
        if (updates.waveConditions.length > 0) {
          newParams.set('waveConditions', updates.waveConditions.join(','));
        } else {
          newParams.delete('waveConditions');
        }
      }
      
      // Update sort
      if (updates.sort !== undefined) {
        if (updates.sort === null) {
          // Explicitly turned off - remove from URL
          newParams.delete('sort');
        } else if (updates.sort !== defaultFilters.sort) {
          // Not the default - add to URL
          newParams.set('sort', updates.sort);
        } else {
          // Set to default - remove from URL to keep it clean
          newParams.delete('sort');
        }
      }
      
      // Update nearMe
      if (updates.nearMe !== undefined) {
        if (updates.nearMe) {
          newParams.set('nearMe', 'true');
        } else {
          newParams.delete('nearMe');
        }
      }
      
      // Update page
      if (updates.page !== undefined) {
        if (updates.page > 1) {
          newParams.set('page', updates.page.toString());
        } else {
          newParams.delete('page');
        }
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  search: string;
  organized: boolean | null;
  blueFlag: boolean;
  parking: string;
  amenities: string[];
  radius: number;
  sort: 'name' | 'distance' | 'blueFlag';
  page: number;
}

const defaultFilters: FilterState = {
  search: '',
  organized: null,
  blueFlag: false,
  parking: 'any',
  amenities: [],
  radius: 25,
  sort: 'name',
  page: 1,
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
    if (organized === 'true') state.organized = true;
    else if (organized === 'false') state.organized = false;
    
    // Parse blueFlag
    const blueFlag = searchParams.get('blueFlag');
    if (blueFlag === 'true') state.blueFlag = true;
    
    // Parse parking
    const parking = searchParams.get('parking');
    if (parking && parking !== 'any') state.parking = parking;
    
    // Parse amenities
    const amenities = searchParams.get('amenities');
    if (amenities) {
      state.amenities = amenities.split(',').filter(Boolean);
    }
    
    // Parse radius
    const radius = searchParams.get('radius');
    if (radius) {
      const parsedRadius = parseInt(radius, 10);
      if (!isNaN(parsedRadius)) state.radius = parsedRadius;
    }
    
    // Parse sort
    const sort = searchParams.get('sort');
    if (sort && ['name', 'distance', 'blueFlag'].includes(sort)) {
      state.sort = sort as FilterState['sort'];
    }
    
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
        if (updates.organized === null) {
          newParams.delete('organized');
        } else {
          newParams.set('organized', updates.organized.toString());
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
        if (updates.parking === 'any') {
          newParams.delete('parking');
        } else {
          newParams.set('parking', updates.parking);
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
      
      // Update radius
      if (updates.radius !== undefined) {
        if (updates.radius !== defaultFilters.radius) {
          newParams.set('radius', updates.radius.toString());
        } else {
          newParams.delete('radius');
        }
      }
      
      // Update sort
      if (updates.sort !== undefined) {
        if (updates.sort !== defaultFilters.sort) {
          newParams.set('sort', updates.sort);
        } else {
          newParams.delete('sort');
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

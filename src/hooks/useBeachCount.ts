import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterState } from './useUrlState';

export const useBeachCount = (filters: FilterState, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['beach-count', filters],
    queryFn: async () => {
      let query = supabase
        .from('beaches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,place_text.ilike.%${filters.search}%`);
      }

      if (filters.organized !== null) {
        query = query.eq('organized', filters.organized);
      }

      if (filters.blueFlag) {
        query = query.eq('blue_flag', true);
      }

      if (filters.parking !== 'any') {
        query = query.eq('parking', filters.parking);
      }

      if (filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled,
    staleTime: 30000, // Cache for 30 seconds
  });
};

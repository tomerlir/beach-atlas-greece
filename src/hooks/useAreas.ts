import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Area, AreaWithBeachCount } from '@/types/area';

export const useAreas = () => {
  return useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data as Area[];
    }
  });
};

export const useAreasWithBeachCount = () => {
  return useQuery({
    queryKey: ['areas-with-beach-count'],
    queryFn: async () => {
      // First get all areas
      const { data: areas, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (areasError) throw areasError;
      
      // Then get beach counts for each area
      const areasWithCounts = await Promise.all(
        areas.map(async (area) => {
          const { count, error: countError } = await supabase
            .from('beaches')
            .select('*', { count: 'exact', head: true })
            .eq('area_id', area.id)
            .eq('status', 'ACTIVE');
          
          if (countError) {
            console.error(`Error counting beaches for area ${area.name}:`, countError);
            return { ...area, beach_count: 0 };
          }
          
          return { ...area, beach_count: count || 0 };
        })
      );
      
      return areasWithCounts as AreaWithBeachCount[];
    }
  });
};

export const useAreaBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['area', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'ACTIVE')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }
      
      return data as Area;
    },
    enabled: !!slug
  });
};

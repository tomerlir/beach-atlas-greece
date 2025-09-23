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
      const { data, error } = await supabase
        .from('areas')
        .select(`
          *,
          beaches!inner(count)
        `)
        .eq('beaches.status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      
      // Transform the data to include beach count
      return data.map(area => ({
        ...area,
        beach_count: area.beaches?.[0]?.count || 0
      })) as AreaWithBeachCount[];
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

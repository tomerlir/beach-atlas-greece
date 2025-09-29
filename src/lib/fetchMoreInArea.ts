import { supabase } from '@/integrations/supabase/client';
import type { Beach } from '@/types/beach';

// Fetch up to `limit` beaches from the same area (by area slug), excluding the given beach slug
export async function fetchMoreInArea(areaSlug: string, excludeSlug: string, limit = 5): Promise<Beach[]> {
  if (!areaSlug) return [];

  // Resolve area by slug → get id
  const { data: area, error: areaError } = await supabase
    .from('areas')
    .select('id')
    .eq('slug', areaSlug)
    .eq('status', 'ACTIVE')
    .single();

  if (areaError || !area?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('beaches')
    .select('*')
    .eq('status', 'ACTIVE')
    .eq('area_id', area.id)
    .neq('slug', excludeSlug)
    .order('name')
    .limit(limit);

  if (error || !data) return [];
  return data as Beach[];
}



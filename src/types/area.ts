import { Tables } from '@/integrations/supabase/types';

export type Area = Tables<'areas'>;

export interface AreaWithBeachCount extends Area {
  beach_count: number;
}

export interface AreaWithBeaches extends Area {
  beaches: Tables<'beaches'>[];
}

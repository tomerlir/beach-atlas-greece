import { Tables } from "@/integrations/supabase/types";
import { Area } from "./area";

export type Beach = Tables<"beaches">;

export interface BeachWithDistance extends Beach {
  distance?: number;
}

export interface BeachWithArea extends Beach {
  area_data?: Area;
}

export interface Beach {
  id: string;
  name: string;
  area: string;
  description?: string;
  slug: string;
  latitude: number;
  longitude: number;
  organized: boolean;
  blue_flag: boolean;
  parking: string;
  amenities: string[];
  wave_conditions: string;
  photo_url?: string;
  photo_source?: string;
}

export interface BeachWithDistance extends Beach {
  distance?: number;
}

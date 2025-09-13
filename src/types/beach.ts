export interface Beach {
  id: string;
  name: string;
  place_text: string;
  description?: string;
  slug: string;
  latitude: number;
  longitude: number;
  organized: boolean;
  blue_flag: boolean;
  parking: string;
  amenities: string[];
  photo_url?: string;
}

export interface BeachWithDistance extends Beach {
  distance?: number;
}

import { 
  Sun, 
  Umbrella, 
  Utensils, 
  Waves, 
  Eye, 
  Camera, 
  Wine, 
  Music, 
  Mountain, 
  Binoculars, 
  Ship, 
  Heart, 
  Fish,
  ParkingCircle,
  Palmtree,
  Clock,
  Droplets,
  Shield,
  Car,
  LifeBuoy,
  Anchor,
  Users
} from "lucide-react";

export interface AmenityConfig {
  label: string;
  icon: any;
  color: string;
  category?: 'facilities' | 'safety' | 'services' | 'activities';
}

// Centralized amenity map with consistent order, labels, and icons
// Order is based on popularity and user experience
export const AMENITY_MAP: Record<string, AmenityConfig> = {
  // Facilities
  sunbeds: { 
    label: "Sunbeds", 
    icon: Clock, 
    color: "text-secondary",
    category: 'facilities'
  },
  umbrellas: { 
    label: "Umbrellas", 
    icon: Palmtree, 
    color: "text-secondary",
    category: 'facilities'
  },
  parking: { 
    label: "Parking", 
    icon: Car, 
    color: "text-secondary",
    category: 'facilities'
  },
  showers: { 
    label: "Showers", 
    icon: Droplets, 
    color: "text-secondary",
    category: 'facilities'
  },
  toilets: { 
    label: "Toilets", 
    icon: Shield, 
    color: "text-secondary",
    category: 'facilities'
  },
  
  // Safety
  lifeguard: { 
    label: "Lifeguard", 
    icon: LifeBuoy, 
    color: "text-secondary",
    category: 'safety'
  },
  
  // Services
  beach_bar: { 
    label: "Beach Bar", 
    icon: Wine, 
    color: "text-secondary",
    category: 'services'
  },
  taverna: { 
    label: "Taverna", 
    icon: Utensils, 
    color: "text-secondary",
    category: 'services'
  },
  food: { 
    label: "Food", 
    icon: Utensils, 
    color: "text-secondary",
    category: 'services'
  },
  music: { 
    label: "Music", 
    icon: Music, 
    color: "text-secondary",
    category: 'services'
  },
  
  // Activities
  snorkeling: { 
    label: "Snorkeling", 
    icon: Eye, 
    color: "text-secondary",
    category: 'activities'
  },
  water_sports: { 
    label: "Water Sports", 
    icon: Waves, 
    color: "text-secondary",
    category: 'activities'
  },
  family_friendly: { 
    label: "Family Friendly", 
    icon: Users, 
    color: "text-secondary",
    category: 'activities'
  },
  boat_trips: { 
    label: "Boat Trips", 
    icon: Anchor, 
    color: "text-secondary",
    category: 'activities'
  },
  fishing: { 
    label: "Fishing", 
    icon: Anchor, 
    color: "text-secondary",
    category: 'activities'
  },
  photography: { 
    label: "Photography", 
    icon: Camera, 
    color: "text-secondary",
    category: 'activities'
  },
  hiking: { 
    label: "Hiking", 
    icon: Mountain, 
    color: "text-secondary",
    category: 'activities'
  },
  birdwatching: { 
    label: "Birdwatching", 
    icon: Eye, 
    color: "text-secondary",
    category: 'activities'
  },
  cliff_jumping: { 
    label: "Cliff Jumping", 
    icon: Mountain, 
    color: "text-secondary",
    category: 'activities'
  }
};

// Helper function to get amenity config
export const getAmenityConfig = (amenityId: string): AmenityConfig | null => {
  return AMENITY_MAP[amenityId] || null;
};

// Helper function to get all amenities in consistent order
export const getAllAmenities = () => {
  return Object.entries(AMENITY_MAP).map(([id, config]) => ({
    id,
    ...config
  }));
};

// Helper function to get amenity label
export const getAmenityLabel = (amenityId: string): string => {
  return AMENITY_MAP[amenityId]?.label || amenityId;
};

// Helper function to get amenities by category
export const getAmenitiesByCategory = (category: 'facilities' | 'safety' | 'services' | 'activities') => {
  return Object.entries(AMENITY_MAP)
    .filter(([_, config]) => config.category === category)
    .map(([id, config]) => ({ id, ...config }));
};

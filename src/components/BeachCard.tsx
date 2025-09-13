import { 
  MapPin, 
  Waves, 
  Car, 
  Flag, 
  Umbrella, 
  Sun, 
  Utensils, 
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
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Beach {
  id: string;
  name: string;
  place_text: string;
  description?: string;
  slug: string;
  organized: boolean;
  blue_flag: boolean;
  parking: string;
  amenities: string[];
  photo_url?: string;
}

interface BeachCardProps {
  beach: Beach;
  distance?: number;
}

// Map amenities to readable labels and icons
const amenityConfig: Record<string, { label: string; icon: any; color: string }> = {
  sunbeds: { label: "Sunbeds", icon: Sun, color: "text-yellow-600" },
  umbrellas: { label: "Umbrellas", icon: Umbrella, color: "text-blue-600" }, 
  taverna: { label: "Taverna", icon: Utensils, color: "text-orange-600" },
  water_sports: { label: "Water Sports", icon: Waves, color: "text-cyan-600" },
  snorkeling: { label: "Snorkeling", icon: Eye, color: "text-teal-600" },
  photography: { label: "Photography", icon: Camera, color: "text-purple-600" },
  beach_bar: { label: "Beach Bar", icon: Wine, color: "text-red-600" },
  music: { label: "Music", icon: Music, color: "text-pink-600" },
  hiking: { label: "Hiking", icon: Mountain, color: "text-green-600" },
  birdwatching: { label: "Birdwatching", icon: Binoculars, color: "text-indigo-600" },
  boat_trips: { label: "Boat Trips", icon: Ship, color: "text-blue-700" },
  cliff_jumping: { label: "Cliff Jumping", icon: Mountain, color: "text-gray-600" },
  family_friendly: { label: "Family Friendly", icon: Heart, color: "text-rose-600" },
  fishing: { label: "Fishing", icon: Fish, color: "text-emerald-600" }
};

// Map parking types to icons and colors
const parkingConfig: Record<string, { label: string; icon: any; color: string }> = {
  none: { label: "No Parking", icon: XCircle, color: "text-red-500" },
  limited: { label: "Limited Parking", icon: AlertCircle, color: "text-yellow-500" }, 
  ample: { label: "Ample Parking", icon: CheckCircle, color: "text-green-500" }
};

const BeachCard = ({ beach, distance }: BeachCardProps) => {
  const parkingInfo = parkingConfig[beach.parking] || { 
    label: "Parking Unknown", 
    icon: AlertCircle, 
    color: "text-gray-500" 
  };

  return (
    <Link to={`/beach/${beach.slug}`} className="block">
      <Card className="group hover:shadow-strong transition-all duration-300 overflow-hidden border-0 bg-white shadow-soft hover:shadow-medium">
        {/* Beach Image */}
        <div className="aspect-video bg-gradient-ocean relative overflow-hidden">
          {beach.photo_url ? (
            <img 
              src={beach.photo_url} 
              alt={`${beach.name} beach`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-ocean flex items-center justify-center">
              <Waves className="h-16 w-16 text-white opacity-60" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          
          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            {beach.organized && (
              <Badge variant="secondary" className="bg-white/95 text-foreground shadow-sm backdrop-blur-sm">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                Organized
              </Badge>
            )}
            {beach.blue_flag && (
              <Badge className="bg-primary/95 text-primary-foreground shadow-sm backdrop-blur-sm">
                <Flag className="h-3 w-3 mr-1" />
                Blue Flag
              </Badge>
            )}
          </div>

          {/* Distance Badge */}
          {distance && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-white/95 text-foreground border-white/50 shadow-sm backdrop-blur-sm">
                <MapPin className="h-3 w-3 mr-1" />
                {distance.toFixed(1)} km
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          {/* Beach Name & Location */}
          <div className="mb-4">
            <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
              {beach.name}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">{beach.place_text}</span>
            </div>
          </div>

          {/* Description */}
          {beach.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {beach.description}
            </p>
          )}

          {/* Parking Info with Icon */}
          <div className="flex items-center text-sm mb-4 p-2 bg-muted/50 rounded-lg">
            <parkingInfo.icon className={`h-4 w-4 mr-2 ${parkingInfo.color}`} />
            <span className="font-medium text-foreground">{parkingInfo.label}</span>
          </div>

          {/* Amenities with Icons */}
          {beach.amenities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {beach.amenities.slice(0, 4).map((amenity) => {
                  const config = amenityConfig[amenity];
                  if (!config) return null;
                  
                  const IconComponent = config.icon;
                  return (
                    <div 
                      key={amenity} 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/60 rounded-full text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <IconComponent className={`h-3.5 w-3.5 ${config.color}`} />
                      <span>{config.label}</span>
                    </div>
                  );
                })}
                {beach.amenities.length > 4 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                    <span>+{beach.amenities.length - 4} more</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default BeachCard;
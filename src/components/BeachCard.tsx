import { MapPin, Waves, Car, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Beach {
  id: string;
  name: string;
  place_text: string;
  description?: string;
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

// Map amenities to readable labels
const amenityLabels: Record<string, string> = {
  sunbeds: "Sunbeds",
  umbrellas: "Umbrellas", 
  taverna: "Taverna",
  water_sports: "Water Sports",
  snorkeling: "Snorkeling",
  photography: "Photography",
  beach_bar: "Beach Bar",
  music: "Music",
  hiking: "Hiking",
  birdwatching: "Birdwatching",
  boat_trips: "Boat Trips",
  cliff_jumping: "Cliff Jumping",
  family_friendly: "Family Friendly",
  fishing: "Fishing"
};

const BeachCard = ({ beach, distance }: BeachCardProps) => {
  const parkingLabel = {
    none: "No Parking",
    limited: "Limited Parking", 
    ample: "Ample Parking"
  }[beach.parking] || "Parking Unknown";

  return (
    <Card className="group hover:shadow-medium transition-shadow duration-300 overflow-hidden">
      {/* Beach Image */}
      <div className="aspect-video bg-gradient-ocean relative overflow-hidden">
        {beach.photo_url ? (
          <img 
            src={beach.photo_url} 
            alt={`${beach.name} beach`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-ocean flex items-center justify-center">
            <Waves className="h-12 w-12 text-white opacity-50" />
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {beach.organized && (
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              Organized
            </Badge>
          )}
          {beach.blue_flag && (
            <Badge className="bg-primary text-primary-foreground">
              <Flag className="h-3 w-3 mr-1" />
              Blue Flag
            </Badge>
          )}
        </div>

        {/* Distance Badge */}
        {distance && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-white/90 text-foreground border-white/50">
              {distance.toFixed(1)} km
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Beach Name & Location */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-foreground mb-1">{beach.name}</h3>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {beach.place_text}
          </div>
        </div>

        {/* Description */}
        {beach.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {beach.description}
          </p>
        )}

        {/* Parking Info */}
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Car className="h-4 w-4 mr-2" />
          {parkingLabel}
        </div>

        {/* Amenities */}
        {beach.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {beach.amenities.slice(0, 3).map((amenity) => (
              <Badge 
                key={amenity} 
                variant="outline" 
                className="text-xs"
              >
                {amenityLabels[amenity] || amenity}
              </Badge>
            ))}
            {beach.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{beach.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BeachCard;
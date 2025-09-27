import { useState, useRef, useEffect } from "react";
import { 
  MapPin, 
  Waves, 
  Car, 
  Flag, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getAmenityConfig } from "@/lib/amenities";
import { useAdvancedPrefetch } from "@/hooks/useAdvancedPrefetch";
import OptimizedImage from "@/components/OptimizedImage";
import PhotoAttribution from "@/components/PhotoAttribution";
import { generateBeachImageAltText } from "@/lib/accessibility";
import { generateBeachUrl } from "@/lib/utils";

interface Beach {
  id: string;
  name: string;
  area: string;
  description?: string;
  slug: string;
  organized: boolean;
  blue_flag: boolean;
  parking: string;
  amenities: string[];
  photo_url?: string;
  photo_source?: string;
}

interface BeachCardProps {
  beach: Beach;
  distance?: number;
  showDistance?: boolean;
}


// Map parking types to icons and colors
const parkingConfig: Record<string, { label: string; icon: any; color: string }> = {
  NONE: { label: "No Parking", icon: XCircle, color: "text-red-500" },
  ROADSIDE: { label: "Roadside Parking", icon: AlertCircle, color: "text-orange-500" },
  SMALL_LOT: { label: "Small Lot", icon: AlertCircle, color: "text-yellow-500" },
  LARGE_LOT: { label: "Large Lot", icon: CheckCircle, color: "text-green-500" }
};

const BeachCard = ({ beach, distance, showDistance = true }: BeachCardProps) => {
  const { prefetchWithImage, cancelPrefetch } = useAdvancedPrefetch({ 
    delay: 50, 
    preloadImages: true, 
    preloadData: true 
  });

  const parkingInfo = parkingConfig[beach.parking] || { 
    label: "Parking Unknown", 
    icon: AlertCircle, 
    color: "text-gray-500" 
  };

  // Fallback component for when image fails to load
  const fallbackComponent = (
    <div className="w-full h-full bg-gradient-ocean flex items-center justify-center">
      <Waves className="h-16 w-16 text-white opacity-60" />
    </div>
  );

  const beachUrl = generateBeachUrl(beach.area, beach.slug);

  // Prefetch beach detail page and image on visibility
  useEffect(() => {
    const prefetchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchWithImage(beachUrl, beach.photo_url);
          }
        });
      },
      { rootMargin: '300px' } // Increased margin for earlier prefetching
    );

    // Use a ref to get the element instead of querySelector
    const cardElement = document.querySelector(`[data-beach-id="${beach.id}"]`);
    if (cardElement) {
      prefetchObserver.observe(cardElement);
    } else {
      // If element not found, try again after a short delay
      const retryTimeout = setTimeout(() => {
        const retryElement = document.querySelector(`[data-beach-id="${beach.id}"]`);
        if (retryElement) {
          prefetchObserver.observe(retryElement);
        }
      }, 100);
      
      return () => {
        clearTimeout(retryTimeout);
        prefetchObserver.disconnect();
        cancelPrefetch();
      };
    }

    return () => {
      // Ensure observer is properly disconnected
      prefetchObserver.disconnect();
      // Cancel any pending prefetch operations
      cancelPrefetch();
    };
  }, [beach.slug, beach.id, beach.photo_url, prefetchWithImage, cancelPrefetch, beachUrl]);

  return (
    <Link 
      to={beachUrl} 
      className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl min-h-[44px] min-w-[44px]"
      aria-label={`View details for ${beach.name} beach`}
      data-beach-id={beach.id}
      onMouseEnter={() => prefetchWithImage(beachUrl, beach.photo_url)}
      onMouseLeave={cancelPrefetch}
    >
      <Card className="group hover:shadow-strong transition-all duration-300 overflow-hidden border-0 bg-white shadow-soft hover:shadow-medium h-full">
        {/* Beach Image */}
        <div className="aspect-video bg-gradient-ocean relative overflow-hidden">
          {beach.photo_url ? (
            <OptimizedImage
              src={beach.photo_url}
              alt={generateBeachImageAltText(beach)}
              width={400}
              height={225}
              className="group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={85}
              fallbackComponent={fallbackComponent}
            />
          ) : (
            fallbackComponent
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          
          {/* Badges Overlay */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex gap-1 sm:gap-2 flex-wrap max-w-[calc(100%-4rem)] sm:max-w-none">
            {beach.organized && (
              <Badge variant="secondary" className="bg-white/95 text-foreground shadow-sm backdrop-blur-sm">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                <span className="hidden sm:inline">Organized</span>
                <span className="sm:hidden">Org</span>
              </Badge>
            )}
            {beach.blue_flag && (
              <Badge className="bg-primary/95 text-primary-foreground shadow-sm backdrop-blur-sm">
                <Flag className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Blue Flag</span>
                <span className="sm:hidden">Flag</span>
              </Badge>
            )}
            <Badge variant="outline" className="bg-white/95 text-foreground border-white/50 shadow-sm backdrop-blur-sm">
              <Car className={`h-3 w-3 mr-1 ${parkingInfo.color}`} />
              <span className="hidden sm:inline">{parkingInfo.label}</span>
              <span className="sm:hidden">{parkingInfo.label.split(' ')[0]}</span>
            </Badge>
          </div>

          {/* Distance Badge */}
          {distance && showDistance && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-white/95 text-foreground border-white/50 shadow-sm backdrop-blur-sm">
                <MapPin className="h-3 w-3 mr-1" />
                {Math.round(distance)} km
              </Badge>
            </div>
          )}

          {/* Photo Attribution - compact mode for homepage cards */}
          <PhotoAttribution 
            photoSource={beach.photo_source}
            className="z-10 absolute bottom-1 right-1"
            compact={true}
          />
        </div>

        <CardContent className="p-5">
          {/* Beach Name & Location */}
          <div className="mb-4">
            <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
              {beach.name}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">{beach.area}</span>
            </div>
          </div>

          {/* Description */}
          {beach.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {beach.description}
            </p>
          )}


          {/* Amenities with Icons */}
          {beach.amenities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {beach.amenities.slice(0, 4).map((amenity) => {
                  const config = getAmenityConfig(amenity);
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
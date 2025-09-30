import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Waves } from "lucide-react";
import { useAreasWithBeachCount } from "@/hooks/useAreas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/OptimizedImage";
import PhotoAttribution from "@/components/PhotoAttribution";
import { analytics } from "@/lib/analytics";

interface AreasGridProps {
  maxAreas?: number;
  showViewAll?: boolean;
  className?: string;
}

const AreasGrid = ({ maxAreas = 12, showViewAll = true, className = "" }: AreasGridProps) => {
  const { data: areas = [], isLoading, error } = useAreasWithBeachCount();

  // Get top areas sorted by beach count, then by name
  const topAreas = areas
    .filter(area => area.beach_count > 0)
    .sort((a, b) => {
      // First sort by beach count (descending)
      if (b.beach_count !== a.beach_count) {
        return b.beach_count - a.beach_count;
      }
      // Then by name (ascending)
      return a.name.localeCompare(b.name);
    })
    .slice(0, maxAreas);

  if (isLoading) {
    return (
      <section className={`py-8 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Explore by Area</h2>
            {showViewAll && (
              <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
            )}
          </div>
          
          {/* Loading skeleton - horizontal scroll for all screen sizes */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {Array.from({ length: maxAreas }).map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden border-0 bg-white shadow-soft flex-shrink-0 w-32">
                <div className="aspect-[3/2] bg-gradient-ocean relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
                  <div className="absolute top-2 right-2 h-4 w-12 bg-white/50 rounded-full"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="h-3 bg-white/50 rounded w-3/4"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`py-8 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 max-w-md mx-auto">
              <p className="text-destructive font-medium text-lg">Failed to load areas</p>
              <p className="text-muted-foreground mt-2">Please try again later</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (topAreas.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Explore by Area</h2>
          {showViewAll && (
            <Link 
              to="/areas"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group text-sm"
              aria-label="View all beach areas in Greece"
            >
              View all areas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Areas Grid - horizontal scroll for all screen sizes */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {topAreas.map((area) => {
            // Fallback component for when image fails to load
            const fallbackComponent = (
              <div className="w-full h-full bg-gradient-ocean flex items-center justify-center">
                <Waves className="h-8 w-8 text-white opacity-60" />
              </div>
            );

            return (
              <Link 
                key={area.id} 
                to={`/${area.slug}`}
                className="group block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl flex-shrink-0 w-32"
                aria-label={`Explore ${area.beach_count} beaches in ${area.name}`}
                onClick={() => analytics.event('area_chip_click', { area_slug: area.slug })}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-strong overflow-hidden border-0 bg-white shadow-soft hover:shadow-medium">
                  {/* Area Image - Fixed 3:2 aspect ratio */}
                  <div className="aspect-[3/2] bg-gradient-ocean relative overflow-hidden">
                    {area.hero_photo_url ? (
                      <OptimizedImage
                        src={area.hero_photo_url}
                        alt={`Beautiful beaches in ${area.name}, Greece`}
                        width={200}
                        height={133}
                        className="group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        sizes="(max-width: 768px) 128px, (max-width: 1200px) 150px, 200px"
                        quality={85}
                        fallbackComponent={fallbackComponent}
                      />
                    ) : (
                      fallbackComponent
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    
                    {/* Beach Count Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-white/95 text-foreground border-white/50 shadow-sm backdrop-blur-sm text-xs px-1.5 py-0.5">
                        <MapPin className="h-2.5 w-2.5 mr-1" />
                        {area.beach_count}
                      </Badge>
                    </div>

                    {/* Area Name Overlay */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="text-white font-bold text-xs drop-shadow-lg leading-tight">
                        {area.name}
                      </h3>
                    </div>

                    {/* Photo Attribution - compact mode for area cards */}
                    <PhotoAttribution 
                      photoSource={area.hero_photo_source}
                      className="z-10"
                      compact={true}
                    />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AreasGrid;

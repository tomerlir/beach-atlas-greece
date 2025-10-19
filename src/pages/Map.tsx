import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import FilterBar from "@/components/FilterBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUrlState } from "@/hooks/useUrlState";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Beach } from "@/types/beach";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { useBeachFiltering } from "@/hooks/useBeachFiltering";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-background.png";
import ErrorBoundary from "@/components/ErrorBoundary";
import ResultsSummary from "@/components/ResultsSummary";
import { analytics } from "@/lib/analytics";
import { createMapOpenEvent } from "@/lib/analyticsEvents";
import LazyMap from "@/components/LazyMap";

// Map page component with lazy loading

const MapPage = () => {
  const isMobile = useIsMobile();
  const { filters, updateFilters, resetFilters } = useUrlState();
  const {
    location,
    isLoading: isLoadingLocation,
    getCurrentLocation,
    permission: locationPermission,
  } = useGeolocation();
  // All filters drawer temporarily disabled on Map page

  // Track map open event and start engagement session
  useEffect(() => {
    analytics.event("map_open", createMapOpenEvent("nav"));
    analytics.startMapSession();

    return () => {
      analytics.endMapSession();
    };
  }, []);

  const { data: beaches = [] } = useQuery({
    queryKey: ["beaches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beaches")
        .select("*")
        .eq("status", "ACTIVE")
        .order("name");
      if (error) throw error;
      return data as Beach[];
    },
  });

  const beachesWithDistance = useDistanceCalculation(beaches, location, filters.nearMe);
  const filteredBeaches = useBeachFiltering(beachesWithDistance, filters, location);

  // Empty state and all-filters drawer handlers removed for now

  useEffect(() => {
    if (location && filters.nearMe && !filters.sort?.startsWith("distance")) {
      updateFilters({ sort: "distance.asc", page: 1 });
    }
  }, [location, filters.nearMe, filters.sort, updateFilters]);

  const seoTitle = "Map of Greek Beaches - Explore on an Interactive Map";
  const seoDescription =
    "Explore Greek beaches on an interactive map. Use powerful search and filters to find exactly what you want, then zoom to matching beaches automatically.";
  const canonicalUrl = "https://beachesofgreece.com/map";

  // Prevent indexing of filtered URLs (canonical points to clean URL)
  const hasQueryParams = window.location.search.length > 0;
  const shouldNoIndex = hasQueryParams;

  const mapHeightClass = "h-[60vh] md:h-[70vh] lg:h-[75vh]";

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Prevent indexing of filtered URLs */}
        {shouldNoIndex && <meta name="robots" content="noindex, follow" />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative h-[30vh] flex flex-col justify-center bg-gradient-ocean overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundPosition: isMobile ? "center left" : "center top",
            }}
          />

          <div className="relative z-10 text-center text-white px-4 w-full">
            <h1 className="text-4xl md:text-6xl font-bold mb-8 drop-shadow-lg">
              Explore Beaches on the Map
            </h1>
            <div className="max-w-2xl mx-auto">
              <EnhancedSearchBar
                filters={filters}
                onFiltersChange={updateFilters}
                onClearAll={resetFilters}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="bg-background border-border/20 py-2 relative z-20">
          <div className="container mx-auto px-4">
            <FilterBar
              filters={filters}
              onFiltersChange={updateFilters}
              userLocation={location}
              onLocationRequest={getCurrentLocation}
              isLoadingLocation={isLoadingLocation}
              onOpenAllFilters={() => {}}
              locationPermission={locationPermission}
              resultCount={filteredBeaches.length}
              showCountBadge={false}
            />
          </div>
        </div>

        {/* Results Summary spacer */}
        <div className="container mx-auto px-4">
          <div className="relative z-40">
            <ResultsSummary
              resultCount={filteredBeaches.length}
              filters={filters}
              userLocation={location}
              onClearAllFilters={() => resetFilters()}
            />
          </div>
        </div>

        {/* Map Section */}
        <main className="container mx-auto px-4 md:pb-8">
          <ErrorBoundary>
            <div
              className={`w-full rounded-xl overflow-hidden border border-border/30 shadow-sm ${mapHeightClass} leaflet-popup-contrast relative z-0`}
            >
              {/* Scoped styling to improve popup close button visibility over photos */}
              <style>
                {`
                .leaflet-popup-contrast .leaflet-popup-close-button {
                  color: #e5e7eb !important; /* soft gray */
                  text-shadow: 0 1px 2px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.4);
                  opacity: 1 !important;
                }
                .leaflet-popup-contrast .leaflet-popup-close-button:hover {
                  color: #f3f4f6 !important; /* slightly brighter on hover */
                  text-shadow: 0 2px 4px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.5);
                }
                `}
              </style>
              <LazyMap
                beaches={filteredBeaches as Beach[]}
                selectedBeach={null}
                onBeachSelect={(_beach) => {
                  // Handle beach selection - could navigate to beach detail page
                  // navigate(`/${beach.area}/${beach.slug}`);
                }}
                userLocation={
                  location
                    ? {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                      }
                    : null
                }
              />
            </div>
          </ErrorBoundary>

          {/* No Results UI temporarily removed on Map page */}
        </main>

        {/* All Filters Drawer temporarily removed on Map page */}

        <Footer />
      </div>
    </>
  );
};

export default MapPage;

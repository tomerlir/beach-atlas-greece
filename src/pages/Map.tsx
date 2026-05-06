import { useEffect, useState, lazy, Suspense } from "react";
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
import { useBeachFiltering } from "@/hooks/useBeachFiltering";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-background.png";
import ResultsSummary from "@/components/ResultsSummary";
import { analytics } from "@/lib/analytics";
import { createMapOpenEvent } from "@/lib/analyticsEvents";
import { generateMapWebPageSchema } from "@/lib/structured-data";
import OrganizationSchema from "@/components/OrganizationSchema";
import JsonLdScript from "@/components/seo/JsonLdScript";

// MapClient touches `window` at import time (Leaflet). Lazy-loaded so it only
// runs client-side, behind a `mounted` gate to avoid SSR import.
const MapClient = lazy(() => import("./MapClient"));

const MapPage = () => {
  const isMobile = useIsMobile();
  const { filters, updateFilters, resetFilters } = useUrlState();
  const {
    location,
    isLoading: isLoadingLocation,
    getCurrentLocation,
    permission: locationPermission,
  } = useGeolocation();

  const [mounted, setMounted] = useState(false);
  const [hasQueryParams, setHasQueryParams] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasQueryParams(window.location.search.length > 0);
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

  const filteredBeaches = useBeachFiltering(beaches, filters, location);

  useEffect(() => {
    if (location && filters.nearMe && !filters.sort?.startsWith("distance")) {
      updateFilters({ sort: "distance.asc", page: 1 });
    }
  }, [location, filters.nearMe, filters.sort, updateFilters]);

  const seoTitle = "Map of Greek Beaches - Explore on an Interactive Map";
  const seoDescription =
    "Explore Greek beaches on an interactive map. Use powerful search and filters to find exactly what you want, then zoom to matching beaches automatically.";
  const canonicalUrl = "https://beachesofgreece.com/map";
  const shouldNoIndex = hasQueryParams;

  const jsonLd = generateMapWebPageSchema(beaches, canonicalUrl);
  const mapHeightClass = "h-[60vh] md:h-[70vh] lg:h-[75vh]";

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {shouldNoIndex && <meta name="robots" content="noindex, follow" />}

        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Beaches of Greece" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
      </Helmet>

      <JsonLdScript schema={jsonLd} id="map-schema" />
      <OrganizationSchema />

      <div className="min-h-screen bg-background">
        <Header />

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

        <main className="container mx-auto px-4 md:pb-8">
          {mounted ? (
            <Suspense
              fallback={
                <div
                  className={`w-full rounded-xl border border-border/30 shadow-sm ${mapHeightClass} bg-muted animate-pulse`}
                  aria-label="Loading map"
                />
              }
            >
              <MapClient beaches={beaches} mapHeightClass={mapHeightClass} />
            </Suspense>
          ) : (
            <div
              className={`w-full rounded-xl border border-border/30 shadow-sm ${mapHeightClass} bg-muted`}
              aria-label="Map loading"
            />
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MapPage;

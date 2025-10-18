import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import FilterBar from "@/components/FilterBar";
import BeachCard from "@/components/BeachCard";
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

// Leaflet + React-Leaflet
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

// Fix default icon paths for Vite builds
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Explicit icon instance ensures assets resolve correctly in Vite
const defaultMarkerIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Ensure all markers use our explicit default icon instance
// (safer across navigations and bundlers)

(L.Marker as any).prototype.options.icon = defaultMarkerIcon;

const GREECE_BOUNDS: L.LatLngBoundsExpression = [
  [34.6, 19.0],
  [41.8, 29.6],
];

function FitBoundsOnData({
  beaches,
  fallbackBounds,
}: {
  beaches: Beach[];
  fallbackBounds: L.LatLngBoundsExpression;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (!beaches || beaches.length === 0) {
      if (fallbackBounds) map.fitBounds(fallbackBounds, { padding: [24, 24] });
      return;
    }
    const bounds = new L.LatLngBounds([]);
    beaches.forEach((b) => {
      if (b.latitude != null && b.longitude != null) {
        bounds.extend([b.latitude, b.longitude]);
      }
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    } else if (fallbackBounds) {
      map.fitBounds(fallbackBounds, { padding: [24, 24] });
    }
  }, [map, beaches, fallbackBounds]);
  return null;
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const invalidate = () => {
      try {
        map.invalidateSize();
      } catch (_) {
        // no-op; safeguard for sporadic lifecycle timing
      }
    };
    const onResize = () => invalidate();
    const onVisibility = () => {
      if (!document.hidden) {
        setTimeout(invalidate, 50);
      }
    };
    const timeoutId = setTimeout(invalidate, 50);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [map]);
  return null;
}

function MapEngagementTracker() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      analytics.trackMapInteraction();
    };

    const handleZoomEnd = () => {
      analytics.trackMapInteraction();
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
    };
  }, [map]);

  return null;
}

// Component to track when a popup's content is shown
function PopupTracker({ beachId }: { beachId: string }) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      analytics.trackMapBeachView(beachId);
      hasTracked.current = true;
    }
  }, [beachId]);

  return null;
}

const MapPage = () => {
  const isMobile = useIsMobile();
  const { filters, updateFilters, resetFilters } = useUrlState();
  const {
    location,
    isLoading: isLoadingLocation,
    getCurrentLocation,
    permission: locationPermission,
    error: locationError,
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
              <MapContainer className="w-full h-full" bounds={GREECE_BOUNDS}>
                <InvalidateSizeOnMount />
                {/* Satellite imagery base layer */}
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                {/* Roads and transportation overlay */}
                {/* <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}" /> */}
                {/* Borders, place names, and labels overlay */}
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />

                <FitBoundsOnData
                  beaches={filteredBeaches as Beach[]}
                  fallbackBounds={GREECE_BOUNDS}
                />
                <MapEngagementTracker />

                {filteredBeaches
                  .filter((b) => b.latitude != null && b.longitude != null)
                  .map((b) => (
                    <Marker key={b.id} position={[b.latitude as number, b.longitude as number]}>
                      <Popup>
                        <div className="max-w-[340px]">
                          <PopupTracker beachId={b.id} />
                          <BeachCard
                            beach={b as Beach}
                            distance={(b as any).distance}
                            showDistance={filters.nearMe && !locationError && !!location}
                            engagementSource="map"
                          />
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
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

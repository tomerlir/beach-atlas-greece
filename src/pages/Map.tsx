import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import AllFiltersDrawer from "@/components/AllFiltersDrawer";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import BeachCard from "@/components/BeachCard";
import EmptyState from "@/components/EmptyState";
import { GeolocationErrorBanner } from "@/components/GeolocationErrorBanner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUrlState } from "@/hooks/useUrlState";
import { useBeachFiltering } from "@/hooks/useBeachFiltering";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { Beach } from "@/types/beach";
import { Helmet } from "react-helmet-async";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to auto-fit map bounds to visible beaches
const AutoFitBounds = ({ beaches }: { beaches: Beach[] }) => {
  const map = useMap();

  useEffect(() => {
    if (beaches.length === 0) {
      // If no beaches, show all of Greece
      map.setView([38.5, 23.0], 6);
      return;
    }

    // Create bounds from all visible beaches
    const bounds = L.latLngBounds(
      beaches.map((beach) => [beach.latitude, beach.longitude])
    );

    // Fit map to bounds with padding
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15,
    });
  }, [beaches, map]);

  return null;
};

const Map = () => {
  const { filters, updateFilters, resetFilters } = useUrlState();
  const { location, isLoading: isLoadingLocation, getCurrentLocation, permission: locationPermission, error: locationError } = useGeolocation();
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
  const [showGeolocationError, setShowGeolocationError] = useState(false);

  // Fetch beaches from Supabase
  const { data: beaches = [], isLoading, error } = useQuery({
    queryKey: ['beaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beaches')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data as Beach[];
    }
  });

  // Calculate distances for beaches when location is enabled
  const beachesWithDistance = useDistanceCalculation(
    beaches,
    location,
    filters.nearMe
  );

  // Filter beaches
  const filteredBeaches = useBeachFiltering(beachesWithDistance, filters, location);

  const handleApplyFilters = (newFilters: typeof filters) => {
    updateFilters(newFilters);
  };

  // Empty state button handlers
  const handleClearAllFilters = () => {
    resetFilters();
  };

  const handleTurnOffNearMe = () => {
    updateFilters({ nearMe: false, sort: 'name.asc', page: 1 });
  };

  const handleResetParking = () => {
    updateFilters({ parking: [], page: 1 });
  };

  const handleClearSearch = () => {
    updateFilters({ search: "", page: 1 });
  };
  const handleRemoveOrganized = (value: string) => {
    updateFilters({ organized: filters.organized.filter((v) => v !== value), page: 1 });
  };
  const handleRemoveParking = (value: string) => {
    updateFilters({ parking: filters.parking.filter((v) => v !== value), page: 1 });
  };
  const handleRemoveWaveCondition = (value: string) => {
    updateFilters({ waveConditions: filters.waveConditions.filter((v) => v !== value), page: 1 });
  };
  const handleRemoveBeachType = (value: string) => {
    updateFilters({ type: filters.type.filter((v) => v !== value), page: 1 });
  };
  const handleRemoveAmenity = (value: string) => {
    updateFilters({ amenities: filters.amenities.filter((v) => v !== value), page: 1 });
  };
  const handleClearBlueFlag = () => {
    updateFilters({ blueFlag: false, page: 1 });
  };

  // Show geolocation error banner when Near me is on but geolocation fails
  useEffect(() => {
    if (filters.nearMe && locationError && !location && !isLoadingLocation) {
      setShowGeolocationError(true);
      if (filters.sort?.startsWith('distance')) {
        updateFilters({ sort: 'name.asc', page: 1 });
      }
    } else if (location || !filters.nearMe) {
      setShowGeolocationError(false);
    }
  }, [filters.nearMe, locationError, location, filters.sort, updateFilters, isLoadingLocation]);

  // Auto-enable distance sorting when location becomes available and near me is enabled
  useEffect(() => {
    if (location && filters.nearMe && !filters.sort?.startsWith('distance')) {
      updateFilters({ sort: 'distance.asc', page: 1 });
    }
  }, [location, filters.nearMe, filters.sort, updateFilters]);

  const handleGeolocationRetry = () => {
    getCurrentLocation();
  };

  const handleDismissGeolocationError = () => {
    setShowGeolocationError(false);
  };

  const handleNaturalLanguageSearch = (wasUsed: boolean) => {
    // No longer needed since we always use natural language search
  };

  // SEO
  const seoTitle = "Beach Map - Explore Greek Beaches Visually";
  const seoDescription = "Explore Greek beaches on an interactive map. Filter by amenities, Blue Flag certification, and more to find your perfect beach.";
  const canonicalUrl = "https://beachesofgreece.com/map";

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        {/* Search and Filter Bar */}
        <div className="bg-background border-b border-border/20">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <EnhancedSearchBar
              filters={filters}
              onFiltersChange={updateFilters}
              onClearAll={resetFilters}
              className="w-full"
              onNaturalLanguageSearch={handleNaturalLanguageSearch}
            />
            <FilterBar
              filters={filters}
              onFiltersChange={updateFilters}
              userLocation={location}
              onLocationRequest={getCurrentLocation}
              isLoadingLocation={isLoadingLocation}
              onOpenAllFilters={() => setIsAllFiltersOpen(true)}
              locationPermission={locationPermission}
              resultCount={filteredBeaches.length}
              showCountBadge={true}
            />
          </div>
        </div>

        {/* Geolocation Error Banner */}
        {showGeolocationError && (
          <div className="container mx-auto px-4 py-4">
            <GeolocationErrorBanner
              onRetry={handleGeolocationRetry}
              onDismiss={handleDismissGeolocationError}
              isRetrying={isLoadingLocation}
            />
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-2 text-muted-foreground">Loading beaches...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 max-w-md mx-auto">
                <p className="text-destructive font-medium text-lg">Failed to load beaches</p>
                <p className="text-muted-foreground mt-2">Please try again later</p>
              </div>
            </div>
          )}

          {!isLoading && !error && filteredBeaches.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10 p-4 overflow-auto">
              <EmptyState
                filters={filters}
                userLocation={location}
                onClearAllFilters={handleClearAllFilters}
                onTurnOffNearMe={handleTurnOffNearMe}
                onResetParking={handleResetParking}
                onClearSearch={handleClearSearch}
                onRemoveOrganized={handleRemoveOrganized}
                onRemoveParking={handleRemoveParking}
                onRemoveWaveCondition={handleRemoveWaveCondition}
                onRemoveBeachType={handleRemoveBeachType}
                onRemoveAmenity={handleRemoveAmenity}
                onClearBlueFlag={handleClearBlueFlag}
              />
            </div>
          )}

          {!isLoading && !error && filteredBeaches.length > 0 && (
            <MapContainer
              center={[38.5, 23.0]}
              zoom={6}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {filteredBeaches.map((beach) => (
                  <Marker
                    key={beach.id}
                    position={[beach.latitude, beach.longitude]}
                  >
                    <Popup maxWidth={300} className="beach-popup">
                      <div className="p-2">
                        <BeachCard
                          beach={beach}
                          distance={beach.distance}
                          showDistance={filters.nearMe && !locationError && !!location}
                        />
                      </div>
                    </Popup>
                  </Marker>
                ))}

                <AutoFitBounds beaches={filteredBeaches} />
              </>
            </MapContainer>
          )}
        </div>

        {/* All Filters Drawer */}
        <AllFiltersDrawer
          isOpen={isAllFiltersOpen}
          onClose={() => setIsAllFiltersOpen(false)}
          filters={filters}
          onApplyFilters={handleApplyFilters}
          userLocation={location}
          onLocationRequest={getCurrentLocation}
          isLoadingLocation={isLoadingLocation}
          locationPermission={locationPermission}
        />
      </div>
    </>
  );
};

export default Map;

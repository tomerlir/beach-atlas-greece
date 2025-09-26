import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_EMAIL } from "@/lib/constants";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import AllFiltersDrawer from "@/components/AllFiltersDrawer";
import ResultsHeader from "@/components/ResultsHeader";
import BeachCard from "@/components/BeachCard";
import BeachCardSkeleton from "@/components/BeachCardSkeleton";
import Pagination from "@/components/Pagination";
import { GeolocationErrorBanner } from "@/components/GeolocationErrorBanner";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import AreasGrid from "@/components/AreasGrid";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUrlState } from "@/hooks/useUrlState";
import { useBeachFiltering } from "@/hooks/useBeachFiltering";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { Beach } from "@/types/beach";
import heroImage from "@/assets/hero-background.png";
import EmptyState from "@/components/EmptyState";

const BEACHES_PER_PAGE = 9;

const Index = () => {
  const { filters, updateFilters, resetFilters } = useUrlState();
  const { location, isLoading: isLoadingLocation, getCurrentLocation, permission: locationPermission, error: locationError } = useGeolocation();
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
  const [showGeolocationError, setShowGeolocationError] = useState(false);
  const { preloadVisibleBeachImages } = useImagePreloader();

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

  // Filter and sort beaches
  const filteredBeaches = useBeachFiltering(beachesWithDistance, filters, location);

  // Pagination
  const totalPages = Math.ceil(filteredBeaches.length / BEACHES_PER_PAGE);
  const startIndex = (filters.page - 1) * BEACHES_PER_PAGE;
  const paginatedBeaches = filteredBeaches.slice(startIndex, startIndex + BEACHES_PER_PAGE);

  // Preload images for visible beaches
  useEffect(() => {
    if (paginatedBeaches.length > 0) {
      preloadVisibleBeachImages(paginatedBeaches);
    }
  }, [paginatedBeaches, preloadVisibleBeachImages]);


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

  // Show geolocation error banner when Near me is on but geolocation fails
  // Also revert to Name sort when geolocation fails
  useEffect(() => {
    if (filters.nearMe && locationError && !location && !isLoadingLocation) {
      setShowGeolocationError(true);
      // Revert to Name sort when geolocation fails but Near me is still on
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

  // Handle geolocation retry
  const handleGeolocationRetry = () => {
    getCurrentLocation();
  };

  // Handle dismissing the geolocation error banner
  const handleDismissGeolocationError = () => {
    setShowGeolocationError(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[50vh] flex flex-col justify-center bg-gradient-ocean overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto w-full">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            Find Your Perfect Greek Beach
          </h1>
          
          {/* Hero Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <EnhancedSearchBar
              filters={filters}
              onFiltersChange={updateFilters}
              userLocation={location}
              hasResults={filteredBeaches.length > 0}
              className="w-full"
            />
          </div>

          {/* Filter Bar in Hero */}
          <div className="max-w-4xl mx-auto">
            <FilterBar
              filters={filters}
              onFiltersChange={updateFilters}
              userLocation={location}
              onLocationRequest={getCurrentLocation}
              isLoadingLocation={isLoadingLocation}
              onOpenAllFilters={() => setIsAllFiltersOpen(true)}
              locationPermission={locationPermission}
              resultCount={filteredBeaches.length}
              showCountBadge={false}
            />
          </div>
        </div>
      </section>

      {/* Explore by Area Section */}
      <AreasGrid maxAreas={12} />

      {/* Horizontal Line */}
      <div className="container mx-auto px-4">
        <hr className="border-t border-border/30 my-8" />
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

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {!isLoading && !error && `${filteredBeaches.length} beaches found`}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <BeachCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 max-w-md mx-auto">
              <p className="text-destructive font-medium text-lg">Failed to load beaches</p>
              <p className="text-muted-foreground mt-2">Please try again later</p>
            </div>
          </div>
        )}

        {/* Beach Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedBeaches.map((beach) => (
                <BeachCard 
                  key={beach.id} 
                  beach={beach} 
                  distance={beach.distance}
                  showDistance={filters.nearMe && !locationError && !!location}
                />
              ))}
            </div>

            {/* No Results */}
            {filteredBeaches.length === 0 && (
              <EmptyState
                filters={filters}
                userLocation={location}
                onClearAllFilters={handleClearAllFilters}
                onTurnOffNearMe={handleTurnOffNearMe}
                onResetParking={handleResetParking}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={(page) => updateFilters({ page })}
                />
              </div>
            )}
          </>
        )}
      </main>

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

      {/* Footer */}
      <footer className="bg-muted py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-6 mb-4">
            <a 
              href="/about" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </a>
            <a 
              href={`mailto:${CONTACT_EMAIL}`} 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Feedback
            </a>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 Beaches of Greece . Discover the beauty of Greece.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Information is for guidance only, please verify locally.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
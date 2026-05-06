import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateHomeMetaTitle, generateHomeMetaDescription } from "@/lib/seo";
import { generateHomeWebPageSchema } from "@/lib/structured-data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterBar from "@/components/FilterBar";
import AllFiltersDrawer from "@/components/AllFiltersDrawer";
import ResultsSummary from "@/components/ResultsSummary";
import BeachCard from "@/components/BeachCard";
import BeachCardSkeleton from "@/components/BeachCardSkeleton";
import Pagination from "@/components/Pagination";
import { GeolocationErrorBanner } from "@/components/GeolocationErrorBanner";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUrlState } from "@/hooks/useUrlState";
import { useBeachFiltering } from "@/hooks/useBeachFiltering";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { Beach } from "@/types/beach";
import ResponsivePicture from "@/components/ResponsivePicture";
import EmptyState from "@/components/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import { Helmet } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary";
import OrganizationSchema from "@/components/OrganizationSchema";
import JsonLdScript from "@/components/seo/JsonLdScript";

const BEACHES_PER_PAGE = 9;

const Index = () => {
  const { filters, updateFilters, resetFilters } = useUrlState();
  const {
    location,
    isLoading: isLoadingLocation,
    getCurrentLocation,
    permission: locationPermission,
    error: locationError,
  } = useGeolocation();
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
  const [showGeolocationError, setShowGeolocationError] = useState(false);
  const { preloadVisibleBeachImages } = useImagePreloader();
  const isMobile = useIsMobile();

  // Fetch beaches from Supabase with selective fields and server-side pagination
  const {
    data: beaches = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["beaches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beaches")
        .select(
          "id, name, area, slug, organized, blue_flag, parking, amenities, photo_url, photo_source, latitude, longitude, wave_conditions, type"
        )
        .eq("status", "ACTIVE")
        .order("name");

      if (error) throw error;
      return data as Beach[];
    },
  });

  // Calculate distances for beaches when location is enabled
  const beachesWithDistance = useDistanceCalculation(beaches, location, filters.nearMe);

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
    updateFilters({ nearMe: false, sort: "name.asc", page: 1 });
  };

  const handleResetParking = () => {
    updateFilters({ parking: [], page: 1 });
  };

  // Per-filter removal handlers for EmptyState chips
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
  // Also revert to Name sort when geolocation fails
  useEffect(() => {
    if (filters.nearMe && locationError && !location && !isLoadingLocation) {
      setShowGeolocationError(true);
      // Revert to Name sort when geolocation fails but Near me is still on
      if (filters.sort?.startsWith("distance")) {
        updateFilters({ sort: "name.asc", page: 1 });
      }
    } else if (location || !filters.nearMe) {
      setShowGeolocationError(false);
    }
  }, [filters.nearMe, locationError, location, filters.sort, updateFilters, isLoadingLocation]);

  // Auto-enable distance sorting when location becomes available and near me is enabled
  useEffect(() => {
    if (location && filters.nearMe && !filters.sort?.startsWith("distance")) {
      updateFilters({ sort: "distance.asc", page: 1 });
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

  // Generate SEO data with platform USPs
  const seoTitle = generateHomeMetaTitle();
  const seoDescription = generateHomeMetaDescription();
  const canonicalUrl = "https://beachesofgreece.com";

  // Prevent indexing of filtered/paginated URLs (canonical points to clean URL).
  // Use react-router's useLocation so this works in both SSR (StaticRouter) and client.
  const routerLocation = useLocation();
  const hasQueryParams = routerLocation.search.length > 0;
  const shouldNoIndex = hasQueryParams;

  // Generate optimized JSON-LD structured data - use all beaches, not paginated
  const jsonLd = generateHomeWebPageSchema(beaches);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Prevent indexing of filtered/paginated URLs */}
        {shouldNoIndex && <meta name="robots" content="noindex, follow" />}

        {/* Open Graph tags */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Beaches of Greece" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
      </Helmet>

      {/* JSON-LD structured data */}
      <JsonLdScript schema={jsonLd} id="home-schema" />

      {/* Organization Schema for AI engines */}
      <OrganizationSchema />

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative h-[35vh] flex flex-col justify-center bg-gradient-ocean overflow-hidden">
          {/* Responsive hero background image with modern formats */}
          <ResponsivePicture
            baseName="hero-background"
            fallbackExt="png"
            widths={[640, 828, 1024, 1280, 1920, 2560]}
            alt=""
            sizes="100vw"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: isMobile ? "center left" : "center top",
            }}
          />

          <div className="relative z-10 text-center text-white px-4 w-full">
            <h1 className="text-4xl md:text-6xl font-bold mb-8 drop-shadow-lg">
              Find Your Perfect Greek Beach
            </h1>

            {/* Hero Search Bar */}
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

        {/* Filter Bar outside Hero */}
        <div className="bg-background border-border/20 py-2">
          <div className="container mx-auto px-4">
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

        <main className="container mx-auto px-4 md:pb-8">
          {/* Results Summary */}
          {!isLoading && !error && (
            <ResultsSummary
              resultCount={filteredBeaches.length}
              filters={filters}
              userLocation={location}
              onClearAllFilters={handleClearAllFilters}
            />
          )}

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
              <ErrorBoundary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedBeaches.map((beach, index) => (
                    <BeachCard
                      key={beach.id}
                      beach={beach}
                      distance={beach.distance}
                      showDistance={filters.nearMe && !locationError && !!location}
                      engagementSource={filters.search ? "search" : "browsing"}
                      priority={index < 3} // Priority loading for first 3 cards
                    />
                  ))}
                </div>
              </ErrorBoundary>

              {/* No Results */}
              {filteredBeaches.length === 0 && (
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

        <Footer />
      </div>
    </>
  );
};

export default Index;

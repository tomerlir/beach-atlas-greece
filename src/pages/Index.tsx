import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_EMAIL } from "@/lib/constants";
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
import AreasGrid from "@/components/AreasGrid";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUrlState } from "@/hooks/useUrlState";
import { useBeachFiltering } from "@/hooks/useBeachFiltering";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { Beach } from "@/types/beach";
import heroImage from "@/assets/hero-background.png";
import EmptyState from "@/components/EmptyState";
import { useIsMobile } from '@/hooks/use-mobile';
import { Helmet } from "react-helmet-async";
import { generateAreaSlug } from "@/lib/utils";
import ErrorBoundary from "@/components/ErrorBoundary";
import OrganizationSchema from "@/components/OrganizationSchema";

const BEACHES_PER_PAGE = 9;

const Index = () => {
  const { filters, updateFilters, resetFilters } = useUrlState();
  const { location, isLoading: isLoadingLocation, getCurrentLocation, permission: locationPermission, error: locationError } = useGeolocation();
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
  const [showGeolocationError, setShowGeolocationError] = useState(false);
  const { preloadVisibleBeachImages } = useImagePreloader();
  const isMobile = useIsMobile();

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

  // Handle natural language search usage tracking (no longer needed since we always use NL search)
  const handleNaturalLanguageSearch = (wasUsed: boolean) => {
    // No longer needed since we always use natural language search
  };

  // Generate SEO data
  const seoTitle = "Greek Beaches Directory - Find Your Perfect Beach in Greece";
  const seoDescription = "Discover the most beautiful beaches in Greece. Search by location, amenities, and Blue Flag certification. Complete directory of Greek island and mainland beaches.";
  const canonicalUrl = "https://beachesofgreece.com";
  
  // Prevent indexing of filtered/paginated URLs (canonical points to clean URL)
  const hasQueryParams = window.location.search.length > 0;
  const shouldNoIndex = hasQueryParams;

  // Generate JSON-LD structured data with freshness signals
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": seoTitle,
    "description": seoDescription,
    "url": canonicalUrl,
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "mainEntity": {
      "@type": "ItemList",
      "name": "Greek Beaches",
      "description": "A comprehensive directory of beaches across Greece",
      "numberOfItems": filteredBeaches.length,
      "itemListElement": paginatedBeaches.slice(0, 10).map((beach, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "TouristAttraction",
          "@id": `https://beachesofgreece.com/${generateAreaSlug(beach.area)}/${beach.slug}`,
          "name": beach.name,
          "description": beach.description,
          "url": `https://beachesofgreece.com/${generateAreaSlug(beach.area)}/${beach.slug}`,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": beach.area,
            "addressCountry": "Greece"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": beach.latitude,
            "longitude": beach.longitude
          },
          "isAccessibleForFree": true,
          "image": beach.photo_url ? [beach.photo_url] : undefined,
          "amenityFeature": beach.amenities?.map(amenity => ({
            "@type": "LocationFeatureSpecification",
            "name": amenity,
            "value": true
          })) || []
        }
      }))
    },
  };

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
        <meta property="og:site_name" content="Beach Atlas Greece" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* JSON-LD structured data */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      
      {/* Organization Schema for AI engines */}
      <OrganizationSchema />

      <div className="min-h-screen bg-background">
        <Header />
        
      
      {/* Hero Section */}
      <section className="relative h-[35vh] flex flex-col justify-center bg-gradient-ocean overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundPosition: isMobile ? 'center left' : 'center top'
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
              onNaturalLanguageSearch={handleNaturalLanguageSearch}
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
                {paginatedBeaches.map((beach) => (
                  <BeachCard 
                    key={beach.id} 
                    beach={beach} 
                    distance={beach.distance}
                    showDistance={filters.nearMe && !locationError && !!location}
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
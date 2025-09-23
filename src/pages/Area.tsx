import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_EMAIL } from "@/lib/constants";
import { generateAreaSlug } from "@/lib/utils";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import AllFiltersDrawer from "@/components/AllFiltersDrawer";
import ResultsHeader from "@/components/ResultsHeader";
import BeachCard from "@/components/BeachCard";
import BeachCardSkeleton from "@/components/BeachCardSkeleton";
import Pagination from "@/components/Pagination";
import { GeolocationErrorBanner } from "@/components/GeolocationErrorBanner";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAreaUrlState } from "@/hooks/useAreaUrlState";
import { useAreaBeachFiltering } from "@/hooks/useAreaBeachFiltering";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { Beach } from "@/types/beach";
import heroImage from "@/assets/hero-beach.jpg";
import EmptyState from "@/components/EmptyState";
import NotFound from "@/pages/NotFound";

const BEACHES_PER_PAGE = 9;

const Area = () => {
  const { areaSlug } = useParams<{ areaSlug: string }>();
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

  // Find the area name from the slug
  const areaName = useMemo(() => {
    if (!areaSlug || !beaches.length) return null;
    
    // Find unique areas and match by slug
    const uniqueAreas = [...new Set(beaches.map(beach => beach.area))];
    return uniqueAreas.find(area => generateAreaSlug(area) === areaSlug) || null;
  }, [areaSlug, beaches]);

  // Use area-specific URL state
  const { filters, updateFilters, resetFilters } = useAreaUrlState(areaName || '');

  // Calculate distances for beaches when location is enabled
  const beachesWithDistance = useDistanceCalculation(
    beaches,
    location,
    filters.nearMe
  );

  // Filter and sort beaches (including area filter)
  const filteredBeaches = useAreaBeachFiltering(beachesWithDistance, filters, location);

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

  // Handle geolocation retry
  const handleGeolocationRetry = () => {
    getCurrentLocation();
  };

  // Handle dismissing the geolocation error banner
  const handleDismissGeolocationError = () => {
    setShowGeolocationError(false);
  };

  // If area not found, show 404
  if (!isLoading && !error && areaSlug && !areaName) {
    return <NotFound />;
  }

  // Generate SEO data
  const seoTitle = areaName ? `Beaches in ${areaName}, Greece | Beach Atlas` : 'Area Not Found';
  const seoDescription = areaName 
    ? `Discover the best beaches in ${areaName}, Greece. Find organized and unorganized beaches with detailed information about amenities, parking, and conditions.`
    : 'The requested area could not be found.';
  const canonicalUrl = areaName ? `https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/${areaSlug}` : undefined;

  // Generate JSON-LD structured data
  const jsonLd = areaName ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": areaName,
            "item": `https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/${areaSlug}`
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": `Beaches in ${areaName}`,
        "description": `A curated list of beaches in ${areaName}, Greece`,
        "numberOfItems": filteredBeaches.length,
        "itemListElement": paginatedBeaches.slice(0, 10).map((beach, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Place",
            "name": beach.name,
            "description": beach.description,
            "url": `https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/${areaSlug}/${beach.slug}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": areaName,
              "addressCountry": "Greece"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": beach.latitude,
              "longitude": beach.longitude
            }
          }
        }))
      }
    ]
  } : null;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        
        {/* Open Graph tags */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta property="og:image" content="https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/hero-beach.jpg" />
        <meta property="og:site_name" content="Beach Atlas Greece" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content="https://lovable.dev/projects/cf4131ec-b13a-4688-95df-885e89cb06cc/hero-beach.jpg" />
        
        {/* JSON-LD structured data */}
        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/30" />
          
          <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {areaName ? `Beaches in ${areaName}` : 'Area Not Found'}
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-8">
              {areaName 
                ? `Discover stunning beaches in ${areaName}, Greece. From organized resorts to hidden gems waiting to be explored.`
                : 'The requested area could not be found. Please check the URL or return to the main directory.'
              }
            </p>
            
            {/* Hero Search Bar - only show if area exists */}
            {areaName && (
              <div className="max-w-2xl mx-auto">
                <EnhancedSearchBar
                  filters={filters}
                  onFiltersChange={updateFilters}
                  userLocation={location}
                  hasResults={filteredBeaches.length > 0}
                  className="w-full"
                />
              </div>
            )}

            {/* Back to directory link if area not found */}
            {!areaName && !isLoading && (
              <div className="mt-8">
                <Link 
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors backdrop-blur-sm"
                >
                  ← Back to Beach Directory
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Filter Bar - only show if area exists */}
        {areaName && (
          <>
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
              areaName={areaName}
            />

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
          </>
        )}

        <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
          {/* Screen reader announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {!isLoading && !error && areaName && `${filteredBeaches.length} beaches found in ${areaName}`}
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

          {/* Beach Grid - only show if area exists */}
          {!isLoading && !error && areaName && (
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

        {/* All Filters Drawer - only show if area exists */}
        {areaName && (
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
        )}

        {/* Footer */}
        <footer className="bg-muted py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-6 mb-4">
              <Link 
                to="/about" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </Link>
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
    </>
  );
};

export default Area;

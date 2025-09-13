import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SearchHeader from "@/components/SearchHeader";
import AllFiltersDrawer from "@/components/AllFiltersDrawer";
import ResultsHeader from "@/components/ResultsHeader";
import BeachCard from "@/components/BeachCard";
import Pagination from "@/components/Pagination";
import MobileFilterBar from "@/components/MobileFilterBar";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { useUrlState } from "@/hooks/useUrlState";
import { Waves, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-beach.jpg";

interface Beach {
  id: string;
  name: string;
  place_text: string;
  description?: string;
  slug: string;
  latitude: number;
  longitude: number;
  organized: boolean;
  blue_flag: boolean;
  parking: string;
  amenities: string[];
  photo_url?: string;
}

const BEACHES_PER_PAGE = 9;

const Index = () => {
  const { filters, updateFilters, resetFilters } = useUrlState();
  const { location, isLoading: isLoadingLocation, getCurrentLocation } = useGeolocation();
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);

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

  // Filter and sort beaches
  const filteredBeaches = useMemo(() => {
    let filtered = beaches.filter(beach => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = beach.name.toLowerCase().includes(searchTerm);
        const matchesPlace = beach.place_text.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesPlace) return false;
      }

      // Organized filter
      if (filters.organized !== null && beach.organized !== filters.organized) {
        return false;
      }

      // Blue Flag filter
      if (filters.blueFlag && !beach.blue_flag) {
        return false;
      }

      // Parking filter
      if (filters.parking && filters.parking !== "any" && beach.parking !== filters.parking) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => 
          beach.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      // Distance filter (only when explicitly filtering by distance, not just sorting)
      // This should be controlled by a separate "near me" filter, not by sort order
      // For now, we'll remove this distance filtering since it's not properly implemented
      // TODO: Add proper distance filtering when user explicitly enables "Near me" filter

      return true;
    });

    // Sort beaches
    if (filters.sort === 'distance' && location) {
      // Sort by distance if location is available
      filtered = filtered.map(beach => ({
        ...beach,
        distance: calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          beach.latitude,
          beach.longitude
        )
      })).sort((a, b) => a.distance - b.distance);
    } else if (filters.sort === 'blueFlag') {
      // Sort by Blue Flag first
      filtered = [...filtered].sort((a, b) => {
        if (a.blue_flag && !b.blue_flag) return -1;
        if (!a.blue_flag && b.blue_flag) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Sort by name A-Z (default)
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [beaches, filters, location]);

  // Pagination
  const totalPages = Math.ceil(filteredBeaches.length / BEACHES_PER_PAGE);
  const startIndex = (filters.page - 1) * BEACHES_PER_PAGE;
  const paginatedBeaches = filteredBeaches.slice(startIndex, startIndex + BEACHES_PER_PAGE);

  // Handle filter removal
  const handleRemoveFilter = (filterType: keyof typeof filters, value?: any) => {
    switch (filterType) {
      case 'search':
        updateFilters({ search: '', page: 1 });
        break;
      case 'organized':
        updateFilters({ organized: null, page: 1 });
        break;
      case 'blueFlag':
        updateFilters({ blueFlag: false, page: 1 });
        break;
      case 'parking':
        updateFilters({ parking: 'any', page: 1 });
        break;
      case 'amenities':
        const newAmenities = filters.amenities.filter(amenity => amenity !== value);
        updateFilters({ amenities: newAmenities, page: 1 });
        break;
    }
  };

  const handleClearAllFilters = () => {
    resetFilters();
  };

  const handleApplyFilters = (newFilters: typeof filters) => {
    updateFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center bg-gradient-ocean overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Find Your Perfect Greek Beach
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            Discover stunning beaches across the Greek islands and mainland, 
            from organized resorts to hidden gems waiting to be explored.
          </p>
        </div>
      </section>

      {/* Search Header */}
      <SearchHeader
        filters={filters}
        onFiltersChange={updateFilters}
        userLocation={location}
        onLocationRequest={getCurrentLocation}
        isLoadingLocation={isLoadingLocation}
        onOpenAllFilters={() => setIsAllFiltersOpen(true)}
      />

      {/* Results Header */}
      <ResultsHeader
        resultCount={filteredBeaches.length}
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        onSortChange={(sort) => updateFilters({ sort, page: 1 })}
        userLocation={location}
      />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {!isLoading && !error && `${filteredBeaches.length} beaches found`}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-xl h-80 shadow-soft"></div>
              </div>
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
                  distance={location ? calculateDistance(
                    location.coords.latitude,
                    location.coords.longitude,
                    beach.latitude,
                    beach.longitude
                  ) : undefined}
                />
              ))}
            </div>

            {/* No Results */}
            {filteredBeaches.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-muted/30 border border-muted rounded-xl p-12 max-w-lg mx-auto">
                  <Waves className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-xl font-medium mb-2">
                    No beaches match your current filters
                  </p>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or clear some filters to see more results.
                  </p>
                </div>
              </div>
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
      />

      {/* Mobile Filter Bar */}
      <MobileFilterBar
        filters={filters}
        onOpenFilters={() => setIsAllFiltersOpen(true)}
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
              href="mailto:info@greekbeaches.com" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Feedback
            </a>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 Greek Beaches Directory. Discover the beauty of Greece.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
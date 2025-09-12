import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SearchFilters from "@/components/SearchFilters";
import BeachCard from "@/components/BeachCard";
import Pagination from "@/components/Pagination";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
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

interface Filters {
  search: string;
  organized: boolean | null;
  blueFlag: boolean;
  parking: string;
  amenities: string[];
  radius: number;
}

const BEACHES_PER_PAGE = 9;

const Index = () => {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    organized: null,
    blueFlag: false,
    parking: "any",
    amenities: [],
    radius: 25
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const { location, isLoading: isLoadingLocation, getCurrentLocation } = useGeolocation();

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

      // Distance filter (if location is available)
      if (location) {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          beach.latitude,
          beach.longitude
        );
        if (distance > filters.radius) return false;
      }

      return true;
    });

    // Sort beaches
    if (location) {
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
    } else {
      // Sort by name A-Z
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [beaches, filters, location]);

  // Pagination
  const totalPages = Math.ceil(filteredBeaches.length / BEACHES_PER_PAGE);
  const startIndex = (currentPage - 1) * BEACHES_PER_PAGE;
  const paginatedBeaches = filteredBeaches.slice(startIndex, startIndex + BEACHES_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <section className="mb-8">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            userLocation={location}
            onLocationRequest={getCurrentLocation}
            isLoadingLocation={isLoadingLocation}
          />
        </section>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {filteredBeaches.length} beaches found
            {location && (
              <span className="text-base text-muted-foreground ml-2">
                (sorted by distance)
              </span>
            )}
          </h2>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load beaches. Please try again.</p>
          </div>
        )}

        {/* Beach Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No beaches match your current filters.
                </p>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your search criteria or clear some filters.
                </p>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

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
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/hooks/useUrlState';
import { getAmenityLabel } from '@/lib/amenities';

interface ResultsHeaderProps {
  resultCount: number;
  filters: FilterState;
  onRemoveFilter: (filterType: keyof FilterState, value?: any) => void;
  onClearAllFilters: () => void;
  userLocation: GeolocationPosition | null;
}

const parkingLabels: Record<string, string> = {
  'any': 'Any parking',
  'NONE': 'No parking',
  'ROADSIDE': 'Roadside parking',
  'SMALL_LOT': 'Small lot',
  'LARGE_LOT': 'Large lot',
};


export default function ResultsHeader({
  resultCount,
  filters,
  onRemoveFilter,
  onClearAllFilters,
  userLocation,
}: ResultsHeaderProps) {
  const hasActiveFilters = filters.search || 
                          filters.organized !== null || 
                          filters.blueFlag || 
                          filters.parking !== 'any' || 
                          filters.amenities.length > 0;

  const getFilterPills = () => {
    const pills = [];

    // Search pill
    if (filters.search) {
      pills.push({
        id: 'search',
        label: `"${filters.search}"`,
        onRemove: () => onRemoveFilter('search'),
      });
    }

    // Organized pill
    if (filters.organized !== null) {
      pills.push({
        id: 'organized',
        label: filters.organized ? 'Organized' : 'Unorganized',
        onRemove: () => onRemoveFilter('organized'),
      });
    }

    // Blue Flag pill
    if (filters.blueFlag) {
      pills.push({
        id: 'blueFlag',
        label: 'Blue Flag',
        onRemove: () => onRemoveFilter('blueFlag'),
      });
    }

    // Parking pill
    if (filters.parking !== 'any') {
      pills.push({
        id: 'parking',
        label: parkingLabels[filters.parking] || filters.parking,
        onRemove: () => onRemoveFilter('parking'),
      });
    }

    // Amenities pills
    filters.amenities.forEach((amenity) => {
      pills.push({
        id: `amenity-${amenity}`,
        label: getAmenityLabel(amenity),
        onRemove: () => onRemoveFilter('amenities', amenity),
      });
    });

    return pills;
  };

  const filterPills = getFilterPills();

  return (
    <div className="sticky top-[140px] z-30 bg-white border-b border-border py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left side: Result count and filter pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {resultCount} {resultCount === 1 ? 'beach' : 'beaches'}
              </h2>
              {userLocation && filters.nearMe && filters.sort?.startsWith('distance') && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    sorted by distance
                  </span>
                </div>
              )}
            </div>

            {/* Filter Pills */}
            {filterPills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filterPills.map((pill) => (
                  <Badge
                    key={pill.id}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border-primary/20"
                  >
                    <span>{pill.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={pill.onRemove}
                      className="h-8 w-8 p-0 hover:bg-primary/20 rounded-full flex items-center justify-center"
                      aria-label={`Remove ${pill.label} filter`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Right side: Clear all */}
          <div className="flex items-center gap-4">
            {/* Clear all link */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

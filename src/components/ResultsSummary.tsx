import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterState } from '@/hooks/useUrlState';
import { getAmenityLabel } from '@/lib/amenities';

interface ResultsSummaryProps {
    resultCount: number;
    filters: FilterState;
    userLocation: GeolocationPosition | null;
    onClearAllFilters: () => void;
}

const parkingLabels: Record<string, string> = {
    'NONE': 'no parking',
    'ROADSIDE': 'roadside parking',
    'SMALL_LOT': 'small parking lot',
    'LARGE_LOT': 'large parking lot',
};

const waveConditionLabels: Record<string, string> = {
    'CALM': 'calm waters',
    'MODERATE': 'moderate waves',
    'WAVY': 'wavy conditions',
    'SURFABLE': 'surfable waves',
};

const beachTypeLabels: Record<string, string> = {
    'SANDY': 'sandy',
    'PEBBLY': 'pebbly',
    'MIXED': 'mixed surface',
    'OTHER': 'rocky',
};

export default function ResultsSummary({
    resultCount,
    filters,
    userLocation,
    onClearAllFilters,
}: ResultsSummaryProps) {
    const hasActiveFilters = filters.search ||
        filters.organized.length > 0 ||
        filters.blueFlag ||
        filters.parking.length > 0 ||
        filters.amenities.length > 0 ||
        filters.waveConditions.length > 0 ||
        filters.type.length > 0;

    const generateExplanation = () => {
        const parts: string[] = [];

        const capitalized =
        filters.search.charAt(0).toUpperCase()
        + filters.search.slice(1)

        // Search term
        if (filters.search) {
            parts.push(`matching ${capitalized}`);
        }

        // Location context
        if (filters.nearMe && userLocation) {
            parts.push('near your location');
        }

        // Beach type
        if (filters.type.length > 0) {
            const types = filters.type.map(type => beachTypeLabels[type] || type.toLowerCase()).join(' or ');
            parts.push(`with ${types} beaches`);
        }

        // Wave conditions
        if (filters.waveConditions.length > 0) {
            const conditions = filters.waveConditions.map(condition => waveConditionLabels[condition] || condition.toLowerCase()).join(' or ');
            parts.push(`with ${conditions}`);
        }

        // Parking
        if (filters.parking.length > 0) {
            const parkingTypes = filters.parking.map(parking => parkingLabels[parking] || parking.toLowerCase()).join(' or ');
            parts.push(`with ${parkingTypes}`);
        }

        // Amenities
        if (filters.amenities.length > 0) {
            const amenityLabels = filters.amenities.map(amenity => getAmenityLabel(amenity)).join(', ');
            parts.push(`with ${amenityLabels}`);
        }

        // Blue Flag
        if (filters.blueFlag) {
            parts.push('with Blue Flag certification');
        }

        // Organization
        if (filters.organized.length > 0) {
            const organizedTypes = filters.organized.map(org => org === 'organized' ? 'organized' : 'unorganized').join(' or ');
            parts.push(`that are ${organizedTypes}`);
        }

        return parts;
    };

    const getTruncatedExplanation = () => {
        const allParts = generateExplanation();
        if (allParts.length <= 2) {
            return allParts;
        }
        
        // Show first 2 parts, then count remaining
        const visibleParts = allParts.slice(0, 2);
        const remainingCount = allParts.length - 2;
        
        return [...visibleParts, `(and ${remainingCount} more)`];
    };

    const explanationParts = getTruncatedExplanation();
    const hasExplanation = explanationParts.length > 0;

    return (
        <div className="py-4">
            <div className="flex flex-row items-center justify-between gap-3">
                {/* Left side: Result count and explanation */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="text-muted-foreground min-w-0 flex-1">
                        <span className="text-sm">
                            {resultCount} {resultCount === 1 ? 'beach' : 'beaches'}
                            {hasExplanation && (
                                <span className="ml-1">
                                    found {explanationParts.join(', ')}
                                </span>
                            )}
                        </span>
                    </div>

                    {userLocation && filters.nearMe && filters.sort?.startsWith('distance') && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full flex-shrink-0">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                                sorted by distance
                            </span>
                        </div>
                    )}
                </div>

                {/* Right side: Clear all */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearAllFilters}
                        className="text-secondary hover:text-secondary/80 underline text-sm flex-shrink-0 bg-transparent border-none cursor-pointer"
                    >
                        Clear all
                    </button>
                )}
            </div>
        </div>
    );
}

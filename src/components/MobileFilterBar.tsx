import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/hooks/useUrlState';

interface MobileFilterBarProps {
  filters: FilterState;
  onOpenFilters: () => void;
}

export default function MobileFilterBar({
  filters,
  onOpenFilters,
}: MobileFilterBarProps) {
  // Calculate active filter count
  const activeFilterCount = [
    filters.organized !== null,
    filters.blueFlag,
    filters.parking !== 'any',
    filters.amenities.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-center p-4">
        <Button
          variant="outline"
          onClick={onOpenFilters}
          className="w-full max-w-sm h-12 rounded-xl border-2 hover:border-primary/50 transition-colors"
          aria-label="Open filters"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
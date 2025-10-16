import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FilterState } from '@/hooks/useUrlState';

interface SortDropdownProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  userLocation: GeolocationPosition | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | null;
  onLocationRequest: () => void;
  isLoadingLocation: boolean;
}

interface SortOption {
  value: string;
  label: string;
  requiresLocation?: boolean;
}

export default function SortDropdown({
  filters,
  onFiltersChange,
  userLocation,
  locationPermission,
  onLocationRequest,
  isLoadingLocation,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Determine if location is available and active
  const isLocationActive = filters.nearMe && userLocation && locationPermission === 'granted';

  // Get available sort options based on location state
  const getSortOptions = useCallback((): SortOption[] => {
    if (isLocationActive) {
      return [
        { value: 'distance.asc', label: 'Distance: Near to Far' },
        { value: 'distance.desc', label: 'Distance: Far to Near' },
        { value: 'name.asc', label: 'Name: A → Z' },
        { value: 'name.desc', label: 'Name: Z → A' },
      ];
    } else {
      return [
        { value: 'name.asc', label: 'Name: A → Z' },
        { value: 'name.desc', label: 'Name: Z → A' },
      ];
    }
  }, [isLocationActive]);

  const sortOptions = getSortOptions();

  // Get current sort value, defaulting to name.asc if none set
  const currentSort = filters.sort || 'name.asc';

  // Get display label for current sort
  const getCurrentSortLabel = useCallback(() => {
    const option = sortOptions.find(opt => opt.value === currentSort);
    return option?.label || 'Name: A → Z';
  }, [currentSort, sortOptions]);

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    const newSort = value as FilterState['sort'];
    
    // If distance sorting is selected but location is not available, request location
    if (value.startsWith('distance.') && !isLocationActive) {
      onLocationRequest();
      // Don't change sort yet - wait for location to be available
      return;
    }

    onFiltersChange({ sort: newSort, page: 1 });
    setIsOpen(false);
  }, [onFiltersChange, isLocationActive, onLocationRequest]);

  // Handle location state changes - fallback to name sorting if location becomes unavailable
  const handleLocationFallback = useCallback(() => {
    if (currentSort.startsWith('distance.') && !isLocationActive) {
      onFiltersChange({ sort: 'name.asc', page: 1 });
      toast({
        title: "Location unavailable",
        description: "Switched to name sorting as location is no longer available.",
        variant: "default",
      });
    }
  }, [currentSort, isLocationActive, onFiltersChange, toast]);

  // Check if we need to fallback when location becomes unavailable
  useEffect(() => {
    handleLocationFallback();
  }, [handleLocationFallback]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="px-3 py-2 rounded-xl h-auto min-w-[140px] justify-between text-foreground bg-muted/65 border-2 border-muted shadow-sm"
          aria-expanded={isOpen}
          aria-label="Sort by"
        >
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-sm">Sort by</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3">
          <h4 className="font-semibold text-sm mb-3">Sort by</h4>
          <RadioGroup
            value={currentSort}
            onValueChange={handleSortChange}
          >
            {sortOptions.map((option) => {
              const isDisabled = option.requiresLocation && !isLocationActive;
              return (
                <div key={option.value} className="flex items-center space-x-2 py-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`sort-${option.value}`}
                    disabled={isDisabled}
                  />
                  <Label 
                    htmlFor={`sort-${option.value}`} 
                    className={`text-sm cursor-pointer flex-1 ${isDisabled ? 'text-muted-foreground' : ''}`}
                  >
                    {option.label}
                    {isDisabled && (
                      <span className="text-xs text-muted-foreground ml-1 block">
                        (requires location)
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          
          {/* Show location request button if distance options are disabled */}
          {!isLocationActive && (
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onLocationRequest();
                  // Also enable Near me filter and set default distance sorting
                  onFiltersChange({ 
                    nearMe: true, 
                    sort: 'distance.asc', // Default to "Distance: Near to Far"
                    page: 1 
                  });
                  setIsOpen(false);
                }}
                disabled={isLoadingLocation}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                {isLoadingLocation ? 'Getting location...' : 'Enable location for distance sorting'}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

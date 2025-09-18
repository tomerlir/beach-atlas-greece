import { useState, useRef, useEffect, useCallback } from 'react';
import { Sun, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDraftState } from '@/hooks/useDraftState';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';
import { getAllAmenities } from '@/lib/amenities';

interface AmenitiesDropdownProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onOpenAllFilters: () => void;
  showCountBadge?: boolean;
}

// Get all amenities from centralized map
const allAmenities = getAllAmenities();

export default function AmenitiesDropdown({
  filters,
  onFiltersChange,
  onOpenAllFilters,
  showCountBadge = false,
}: AmenitiesDropdownProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Use draft state for proper state management
  const { draftFilters, updateDraft, resetDraft } = useDraftState(filters);

  // Handle mobile behavior - open drawer instead of popover
  const handleTriggerClick = useCallback(() => {
    if (isMobile) {
      onOpenAllFilters();
      return;
    }
    setIsOpen(true);
  }, [isMobile, onOpenAllFilters]);

  // Toggle amenity in draft state
  const toggleAmenityDraft = useCallback((amenityId: string) => {
    const newAmenities = draftFilters.amenities.includes(amenityId)
      ? draftFilters.amenities.filter(id => id !== amenityId)
      : [...draftFilters.amenities, amenityId];
    updateDraft({ amenities: newAmenities });
  }, [draftFilters.amenities, updateDraft]);

  // Apply draft changes and close
  const handleApply = useCallback(() => {
    onFiltersChange(draftFilters);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [draftFilters, onFiltersChange]);

  // Reset amenities draft
  const handleReset = useCallback(() => {
    updateDraft({ amenities: [] });
  }, [updateDraft]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < allAmenities.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : allAmenities.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < allAmenities.length) {
          toggleAmenityDraft(allAmenities[focusedIndex].id);
        }
        break;
    }
  }, [isOpen, focusedIndex, toggleAmenityDraft]);

  // Focus management
  useEffect(() => {
    if (isOpen && listRef.current) {
      const focusedElement = listRef.current.querySelector(`[data-index="${focusedIndex}"]`) as HTMLElement;
      focusedElement?.focus();
    }
  }, [isOpen, focusedIndex]);

  // Reset focus when opening
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Calculate counts
  const selectedCount = draftFilters.amenities.length;
  const appliedCount = filters.amenities.length;

  // Don't render on mobile - use drawer instead
  if (isMobile) {
    return (
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        onClick={handleTriggerClick}
        className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0"
        aria-expanded={false}
        aria-haspopup="listbox"
        aria-label="Amenities"
        data-testid="amenities-trigger"
        id="amenities-trigger"
      >
        <Sun className="h-4 w-4 mr-2" />
        Amenities
        {showCountBadge && appliedCount > 0 && (
          <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
            {appliedCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          size="sm"
          onClick={handleTriggerClick}
          className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="amenities-listbox"
          aria-label={appliedCount > 0 ? `Amenities, ${appliedCount} selected` : 'Amenities'}
          data-testid="amenities-trigger"
          id="amenities-trigger"
        >
          <Sun className="h-4 w-4 mr-2" />
          Amenities
          {showCountBadge && appliedCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
              {appliedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        onKeyDown={handleKeyDown}
        data-testid="amenities-panel"
        id="amenities-panel"
      >
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm flex items-center justify-between">
            Amenities
            {selectedCount > 0 && (
              <span className="text-muted-foreground text-xs font-normal">
                • {selectedCount} selected
              </span>
            )}
          </h3>
        </div>

        {/* List */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Amenities"
          id="amenities-listbox"
        >
          {allAmenities.map((amenity, index) => {
            const isSelected = draftFilters.amenities.includes(amenity.id);
            const isFocused = focusedIndex === index;
            
            return (
              <button
                key={amenity.id}
                data-index={index}
                onClick={() => toggleAmenityDraft(amenity.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors min-h-[44px] ${
                  isSelected ? 'bg-muted/30' : ''
                } ${isFocused ? 'ring-2 ring-ring ring-offset-1' : ''}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
              >
                <span className="text-sm font-medium">{amenity.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t bg-background sticky bottom-0 pb-[env(safe-area-inset-bottom)]">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 min-h-[44px]"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 min-h-[44px]"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

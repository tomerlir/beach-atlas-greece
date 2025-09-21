import { useState, useRef, useEffect, useCallback } from 'react';
import { Car, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDraftState } from '@/hooks/useDraftState';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';

interface ParkingDropdownProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onOpenAllFilters: () => void;
  showCountBadge?: boolean;
}

const parkingOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'ROADSIDE', label: 'Roadside' },
  { value: 'SMALL_LOT', label: 'Small lot' },
  { value: 'LARGE_LOT', label: 'Large lot' },
];

export default function ParkingDropdown({
  filters,
  onFiltersChange,
  onOpenAllFilters,
  showCountBadge = false,
}: ParkingDropdownProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Use draft state for proper state management
  const { draftFilters, updateDraft, resetDraft } = useDraftState(filters);

  // Handle trigger click - open popover on all devices
  const handleTriggerClick = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Toggle parking option in draft state
  const toggleParkingDraft = useCallback((parkingValue: string) => {
    const newParking = draftFilters.parking.includes(parkingValue)
      ? draftFilters.parking.filter(value => value !== parkingValue)
      : [...draftFilters.parking, parkingValue];
    updateDraft({ parking: newParking });
  }, [draftFilters.parking, updateDraft]);

  // Apply draft changes and close
  const handleApply = useCallback(() => {
    onFiltersChange(draftFilters);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [draftFilters, onFiltersChange]);

  // Reset parking draft
  const handleReset = useCallback(() => {
    updateDraft({ parking: [] });
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
          prev < parkingOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : parkingOptions.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < parkingOptions.length) {
          toggleParkingDraft(parkingOptions[focusedIndex].value);
        }
        break;
    }
  }, [isOpen, focusedIndex, toggleParkingDraft]);

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
  const selectedCount = draftFilters.parking.length;
  const appliedCount = filters.parking.length;

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
          aria-controls="parking-listbox"
          aria-label={appliedCount > 0 ? `Parking, ${appliedCount} selected` : 'Parking'}
          data-testid="parking-trigger"
          id="parking-trigger"
        >
          <Car className="h-4 w-4 mr-2" />
          Parking
          {showCountBadge && appliedCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
              {appliedCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
        align="start"
        onKeyDown={handleKeyDown}
        data-testid="parking-panel"
        id="parking-panel"
      >
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm flex items-center justify-between">
            {selectedCount > 0 && (
              <span className="text-muted-foreground text-xs font-normal">
                {selectedCount} selected
              </span>
            )}
          </h3>
        </div>

        {/* List */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Parking options"
          id="parking-listbox"
        >
          {parkingOptions.map((option, index) => {
            const isSelected = draftFilters.parking.includes(option.value);
            const isFocused = focusedIndex === index;
            
            return (
              <button
                key={option.value}
                data-index={index}
                onClick={() => toggleParkingDraft(option.value)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors min-h-[44px] ${
                  isSelected ? 'bg-muted/30' : ''
                } ${isFocused ? 'ring-2 ring-ring ring-offset-1' : ''}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
              >
                <span className="text-sm font-medium">{option.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 pb-8 border-t bg-background sticky bottom-0 rounded-b-md pb-[max(2rem,env(safe-area-inset-bottom))]">
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

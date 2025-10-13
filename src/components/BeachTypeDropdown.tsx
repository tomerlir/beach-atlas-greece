import { useState, useRef, useEffect, useCallback } from 'react';
import { Mountain, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDraftState } from '@/hooks/useDraftState';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';

interface BeachTypeDropdownProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onOpenAllFilters: () => void;
  showCountBadge?: boolean;
}

const beachTypeOptions = [
  { value: 'SANDY', label: 'Sandy' },
  { value: 'PEBBLY', label: 'Pebbly' },
  { value: 'MIXED', label: 'Mixed' },
  { value: 'OTHER', label: 'Rocky/Other' },
];

export default function BeachTypeDropdown({
  filters,
  onFiltersChange,
  onOpenAllFilters,
  showCountBadge = false,
}: BeachTypeDropdownProps) {
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

  // Toggle beach type in draft state
  const toggleBeachTypeDraft = useCallback((typeValue: string) => {
    const newTypes = draftFilters.type.includes(typeValue as 'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER')
      ? draftFilters.type.filter(value => value !== typeValue)
      : [...draftFilters.type, typeValue as 'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER'];
    updateDraft({ type: newTypes });
  }, [draftFilters.type, updateDraft]);

  // Apply draft changes and close
  const handleApply = useCallback(() => {
    onFiltersChange(draftFilters);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [draftFilters, onFiltersChange]);

  // Reset beach type draft
  const handleReset = useCallback(() => {
    updateDraft({ type: [] });
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
          prev < beachTypeOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : beachTypeOptions.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < beachTypeOptions.length) {
          toggleBeachTypeDraft(beachTypeOptions[focusedIndex].value);
        }
        break;
    }
  }, [isOpen, focusedIndex, toggleBeachTypeDraft]);

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
  const selectedCount = draftFilters.type.length;
  const appliedCount = filters.type.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant={appliedCount > 0 ? "default" : "ghost"}
          size="sm"
          onClick={handleTriggerClick}
            className={`px-3 py-2 rounded-xl h-auto min-h-[40px] whitespace-nowrap flex-shrink-0 border-2 shadow-md hover:shadow-lg ${
              appliedCount > 0 ? 'border-transparent' : 'text-foreground bg-muted/65 border-muted'
            }`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="beach-type-listbox"
          aria-label={appliedCount > 0 ? `Beach type, ${appliedCount} selected` : 'Beach type'}
          data-testid="beach-type-trigger"
          id="beach-type-trigger"
        >
            <Mountain className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Beach type</span>
            <span className="sm:hidden">Type</span>
            <div className="ml-1 h-4 w-1 flex items-center justify-center">
              {appliedCount > 0 && (
                <span className="text-xs">{appliedCount}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
        align="start"
        onKeyDown={handleKeyDown}
        data-testid="beach-type-panel"
        id="beach-type-panel"
      >
        {/* List */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Beach type"
          id="beach-type-listbox"
        >
          {beachTypeOptions.map((option, index) => {
            const isSelected = draftFilters.type.includes(option.value as 'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER');
            const isFocused = focusedIndex === index;
            
            return (
              <button
                key={option.value}
                data-index={index}
                onClick={() => toggleBeachTypeDraft(option.value)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors min-h-[44px] ${
                  isSelected ? 'bg-muted/30' : ''
                } ${isFocused ? 'ring-2 ring-ring ring-offset-1' : ''}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
              >
                <span className="text-sm font-medium">{option.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-secondary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 pb-8 border-t bg-background sticky bottom-0 rounded-b-md pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <Button
              variant="ghost"
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

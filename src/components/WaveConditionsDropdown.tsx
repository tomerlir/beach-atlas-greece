import { useState, useRef, useEffect, useCallback } from 'react';
import { Waves, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDraftState } from '@/hooks/useDraftState';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilterState } from '@/hooks/useUrlState';

interface WaveConditionsDropdownProps {
  filters: FilterState;
  onFiltersChange: (updates: Partial<FilterState>) => void;
  onOpenAllFilters: () => void;
  showCountBadge?: boolean;
}

const waveConditionsOptions = [
  { value: 'CALM', label: 'Calm' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'WAVY', label: 'Wavy' },
  { value: 'SURFABLE', label: 'Surfable' },
];

export default function WaveConditionsDropdown({
  filters,
  onFiltersChange,
  onOpenAllFilters,
  showCountBadge = false,
}: WaveConditionsDropdownProps) {
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

  // Toggle wave condition in draft state
  const toggleWaveConditionDraft = useCallback((waveConditionValue: string) => {
    const newWaveConditions = draftFilters.waveConditions.includes(waveConditionValue as any)
      ? draftFilters.waveConditions.filter(value => value !== waveConditionValue)
      : [...draftFilters.waveConditions, waveConditionValue as any];
    updateDraft({ waveConditions: newWaveConditions });
  }, [draftFilters.waveConditions, updateDraft]);

  // Apply draft changes and close
  const handleApply = useCallback(() => {
    onFiltersChange(draftFilters);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [draftFilters, onFiltersChange]);

  // Reset wave conditions draft
  const handleReset = useCallback(() => {
    updateDraft({ waveConditions: [] });
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
          prev < waveConditionsOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : waveConditionsOptions.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < waveConditionsOptions.length) {
          toggleWaveConditionDraft(waveConditionsOptions[focusedIndex].value);
        }
        break;
    }
  }, [isOpen, focusedIndex, toggleWaveConditionDraft]);

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
  const selectedCount = draftFilters.waveConditions.length;
  const appliedCount = filters.waveConditions.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          size="sm"
          onClick={handleTriggerClick}
          className="px-3 py-2 rounded-xl border h-auto whitespace-nowrap flex-shrink-0 text-foreground"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="wave-conditions-listbox"
          aria-label={appliedCount > 0 ? `Wave conditions, ${appliedCount} selected` : 'Wave conditions'}
          data-testid="wave-conditions-trigger"
          id="wave-conditions-trigger"
        >
          <Waves className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Wave conditions</span>
          <span className="sm:hidden">Waves</span>
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
        data-testid="wave-conditions-panel"
        id="wave-conditions-panel"
      >
        {/* List */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Wave conditions"
          id="wave-conditions-listbox"
        >
          {waveConditionsOptions.map((option, index) => {
            const isSelected = draftFilters.waveConditions.includes(option.value as any);
            const isFocused = focusedIndex === index;
            
            return (
              <button
                key={option.value}
                data-index={index}
                onClick={() => toggleWaveConditionDraft(option.value)}
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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDraftState } from '@/hooks/useDraftState';
import { FilterState } from '@/hooks/useUrlState';

interface OrganizedDropdownProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onOpenAllFilters: () => void;
  showCountBadge?: boolean;
}

const organizedOptions = [
  { value: 'organized', label: 'Organized' },
  { value: 'unorganized', label: 'Unorganized' },
];

export default function OrganizedDropdown({
  filters,
  onFiltersChange,
  onOpenAllFilters,
  showCountBadge = false,
}: OrganizedDropdownProps) {
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

  // Toggle organized option in draft state
  const toggleOrganizedDraft = useCallback((organizedValue: string) => {
    const newOrganized = draftFilters.organized.includes(organizedValue)
      ? draftFilters.organized.filter(value => value !== organizedValue)
      : [...draftFilters.organized, organizedValue];
    updateDraft({ organized: newOrganized });
  }, [draftFilters.organized, updateDraft]);

  // Apply draft changes and close
  const handleApply = useCallback(() => {
    onFiltersChange(draftFilters);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [draftFilters, onFiltersChange]);

  // Reset organized draft
  const handleReset = useCallback(() => {
    updateDraft({ organized: [] });
  }, [updateDraft]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, organizedOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < organizedOptions.length) {
          toggleOrganizedDraft(organizedOptions[focusedIndex].value);
        }
        break;
    }
  }, [isOpen, focusedIndex, toggleOrganizedDraft]);

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
  const selectedCount = draftFilters.organized.length;
  const appliedCount = filters.organized.length;

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
          aria-controls="organized-listbox"
          aria-label={appliedCount > 0 ? `${isMobile ? 'Setup' : 'Beach setup'}, ${appliedCount} selected` : (isMobile ? 'Setup' : 'Beach setup')}
          data-testid="organized-trigger"
          id="organized-trigger"
        >
          <Waves className="h-4 w-4 mr-2" />
          {isMobile ? 'Setup' : 'Beach setup'}
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
        data-testid="organized-panel"
        id="organized-panel"
      >
        {/* List */}
        <div 
          ref={listRef}
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Beach setup options"
          id="organized-listbox"
        >
          {organizedOptions.map((option, index) => {
            const isSelected = draftFilters.organized.includes(option.value);
            const isFocused = focusedIndex === index;
            
            return (
              <button
                key={option.value}
                data-index={index}
                onClick={() => toggleOrganizedDraft(option.value)}
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
              Clear
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

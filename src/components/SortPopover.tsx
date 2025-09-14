import { ArrowUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FilterState } from '@/hooks/useUrlState';

interface SortPopoverProps {
  filters: FilterState;
  onSortChange: (sort: FilterState['sort']) => void;
  userLocation: GeolocationPosition | null;
  children?: React.ReactNode;
}

const sortOptions = [
  { value: 'name.asc', label: 'Name A–Z' },
  { value: 'name.desc', label: 'Name Z–A' },
  { value: 'distance.asc', label: 'Distance (Near to Far)', requiresLocation: true },
  { value: 'distance.desc', label: 'Distance (Far to Near)', requiresLocation: true },
];

export default function SortPopover({
  filters,
  onSortChange,
  userLocation,
  children,
}: SortPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className="flex items-center gap-2 h-10 px-4 rounded-full border-2 hover:border-primary/50 transition-colors"
            aria-label="Open sort options"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Sort by</h4>
          <RadioGroup
            value={filters.sort}
            onValueChange={(value) => onSortChange(value as FilterState['sort'])}
          >
            {sortOptions.map((option) => {
              const isDisabled = option.requiresLocation && (!userLocation || !filters.nearMe);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`sort-${option.value}`}
                    disabled={isDisabled}
                  />
                  <Label 
                    htmlFor={`sort-${option.value}`} 
                    className={`text-sm cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}
                  >
                    {option.label}
                    {isDisabled && <span className="text-xs text-muted-foreground ml-1">(requires location)</span>}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}

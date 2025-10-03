import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RelaxationStep } from '@/hooks/useFilterRelaxation';

interface RelaxationBannerProps {
  steps: RelaxationStep[];
  onApplyRelaxation: () => void;
}

export function RelaxationBanner({ steps, onApplyRelaxation }: RelaxationBannerProps) {
  const stepLabels = steps.map(s => s.label).join(', ');
  
  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="ml-2 flex items-center justify-between">
        <span className="text-blue-900">
          No exact matches found. Try relaxing: <strong>{stepLabels}</strong>
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onApplyRelaxation}
          className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          Show relaxed results
        </Button>
      </AlertDescription>
    </Alert>
  );
}

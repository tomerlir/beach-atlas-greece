import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateAreaUrl } from '@/lib/utils';

interface PlaceMismatchNotificationProps {
  searchedPlace: string;
  currentArea: string;
  onDismiss?: () => void;
  className?: string;
}

export default function PlaceMismatchNotification({
  searchedPlace,
  currentArea,
  onDismiss,
  className = '',
}: PlaceMismatchNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  // Generate area page URL for the searched place
  const areaUrl = generateAreaUrl(searchedPlace);

  return (
    <div className={`bg-secondary/10 border border-secondary/20 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0 mt-1.5"></div>
            <p className="text-sm font-medium text-foreground">
              Different location detected
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            You searched for <span className="font-semibold">{searchedPlace}</span>, but you're viewing{' '}
            <span className="font-semibold">{currentArea}</span>.
          </p>
          <Link
            to={areaUrl}
            className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            Go to {searchedPlace} results
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-secondary hover:text-secondary/80 hover:bg-secondary/10"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

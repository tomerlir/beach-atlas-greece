import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, MapPin, RefreshCw } from "lucide-react";

interface GeolocationErrorBannerProps {
  onRetry: () => void;
  onDismiss: () => void;
  isRetrying?: boolean;
}

export const GeolocationErrorBanner = ({
  onRetry,
  onDismiss,
  isRetrying = false,
}: GeolocationErrorBannerProps) => {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800">
      <MapPin className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Location access failed. Distance sorting and badges are disabled.</span>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-7 px-3 text-xs border-amber-300 hover:bg-amber-100"
          >
            {isRetrying ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-7 w-7 p-0 hover:bg-amber-100"
            aria-label="Dismiss location error"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MapsSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  beachName: string;
  areaName?: string;
}

export const MapsSelectionDialog = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  beachName,
  areaName,
}: MapsSelectionDialogProps) => {
  const [isOpening, setIsOpening] = useState(false);

  const openInGoogleMaps = () => {
    setIsOpening(true);
    // Prefer name-based search so Maps shows a friendly label. Fallback to coords.
    const query = encodeURIComponent(areaName ? `${beachName}, ${areaName}` : beachName);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
    setTimeout(() => {
      setIsOpening(false);
      onClose();
    }, 1000);
  };

  const openInAppleMaps = () => {
    setIsOpening(true);
    // Use name-based query with coordinates hint so label appears pretty but position remains accurate
    const name = encodeURIComponent(areaName ? `${beachName}, ${areaName}` : beachName);
    const url = `https://maps.apple.com/?q=${name}&ll=${latitude},${longitude}`;
    window.open(url, '_blank');
    setTimeout(() => {
      setIsOpening(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Open {beachName} in Maps
          </DialogTitle>
          <DialogDescription>
            Choose your preferred mapping application to view the beach location.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          <Button
            onClick={openInGoogleMaps}
            disabled={isOpening}
            className="w-full justify-start"
            variant="outline"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-secondary-foreground text-xs font-bold">G</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Google Maps</div>
                <div className="text-xs text-muted-foreground">View location with Google Maps</div>
              </div>
            </div>
          </Button>
          
          <Button
            onClick={openInAppleMaps}
            disabled={isOpening}
            className="w-full justify-start"
            variant="outline"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                <Navigation className="h-4 w-4 text-background" />
              </div>
              <div className="text-left">
                <div className="font-medium">Apple Maps</div>
                <div className="text-xs text-muted-foreground">View location with Apple Maps</div>
              </div>
            </div>
          </Button>
        </div>
        
        {isOpening && (
          <div className="text-center text-sm text-muted-foreground">
            Opening maps application...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

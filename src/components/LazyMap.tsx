import { useEffect } from "react";
import { useLazyLeaflet } from "@/hooks/useLazyLeaflet";
import { Beach } from "@/types/beach";
import { analytics } from "@/lib/analytics";

interface LazyMapProps {
  beaches: Beach[];
  selectedBeach: Beach | null;
  onBeachSelect: (beach: Beach) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const GREECE_BOUNDS = [
  [34.6, 19.0],
  [41.8, 29.6],
];

function FitBoundsOnData({
  beaches,
  fallbackBounds,
}: {
  beaches: Beach[];
  fallbackBounds: typeof GREECE_BOUNDS;
}) {
  const { leaflet } = useLazyLeaflet();

  useEffect(() => {
    if (!leaflet) return;

    // This would need to be implemented with the actual map instance
    // For now, this is a placeholder
  }, [leaflet, beaches, fallbackBounds]);

  return null;
}

function InvalidateSizeOnMount() {
  const { leaflet } = useLazyLeaflet();

  useEffect(() => {
    if (!leaflet) return;

    // This would need to be implemented with the actual map instance
    // For now, this is a placeholder
  }, [leaflet]);

  return null;
}

function MapEngagementTracker() {
  const { leaflet } = useLazyLeaflet();

  useEffect(() => {
    if (!leaflet) return;

    // This would need to be implemented with the actual map instance
    // For now, this is a placeholder
  }, [leaflet]);

  return null;
}

function PopupTracker({ beachId }: { beachId: string }) {
  useEffect(() => {
    // Track popup open event - using available analytics method
    analytics.event("map_popup_open", { beachId });
  }, [beachId]);

  return null;
}

const LazyMap = ({ beaches, selectedBeach, onBeachSelect, userLocation }: LazyMapProps) => {
  const { leaflet, isLoading, error } = useLazyLeaflet();

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load map</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!leaflet) {
    return (
      <div className="flex h-[600px] items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground">Map not available</p>
        </div>
      </div>
    );
  }

  const { L, MapContainer, TileLayer, Marker, Popup } = leaflet;

  // Configure Leaflet icons
  const defaultMarkerIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });

  const selectedMarkerIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [35, 51],
    iconAnchor: [17, 51],
    popupAnchor: [1, -44],
    tooltipAnchor: [16, -38],
    shadowSize: [51, 51],
    className: "selected-marker",
  });

  return (
    <div className="h-[600px] w-full">
      <MapContainer
        center={[38.0, 23.5]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={true}
        bounds={GREECE_BOUNDS}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBoundsOnData beaches={beaches} fallbackBounds={GREECE_BOUNDS} />
        <InvalidateSizeOnMount />
        <MapEngagementTracker />

        {beaches.map((beach) => {
          if (beach.latitude == null || beach.longitude == null) return null;

          const isSelected = selectedBeach?.id === beach.id;

          return (
            <Marker
              key={beach.id}
              position={[beach.latitude, beach.longitude]}
              icon={isSelected ? selectedMarkerIcon : defaultMarkerIcon}
              eventHandlers={{
                click: () => onBeachSelect(beach),
              }}
            >
              <Popup>
                <PopupTracker beachId={beach.id} />
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1">{beach.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{beach.area}</p>
                  <button
                    onClick={() => onBeachSelect(beach)}
                    className="text-xs text-primary hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={
              new L.Icon({
                iconUrl:
                  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                className: "user-location-marker",
              })
            }
          >
            <Popup>
              <div className="p-2">
                <p className="text-sm font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LazyMap;

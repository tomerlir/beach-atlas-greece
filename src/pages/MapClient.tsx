// MapClient: contains all Leaflet/react-leaflet code. This module touches
// `window` at load time (Leaflet does), so it MUST only be imported on the
// client. Map.tsx wraps it behind a mounted gate + React.lazy.
import { useEffect, useRef } from "react";
import BeachCard from "@/components/BeachCard";
import { Beach } from "@/types/beach";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";
import { useBeachFiltering } from "@/hooks/useBeachFiltering";
import ErrorBoundary from "@/components/ErrorBoundary";
import { analytics } from "@/lib/analytics";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useUrlState } from "@/hooks/useUrlState";

// Leaflet + React-Leaflet (browser-only)
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

// Fix default icon paths for Vite builds
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const defaultMarkerIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(L.Marker as any).prototype.options.icon = defaultMarkerIcon;

const GREECE_BOUNDS: L.LatLngBoundsExpression = [
  [34.6, 19.0],
  [41.8, 29.6],
];

function FitBoundsOnData({
  beaches,
  fallbackBounds,
}: {
  beaches: Beach[];
  fallbackBounds: L.LatLngBoundsExpression;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (!beaches || beaches.length === 0) {
      if (fallbackBounds) map.fitBounds(fallbackBounds, { padding: [24, 24] });
      return;
    }
    const bounds = new L.LatLngBounds([]);
    beaches.forEach((b) => {
      if (b.latitude != null && b.longitude != null) {
        bounds.extend([b.latitude, b.longitude]);
      }
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    } else if (fallbackBounds) {
      map.fitBounds(fallbackBounds, { padding: [24, 24] });
    }
  }, [map, beaches, fallbackBounds]);
  return null;
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const invalidate = () => {
      try {
        map.invalidateSize();
      } catch {
        // no-op
      }
    };
    const onResize = () => invalidate();
    const onVisibility = () => {
      if (!document.hidden) {
        setTimeout(invalidate, 50);
      }
    };
    const timeoutId = setTimeout(invalidate, 50);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [map]);
  return null;
}

function MapEngagementTracker() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const handleMoveEnd = () => analytics.trackMapInteraction();
    const handleZoomEnd = () => analytics.trackMapInteraction();
    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
    };
  }, [map]);
  return null;
}

function PopupTracker({ beachId }: { beachId: string }) {
  const hasTracked = useRef(false);
  useEffect(() => {
    if (!hasTracked.current) {
      analytics.trackMapBeachView(beachId);
      hasTracked.current = true;
    }
  }, [beachId]);
  return null;
}

interface MapClientProps {
  beaches: Beach[];
  mapHeightClass: string;
}

const MapClient = ({ beaches, mapHeightClass }: MapClientProps) => {
  const { filters } = useUrlState();
  const { location, error: locationError } = useGeolocation();

  const beachesWithDistance = useDistanceCalculation(beaches, location, filters.nearMe);
  const filteredBeaches = useBeachFiltering(beachesWithDistance, filters, location);

  return (
    <ErrorBoundary>
      <div
        className={`w-full rounded-xl overflow-hidden border border-border/30 shadow-sm ${mapHeightClass} leaflet-popup-contrast relative z-0`}
      >
        <style>
          {`
          .leaflet-popup-contrast .leaflet-popup-close-button {
            color: #e5e7eb !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.4);
            opacity: 1 !important;
          }
          .leaflet-popup-contrast .leaflet-popup-close-button:hover {
            color: #f3f4f6 !important;
            text-shadow: 0 2px 4px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.5);
          }
          `}
        </style>
        <MapContainer className="w-full h-full" bounds={GREECE_BOUNDS}>
          <InvalidateSizeOnMount />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />

          <FitBoundsOnData beaches={filteredBeaches as Beach[]} fallbackBounds={GREECE_BOUNDS} />
          <MapEngagementTracker />

          {filteredBeaches
            .filter((b) => b.latitude != null && b.longitude != null)
            .map((b) => (
              <Marker key={b.id} position={[b.latitude as number, b.longitude as number]}>
                <Popup>
                  <div className="max-w-[340px]">
                    <PopupTracker beachId={b.id} />
                    <BeachCard
                      beach={b as Beach}
                      distance={(b as Beach & { distance?: number }).distance}
                      showDistance={filters.nearMe && !locationError && !!location}
                      engagementSource="map"
                    />
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </ErrorBoundary>
  );
};

export default MapClient;

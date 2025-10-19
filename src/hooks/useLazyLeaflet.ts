import React, { useState, useEffect, useRef } from "react";

// Leaflet Icon interface based on actual usage
interface LeafletIcon {
  new (options: {
    iconUrl: string;
    iconRetinaUrl?: string;
    shadowUrl?: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    popupAnchor?: [number, number];
    tooltipAnchor?: [number, number];
    shadowSize?: [number, number];
    className?: string;
  }): {
    iconUrl: string;
    iconRetinaUrl?: string;
    shadowUrl?: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    popupAnchor?: [number, number];
    tooltipAnchor?: [number, number];
    shadowSize?: [number, number];
    className?: string;
  };
}

// Leaflet main object interface based on actual usage
interface LeafletL {
  Icon: LeafletIcon;
}

// Map instance interface based on Leaflet Map type
interface LeafletMap {
  // This represents the actual Leaflet Map instance
  // We don't need to define all methods since it's not directly used in this hook
  [key: string]: unknown;
}

// MapContainer props based on actual usage in LazyMap component
interface MapContainerProps {
  center: [number, number];
  zoom: number;
  className?: string;
  scrollWheelZoom?: boolean;
  bounds?: [number, number][];
  maxZoom?: number;
  updateWhenIdle?: boolean;
  updateWhenZooming?: boolean;
  zoomControl?: boolean;
  attributionControl?: boolean;
  children?: React.ReactNode;
}

// TileLayer props based on actual usage
interface TileLayerProps {
  attribution: string;
  url: string;
  maxZoom?: number;
  updateWhenIdle?: boolean;
  updateWhenZooming?: boolean;
}

// Marker props based on actual usage
interface MarkerProps {
  position: [number, number];
  icon?: LeafletIcon;
  eventHandlers?: {
    click?: () => void;
  };
  children?: React.ReactNode;
}

// Popup props based on actual usage
interface PopupProps {
  children?: React.ReactNode;
}

// React-Leaflet component types with proper interfaces
interface LeafletModules {
  L: LeafletL;
  MapContainer: React.ComponentType<MapContainerProps>;
  TileLayer: React.ComponentType<TileLayerProps>;
  Marker: React.ComponentType<MarkerProps>;
  Popup: React.ComponentType<PopupProps>;
  useMap: () => LeafletMap;
}

interface UseLazyLeafletReturn {
  leaflet: LeafletModules | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to lazily load Leaflet dependencies only when needed
 * This prevents the large Leaflet library from being included in the main bundle
 */
export const useLazyLeaflet = (): UseLazyLeafletReturn => {
  const [leaflet, setLeaflet] = useState<LeafletModules | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      if (leaflet || isLoadingRef.current) return;

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import Leaflet dependencies
        const [leafletModule, reactLeafletModule] = await Promise.all([
          import("leaflet"),
          import("react-leaflet"),
        ]);

        // Import Leaflet CSS
        await import("leaflet/dist/leaflet.css");

        if (isMounted) {
          setLeaflet({
            L: leafletModule.default,
            MapContainer: reactLeafletModule.MapContainer,
            TileLayer: reactLeafletModule.TileLayer,
            Marker: reactLeafletModule.Marker,
            Popup: reactLeafletModule.Popup,
            useMap: reactLeafletModule.useMap,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to load Leaflet modules"));
        }
      } finally {
        if (isMounted) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, [leaflet]); // Only include leaflet in dependencies

  return { leaflet, isLoading, error };
};

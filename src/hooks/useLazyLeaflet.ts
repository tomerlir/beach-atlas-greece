import React, { useState, useEffect } from "react";

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

// React-Leaflet component types - using proper typing for React components
// Using React.ComponentType with any props since these are external components
// with complex prop interfaces that we don't need to fully type here
interface LeafletModules {
  L: LeafletL;
  MapContainer: React.ComponentType<any>;
  TileLayer: React.ComponentType<any>;
  Marker: React.ComponentType<any>;
  Popup: React.ComponentType<any>;
  useMap: () => any; // Map instance - keeping as any since it's not directly used in the component
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

  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      if (leaflet || isLoading) return;

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
          setIsLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, []); // Remove leaflet and isLoading from dependencies to prevent infinite loop

  return { leaflet, isLoading, error };
};

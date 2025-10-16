/**
 * Maps utility functions for opening native mapping applications
 * Industry standard: Detect device and open appropriate maps app directly
 */

interface MapLocation {
  latitude: number;
  longitude: number;
  name: string;
  area?: string;
}

/**
 * Detects if the user is on an iOS device
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Detects if the user is on an Android device
 */
export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

/**
 * Opens the location in the user's default/native maps application
 * - iOS devices: Opens Apple Maps
 * - Android devices: Opens Google Maps
 * - Desktop: Opens Google Maps in browser
 *
 * @param location - The location details to open in maps
 */
export const openInMaps = (location: MapLocation): void => {
  const { latitude, longitude, name, area } = location;
  const fullName = area ? `${name}, ${area}` : name;
  const encodedName = encodeURIComponent(fullName);

  // iOS devices - Open Apple Maps
  if (isIOS()) {
    // Try native app first, fallback to web
    const appleMapsUrl = `maps://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`;
    const webFallback = `https://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`;

    // Attempt to open native app
    window.location.href = appleMapsUrl;

    // Fallback to web version after a short delay if app didn't open
    setTimeout(() => {
      window.open(webFallback, "_blank");
    }, 500);
    return;
  }

  // Android devices - Open Google Maps
  if (isAndroid()) {
    // Try native app first using geo: scheme
    const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`;
    const webFallback = `https://www.google.com/maps/search/?api=1&query=${encodedName}&query_place_id=${latitude},${longitude}`;

    // Attempt to open native app
    window.location.href = geoUrl;

    // Fallback to web version after a short delay if app didn't open
    setTimeout(() => {
      window.open(webFallback, "_blank");
    }, 500);
    return;
  }

  // Desktop or other devices - Open Google Maps in browser
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
  window.open(googleMapsUrl, "_blank");
};

/**
 * Opens Google Maps specifically (useful as a fallback option)
 */
export const openInGoogleMaps = (location: MapLocation): void => {
  const { name, area } = location;
  const query = encodeURIComponent(area ? `${name}, ${area}` : name);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(url, "_blank");
};

/**
 * Opens Apple Maps specifically (useful as a fallback option)
 */
export const openInAppleMaps = (location: MapLocation): void => {
  const { latitude, longitude, name, area } = location;
  const encodedName = encodeURIComponent(area ? `${name}, ${area}` : name);
  const url = `https://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`;
  window.open(url, "_blank");
};

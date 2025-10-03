import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = (): ServiceWorkerState => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
  });

  useEffect(() => {
    // Don't register service worker in development
    if (import.meta.env.DEV) {
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    let registration: ServiceWorkerRegistration | null = null;
    let updateHandler: (() => void) | null = null;

    // Register service worker
    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Handle updates
        updateHandler = () => {
          const newWorker = registration?.installing;
          if (newWorker) {
            const stateChangeHandler = () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            };
            newWorker.addEventListener('statechange', stateChangeHandler);
          }
        };

        registration.addEventListener('updatefound', updateHandler);

      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerSW();

    // Handle online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // Clean up event listeners
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Clean up service worker registration
      if (registration && updateHandler) {
        registration.removeEventListener('updatefound', updateHandler);
      }
      
      // Clear registration reference
      setState(prev => ({ ...prev, registration: null }));
    };
  }, []);

  return state;
};

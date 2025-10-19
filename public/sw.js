// Service Worker for Image Caching and Performance
const CACHE_NAME = 'beach-atlas-v2';
const IMAGE_CACHE_NAME = 'beach-images-v2';
const STATIC_CACHE_NAME = 'beach-static-v2';
const PRECACHE_CACHE_NAME = 'beach-precache-v2';

// Cache duration for different types of resources
const CACHE_DURATIONS = {
  images: 3 * 24 * 60 * 60 * 1000, // 3 days (reduced from 7)
  static: 24 * 60 * 60 * 1000, // 1 day
  api: 5 * 60 * 1000, // 5 minutes
  precache: 7 * 24 * 60 * 60 * 1000, // 7 days for precached assets
};

// Install event - cache static assets and precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          // Add other static assets as needed
        ]);
      }),
      // Precache critical routes and assets
      caches.open(PRECACHE_CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/areas',
          '/map',
          '/about',
          '/guide',
          // Precache core UI chunks (these will be populated by build process)
        ]);
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== PRECACHE_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle image requests with cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Image caching strategy - cache first with fallback
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    if (cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATIONS.images) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone the response and add cache timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a placeholder image if no cache available
    return new Response(
      '<svg width="400" height="225" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="225" fill="#e2e8f0"/><text x="200" y="112" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="14">Image unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// API caching strategy - network first with cache fallback
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATIONS.api) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Static asset caching strategy - cache first with stale-while-revalidate
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // For HTML documents, implement stale-while-revalidate
    if (request.destination === 'document') {
      // Return cached version immediately
      fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
        }
      }).catch(() => {
        // Ignore network errors for background updates
      });
    }
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return a basic offline page for document requests
    if (request.destination === 'document') {
      return new Response(
        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // For example, retry failed image loads
  console.log('Background sync triggered');
}

// Service Worker for Trip Tracker PWA
const CACHE_NAME = 'cache-trip-tracker-v0.0.8';

const urlsToCache = [
  "/",
  "/index.html",
  "/logo-trip-expense-tracker.png",
  "/manifest.json",
  "/robots.txt",
  "/app.js",
  "/appsettings.js",
  "/appstyle.css",
  "/config.js",
  "/crypto-js.min.js",
  "/dataset-manager-test.html",
  "/dataset-manager.js",
  "/faq.js",
  "/profile.js",
  "/settings.js",
  "/style.css",
  "/sw.js",
  "/data/ads_master.min.json",
  "/data/attractions_master.min.json",
  "/data/checklist_master.min.json",
  "/data/field_options.min.json",
  "/data/itinerary_master.min.json",
  "/data/keymap.min.json",
  "/data/questions_master.min.json",
  "/data/version.json"
];

// Install event: Caches all static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching all assets.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Failed to cache all assets:', error);
      })
  );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: Handles all network requests
self.addEventListener('fetch', (event) => {
  // Strategy for navigation requests (main HTML page)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return the cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, try to fetch from the network
        return fetch(event.request).catch(() => {
          // If network is offline, return the main index page from cache
          return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Strategy for all other assets (scripts, styles, images, data)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        return response;
      }
      
      // If not in cache, fetch from the network
      return fetch(event.request).then((fetchResponse) => {
        // If the fetch is successful, cache the new response
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      }).catch(() => {
        // Optional: Provide a fallback for specific asset types if needed
        // For example, an offline image for image requests
      });
    })
  );
});
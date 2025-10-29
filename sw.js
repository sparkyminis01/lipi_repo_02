// Service Worker for Trip Tracker PWA
// *** IMPORTANT: CHANGE THE VERSION NUMBER BELOW ON EVERY DEPLOYMENT! ***
const CACHE_NAME = 'cache-trip-tracker-v1.0.0'; // FINAL BUMPED VERSION

// List of all assets to pre-cache on install (Cache-First strategy)
const urlsToCache = [
  "/",
  "/index.html",
  "/logo-trip-expense-tracker.png",
  "/logo.png",
  "/manifest.json",
  "/robots.txt",
  "/app.js",
  "/appsettings.js",
  "/appstyle.css",
  "/config.js",
  "/crypto-js.min.js",
  "/font-awesome.min.css",
  "/dataset-manager.js",
  "/faq.js",
  "/profile-auth.js",
  "/settings.js",
  "/style.css",
  "/sw.js",
  "/data/checklist_master.min.json",
  "/data/field_options.min.json",
  "/data/keymap.min.json",
  "/data/questions_master.min.json",
  "/data/version.json"
];

// Scripts that must always try to fetch the freshest version (Network-First strategy)
const CRITICAL_SCRIPTS = ['/app.js', '/profile-auth.js'];


// Install event: Caches all static assets and forces activation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching all assets.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forces the worker to skip the waiting state
      .catch((error) => {
        console.error('Service Worker: Failed to cache all assets:', error);
      })
  );
});

// Activate event: Cleans up old caches and claims clients
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
    .then(() => self.clients.claim()) // Ensures immediate control of all tabs
  );
});

// Fetch event: Handles all network requests with specific strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy for navigation requests (main HTML page)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          // Fallback to cached index.html if offline
          return caches.match('/index.html');
        });
      })
    );
    return;
  }
  
  // STRATEGY: Network-Falling-Back-to-Cache for critical dynamic scripts
  const isDynamicScript = CRITICAL_SCRIPTS.some(script => url.pathname.endsWith(script));

  if (isDynamicScript) {
    event.respondWith(
      fetch(event.request).then((fetchResponse) => {
        // Only cache if the fetch was successful (status 200)
        if (fetchResponse.status === 200 && fetchResponse.type === 'basic') {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        // Return the network response (successful or error)
        return fetchResponse;
      }).catch(() => {
        // If network fails (offline), fall back to the cache.
        console.log(`Service Worker: Network failed, serving cached fallback for ${url.pathname}`);
        return caches.match(event.request);
      })
    );
    return;
  }

  // STRATEGY: Cache-First, then Network for all other static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found (fastest)
      if (response) {
        return response;
      }
      
      // If not in cache, fetch from the network
      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      }).catch(() => {
        // Final fallback (no action needed here for this PWA)
      });
    })
  );
});
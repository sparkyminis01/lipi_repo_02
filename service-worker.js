const STATIC_CACHE = 'lipikit-static-v1';
const DYNAMIC_CACHE = 'lipikit-dynamic-v1';

// Only cache resources we can actually cache (no external CDN resources due to CORS)
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/tailwind.css',      // Add this line
    '/crypto-js.min.js'   // Add this line
];

// Install event: Cache essential assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                // Only try to cache resources that won't fail due to CORS
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('Service Worker: Failed to cache assets', error);
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

// Fetch event: Handle navigation and resource requests
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    
    // Skip external CDN requests that cause CORS issues - let them load normally
    if (requestUrl.hostname !== location.hostname && 
        (requestUrl.hostname.includes('cdn.') || 
         requestUrl.hostname.includes('cdnjs.') ||
         requestUrl.hostname.includes('fonts.g'))) {
        return; // Let the browser handle these normally
    }

    // Handle navigation requests (e.g., start_url or index.html)
    if (event.request.mode === 'navigate' || 
        requestUrl.pathname === '/' || 
        requestUrl.pathname === '/index.html') {
        
        event.respondWith(
            // Try cache first for offline-first experience
            caches.match('/index.html')
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('Service Worker: Serving cached index.html');
                        return cachedResponse;
                    }
                    
                    // If not cached, try network
                    return fetch(event.request)
                        .then((networkResponse) => {
                            return caches.open(DYNAMIC_CACHE).then((cache) => {
                                cache.put('/index.html', networkResponse.clone());
                                return networkResponse;
                            });
                        });
                })
                .catch((error) => {
                    console.error('Service Worker: Both cache and network failed', error);
                    // Return a basic offline page or the cached version
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // Handle same-origin requests only
    if (requestUrl.hostname === location.hostname) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse.status === 200) {
                                return caches.open(DYNAMIC_CACHE).then((cache) => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            return caches.match('/index.html');
                        });
                })
        );
    }
});
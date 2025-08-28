const CACHE_NAME = 'trip-tracker-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
    'https://fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
              .then((cache) => {
                  console.log('Opened cache');
                  return cache.addAll(urlsToCache);
              })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
              .then((response) => {
                  // Cache hit - return response
                  if (response) {
                      return response;
                  }
                  // No cache hit - fetch from network
                  return fetch(event.request);
              })
    );
});

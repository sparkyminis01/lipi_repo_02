// Service Worker for Trip Tracker PWA
const CACHE_NAME = 'cache-trip-tracker-v0.0.4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-trip-expense-tracker.png',
  '/app.js',
  '/appsettings.js',
  '/config.js',
  '/crypto-js.min.js',
  '/dataset-manager.js',
  '/faq.js',
  '/profile.js',
  '/settings.js',
  '/style.css',
  '/appstyle.css',
  '/data/checklist_master.min.json',
  '/data/field_options.min.json',
  '/data/keymap.min.json',
  '/data/questions_master.min.json',
  '/data/version.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch(() => {
          // If both cache and network fail, return a basic offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
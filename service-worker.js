const CACHE_NAME = 'focusflow-cache-v1'; // Change version when updating assets
const urlsToCache = [
  '/', // Or '.' or '/index.html' depending on your server setup
  '/index.html', // Explicitly cache index.html
  '/style.css', // Cache the main stylesheet
  // Add all your core JavaScript files
  '/js/domElements.js', //
  '/js/state.js',       //
  '/js/utils.js',       //
  '/js/storage.js',     //
  '/js/audio.js',       //
  '/js/ui.js',          //
  '/js/timer.js',       //
  '/js/projects.js',    //
  '/js/tasks.js',       //
  '/js/nlpTimeParser.js',//
  '/js/log.js',         //
  '/js/modals.js',      //
  '/js/importExport.js',//
  '/js/inactivity.js',  //
  '/js/summary.js',     //
  '/js/reminders.js',   //
  '/js/main.js',        //
  // Add essential external libraries if hosted locally, or rely on network for CDNs
  // '/path/to/your/icon-192x192.png', // Cache icons
  // '/path/to/your/icon-512x512.png'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Force activation
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Fetch event: Serve from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            // Cache the new response for future requests (optional)
            // You might want more sophisticated caching here
            /*
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            */

            return networkResponse;
          }
        );
      })
      .catch(error => {
        // Handle fetch errors, maybe return an offline fallback page
        console.error('Fetching failed:', error);
        // Optional: Return a basic offline page/resource
        // return caches.match('/offline.html');
      })
  );
});
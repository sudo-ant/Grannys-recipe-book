
const CACHE_NAME = 'grannys-recipes-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './recipe.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/recipe.js',
  './data/recipes.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

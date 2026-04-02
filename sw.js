const CACHE_NAME = 'grannys-recipes-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './recipe.html',
  './css/style.css',
  './js/app.js',
  './js/recipe.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  const isRecipeData =
    url.pathname.endsWith('/data/recipes.json') ||
    url.pathname.endsWith('/manifest.json');

  const isPageNavigation = event.request.mode === 'navigate';

  if (isRecipeData || isPageNavigation) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => { });
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(networkResponse => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => { });
        return networkResponse;
      });
    })
  );
});
const CACHE_VERSION = 'compass-static-v4';
const APP_SHELL_ASSETS = [
  '/assets/icons/favicon/site.webmanifest',
  '/assets/icons/favicon/apple-touch-icon.png',
  '/assets/icons/favicon/favicon-16x16.png',
  '/assets/icons/favicon/favicon-32x32.png',
  '/assets/icons/favicon/android-chrome-192x192.png',
  '/assets/icons/favicon/android-chrome-512x512.png',
  '/assets/icons/favicon/maskable-icon-192x192.png',
  '/assets/icons/favicon/maskable-icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});

/**
 * MIIS Offline-First Maritime Service Worker (v2)
 * -----------------------------------------------
 * Caches the application shell so Sri Lankan fishers can launch the app,
 * lock hardware GNSS coordinates, capture photos, and queue reports with
 * ZERO cellular connectivity at sea. API POSTs pass straight through so the
 * app's IndexedDB two-phase sync engine handles beacon vs deferred media sync.
 */

const CACHE_NAME = 'miis-maritime-shell-v2';
const CORE_ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls or non-GET requests (IndexedDB queue owns offline API sync)
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for HTML navigations, falling back to cached shell offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for static assets & map tiles
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && (url.origin === self.location.origin || url.hostname.includes('cartocdn'))) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

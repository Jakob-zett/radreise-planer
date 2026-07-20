// Radreise-Planer – Offline-Cache
// Cacht die App selbst, Leaflet (CDN) und alle besuchten Karten-Tiles,
// damit unterwegs im Funkloch zumindest bereits gesehene Kartenausschnitte funktionieren.
const APP_CACHE = 'radreise-app-v5';
const STATIC_CACHE = 'radreise-static-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isTile = url.hostname.endsWith('cartocdn.com');
  const isCdn = url.hostname === 'cdnjs.cloudflare.com';

  if (isTile || isCdn) {
    // Cache-first: Tiles & Leaflet ändern sich praktisch nie
    e.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(e.request).then(hit =>
          hit || fetch(e.request).then(res => {
            if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
            return res;
          })
        )
      )
    );
  } else if (url.origin === self.location.origin) {
    // Network-first: App-Updates kommen an, offline greift der Cache
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(APP_CACHE).then(cache => cache.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});

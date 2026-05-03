const CACHE_NAME = 'mynav-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/radars.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS.filter(url => !url.includes('icon')));
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : réseau en priorité, cache en fallback
self.addEventListener('fetch', (event) => {
  // Les tuiles OSM et les APIs externes ne sont jamais mises en cache
  const url = event.request.url;
  if (url.includes('tile.openstreetmap.org') ||
      url.includes('nominatim.openstreetmap.org') ||
      url.includes('openrouteservice.org') ||
      url.includes('unpkg.com')) {
    return; // laisse passer normalement
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Met en cache la réponse fraîche
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, utilise le cache
        return caches.match(event.request);
      })
  );
});

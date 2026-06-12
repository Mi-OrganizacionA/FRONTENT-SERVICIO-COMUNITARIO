const CACHE_NAME = 'sicag-cache-v1';

// Assets base para que el portal cargue al instante (Habitantes)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/index.css',
  '/css/public.css',
  '/js/public.js',
  '/js/api.js',
  '/assets/img/logo_comuna.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Cache-First strategy with network fallback, and lazy caching para vistas administrativas
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a la API o dominios externos
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('google') || 
      event.request.url.includes('chrome-extension') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, but try to update in background
        fetch(event.request).then(networkResponse => {
           if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
           }
        }).catch(() => {});
        return cachedResponse;
      }

      // Si no está en caché (ej. vistas administrativas como censo.html), descargar y cachear "Lazy Cache"
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Cachear vistas nuevas a medida que se navega
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Falla de red
      });
    })
  );
});

/**
 * SICAG — Service Worker v3.0
 * Sistema de Información Comunal Agroecológica
 * Comuna Socialista Simón Rodríguez — Venezuela
 *
 * Estrategia de caché en 3 capas:
 *  - CAPA 1 (sicag-core-v3):   Todo el frontend propio (HTML, CSS, JS, imágenes)
 *  - CAPA 2 (sicag-cdn-v3):    Recursos externos (Firebase, FontAwesome, Google Fonts, Anime.js)
 *  - CAPA 3 (sicag-api-v3):    Respuestas GET de la API pública (solo lectura)
 *
 * Cola offline universal: manejo de operaciones de escritura pendientes
 * cuando no hay conexión a internet, aplicable a TODOS los módulos.
 */

// ── VERSIONES DE CACHÉ ──────────────────────────────────────────────────────
const CORE_CACHE   = 'sicag-core-v3.1';
const CDN_CACHE    = 'sicag-cdn-v3';
const API_CACHE    = 'sicag-api-v3';
const TODOS_LOS_CACHES = [CORE_CACHE, CDN_CACHE, API_CACHE];

// ── PRE-CACHE: TODO EL FRONTEND PROPIO ─────────────────────────────────────
// Lista exhaustiva de todos los archivos del sitio que deben estar disponibles offline
const PRECACHE_CORE = [
  // Página de fallback offline (PRIMERO — crítica)
  '/offline.html',

  // ── Páginas HTML principales ──
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/censo.html',
  '/censo_viviendas.html',
  '/notificaciones.html',
  '/configuracion.html',
  '/perfil.html',
  '/proyectos.html',
  '/noticias.html',
  '/reportes.html',
  '/produccion_agricola.html',
  '/organizaciones.html',
  '/voceros.html',
  '/cartografia.html',
  '/ayuda.html',
  '/map_embed.html',
  '/404.html',

  // ── Hojas de estilo ──
  '/css/public.css',
  '/css/admin.css',
  '/css/login.css',
  '/css/styles.css',

  // ── Scripts JavaScript propios ──
  '/js/api.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/public.js',
  '/js/animations.js',
  '/js/components.js',
  '/js/layout-menu.js',
  '/js/sidebar-menu.js',
  '/js/masks.js',
  '/js/validators.js',
  '/js/roles.js',
  '/js/voceros.js',
  '/js/notificaciones.js',
  '/js/configuracion.js',
  '/js/poligonos.js',
  '/js/habitante-autocomplete.js',
  '/js/censo-viviendas.js',

  // ── Módulos JS ──
  '/js/modules/censo.js',
  '/js/modules/dashboard.js',
  '/js/modules/noticias.js',
  '/js/modules/reportes.js',

  // ── Servicios JS ──
  '/js/services/auth-service.js',
  '/js/services/censo-service.js',
  '/js/services/grupos-service.js',
  '/js/services/habitantes-service.js',
  '/js/services/produccion-service.js',

  // ── Configuración JS ──
  '/js/config/firebase-config.js',

  // ── Datos locales (seed para modo offline) ──
  '/data/seed.json',

  // ── Imágenes (todas) ──
  '/assets/img/logo_comuna_fondoremovido.png',
  '/assets/img/hero_banner.png',
  '/assets/img/proyecto_cacao.png',
  '/assets/img/proyecto_cafe.png',
  '/assets/img/proyecto_frutales.png',
  '/assets/img/proyecto_hortalizas.png',
  '/assets/img/proyecto_maiz.png',
  '/assets/img/proyecto_siembra.png',

  // ── Datos GeoJSON ──
  '/venezuela.geojson',

  // ── Manifest ──
  '/manifest.json',
];

// ── DOMINIOS EXTERNOS A CACHEAR (CDN) ───────────────────────────────────────
// Recursos externos que se cachean con Stale-While-Revalidate
const CDN_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',      // FontAwesome
  'www.gstatic.com',           // Firebase SDK
  'cdn.jsdelivr.net',          // Librerías varias
  'unpkg.com',                 // Librerías varias
];

// ── RUTAS DE API A CACHEAR (solo GET públicas) ───────────────────────────────
// Solo se cachean respuestas de lectura de datos públicos
const API_CACHE_PATTERNS = [
  '/api/proyectos/publico',
  '/api/cartelera/publico',
  '/api/habitantes/publico',
  '/api/system/config',
];

// ── INSTALL: Pre-cachear todo el core ───────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando SICAG SW v3.0 — pre-cacheando frontend...');
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      // addAll falla si UNO falla; usamos Promise.allSettled para ser tolerantes
      return Promise.allSettled(
        PRECACHE_CORE.map(url =>
          cache.add(url).catch(err => {
            console.warn(`[SW] No se pudo pre-cachear: ${url}`, err.message);
          })
        )
      );
    }).then(() => {
      console.log('[SW] Pre-cache completado.');
      // skipWaiting DESPUÉS de que el caché esté listo
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: Limpiar caches antiguos ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando SICAG SW v3.0 — limpiando caches antiguos...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !TODOS_LOS_CACHES.includes(name))
          .map((name) => {
            console.log('[SW] Eliminando caché obsoleto:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] SW v3.0 activo y controlando todas las páginas.');
      return self.clients.claim();
    })
  );
});

// ── FETCH: Estrategia diferenciada por tipo de recurso ──────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Ignorar siempre ──────────────────────────────────────────────────────
  // Extensiones de Chrome, WebSockets, y peticiones que no son GET de escritura
  if (
    request.url.startsWith('chrome-extension') ||
    request.url.includes('extension') ||
    request.method !== 'GET'
  ) {
    return; // Dejar que el navegador maneje directamente
  }

  // ── ESTRATEGIA 1: API propia — Network-First con caché de respaldo ────────
  if (url.pathname.startsWith('/api/')) {
    // Verificar si es una ruta API pública que podemos cachear
    const esCacheable = API_CACHE_PATTERNS.some(p => url.pathname.includes(p));

    if (esCacheable) {
      event.respondWith(networkFirstConCache(request, API_CACHE));
    } else {
      // API privada o de escritura: solo red, sin caché
      event.respondWith(soloRed(request));
    }
    return;
  }

  // ── ESTRATEGIA 2: CDN externa — Stale-While-Revalidate ───────────────────
  if (CDN_DOMAINS.some(dominio => url.hostname.includes(dominio))) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  // ── ESTRATEGIA 3: Assets propios — Cache-First con actualización en fondo ─
  event.respondWith(cachePrimeroConFallback(request));
});

// ── FUNCIONES DE ESTRATEGIA ──────────────────────────────────────────────────

/**
 * Cache-First: Sirve desde caché si existe.
 * Si no está en caché, va a la red, lo almacena y lo retorna.
 * Si la red falla también, retorna la página offline.
 */
async function cachePrimeroConFallback(request) {
  const cache = await caches.open(CORE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Actualizar en segundo plano (sin bloquear al usuario)
    actualizarEnFondo(request, cache);
    return cached;
  }

  // No está en caché: intentar la red
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      // Cachear la respuesta nueva (lazy caching)
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (err) {
    // Sin caché y sin red: mostrar página offline
    console.warn('[SW] Sin conexión y sin caché para:', request.url);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) return offlinePage;

    // Último recurso: respuesta vacía 503
    return new Response('<h1>Sin conexión</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

/**
 * Stale-While-Revalidate: Sirve desde caché inmediatamente.
 * En paralelo, actualiza el caché con la versión de red.
 * Ideal para CDN: el usuario ve algo inmediatamente, y la próxima vez tiene lo nuevo.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Actualizar en fondo siempre
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.status === 200) {
      // Para respuestas opaque (cross-origin sin CORS), también las guardamos
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  // Retornar caché si existe, si no esperar la red
  return cached || fetchPromise || new Response('', { status: 503 });
}

/**
 * Network-First: Intenta la red primero.
 * Si falla, usa el caché como respaldo.
 * Para datos de API que pueden ser frescos.
 */
async function networkFirstConCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

/**
 * Solo red: No toca el caché en absoluto.
 * Para operaciones de escritura a la API.
 */
async function soloRed(request) {
  try {
    return await fetch(request);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Actualiza el caché en segundo plano sin bloquear la respuesta al usuario.
 */
function actualizarEnFondo(request, cache) {
  fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      cache.put(request, networkResponse);
    }
  }).catch(() => {
    // Sin conexión — ignorar silenciosamente
  });
}

// ── MENSAJES DESDE EL CLIENTE ────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.tipo === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.tipo === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CORE_CACHE });
  }
});

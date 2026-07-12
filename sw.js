/**
 * SICAG — Service Worker v3.0
 * Sistema de Información Comunal Agroecológica
 * Comuna Socialista Agroecológica Simón Rodríguez — Venezuela
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
// NOTA: Al pasar a v4, el activate limpia automáticamente los caches v3 anteriores.
const CORE_CACHE     = 'sicag-core-v6';
const CDN_CACHE      = 'sicag-cdn-v6';
const API_CACHE      = 'sicag-api-v6';
const PRIVATE_CACHE  = 'sicag-private-v6';
const TODOS_LOS_CACHES = [CORE_CACHE, CDN_CACHE, API_CACHE, PRIVATE_CACHE];

// ── CACHÉ PÚBLICO: lo mínimo que necesita cualquier visitante ───────────────
// Solo se cachea esto durante el install inicial del SW (antes del login).
// Regla: menos de 500KB en total. Sin módulos privados.
const PRECACHE_PUBLICO = [
  '/offline.html',
  '/',
  '/index.html',
  '/login.html',
  '/404.html',
  '/manifest.json',
  '/manifest-sistema.json',
  '/css/public.css',
  '/css/login.css',
  '/js/public.js',
  '/js/animations.js',
  '/js/login.js',
  '/js/auth.js',
  '/js/api.js',
  '/assets/img/logo_comuna_fondoremovido.webp',
  '/assets/img/hero_banner.webp',
];

// ── CACHÉ PRIVADO: todo lo que necesita un vocero o admin ──────────────────
// Se cachea SOLO cuando el usuario inicia sesión con rol 'vocero' o 'admin'.
// El SW recibe el mensaje 'CACHEAR_MODULOS_PRIVADOS' y ejecuta este precache.
const PRECACHE_PRIVADO = [
  // Páginas del sistema (solo accesibles con login)
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
  // CSS del panel privado
  '/css/admin.css',
  '/css/styles.css',
  // Scripts del panel privado
  '/js/app.js',
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
  '/js/modules/censo.js',
  '/js/modules/dashboard.js',
  '/js/modules/noticias.js',
  '/js/modules/reportes.js',
  '/js/services/auth-service.js',
  '/js/services/censo-service.js',
  '/js/services/grupos-service.js',
  '/js/services/habitantes-service.js',
  '/js/services/produccion-service.js',
  // Servicios de fases futuras — el SW los ignora si no existen (Promise.allSettled)
  '/js/services/sicag-db.js',
  '/js/services/sicag-conflict.js',
  '/js/config/firebase-config.js',
  // Datos
  '/data/seed.json',
  '/venezuela.geojson',
  '/manifest-sistema.json',
  'https://cdn.jsdelivr.net/npm/idb@8/build/umd.js',
  // Imágenes privadas (proyectos)
  '/assets/img/proyecto_cacao.webp',
  '/assets/img/proyecto_cafe.webp',
  '/assets/img/proyecto_frutales.webp',
  '/assets/img/proyecto_hortalizas.webp',
  '/assets/img/proyecto_maiz.webp',
  '/assets/img/proyecto_siembra.webp',
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

// ── INSTALL: Pre-cachear solo el núcleo público ──────────────────────────────
// En el install inicial solo cacheamos lo público (mínimo).
// Los módulos privados se cachean cuando el cliente envía 'CACHEAR_MODULOS_PRIVADOS'.
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando SICAG SW v4 — cacheando núcleo público...');
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      return Promise.allSettled(
        PRECACHE_PUBLICO.map(url =>
          cache.add(url).catch(err => {
            console.warn(`[SW] No se pudo pre-cachear público: ${url}`, err.message);
          })
        )
      );
    }).then(() => {
      console.log('[SW] Núcleo público cacheado. Esperando login para cachear módulos privados.');
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: Limpiar caches antiguos ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar CUALQUIER cache viejo incondicionalmente si no está en la lista actual
          if (!TODOS_LOS_CACHES.includes(cacheName)) {
            console.log('[SW] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
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
  // Extensiones de Chrome, WebSockets, peticiones no GET, y peticiones con credenciales
  if (
    request.url.startsWith('chrome-extension') ||
    request.url.includes('extension') ||
    request.method !== 'GET'
  ) {
    return; // Dejar que el navegador maneje directamente
  }

  // ── CRÍTICO: No interceptar peticiones con Authorization o credenciales ───
  // Esto evita que el SW interfiera con el flujo de token/refresh JWT.
  // Las peticiones autenticadas deben ir siempre directo a la red.
  if (
    request.headers.get('Authorization') ||
    request.credentials === 'include'
  ) {
    return; // El navegador maneja directamente sin pasar por el SW
  }

  // ── ESTRATEGIA 1: API propia — Network-First con caché de respaldo ────────
  if (url.pathname.startsWith('/api/') || url.hostname === 'sicag-api.onrender.com') {
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
  // Buscar en caché privado primero (tiene más recursos)
  const cachePrivado = await caches.open(PRIVATE_CACHE);
  const enPrivado = await cachePrivado.match(request);
  if (enPrivado) {
    actualizarEnFondo(request, cachePrivado);
    return enPrivado;
  }

  // Luego buscar en caché público
  const cachePublico = await caches.open(CORE_CACHE);
  const enPublico = await cachePublico.match(request);
  if (enPublico) {
    actualizarEnFondo(request, cachePublico);
    return enPublico;
  }

  // No está en caché: intentar la red
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      // Guardar en caché público por defecto (lazy caching)
      const responseToCache = networkResponse.clone();
      cachePublico.put(request, responseToCache);
    }
    return networkResponse;
  } catch (err) {
    console.warn('[SW] Sin conexión y sin caché para:', request.url);
    const offlinePage = await cachePublico.match('/offline.html');
    if (offlinePage) return offlinePage;
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
  const { tipo, payload } = event.data || {};

  // Saltar la espera y activar el nuevo SW inmediatamente
  if (tipo === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Retornar la versión actual del SW
  if (tipo === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CORE_CACHE });
  }

  // ── CACHEAR MÓDULOS PRIVADOS (se dispara tras login exitoso) ────────────────
  // El cliente envía este mensaje con el rol del usuario.
  // Solo se cachea si el rol es 'vocero' o 'admin'.
  if (tipo === 'CACHEAR_MODULOS_PRIVADOS') {
    const rol = payload?.rol || '';
    if (rol === 'admin' || rol === 'vocero') {
      console.log(`[SW] Usuario '${rol}' autenticado. Cacheando módulos privados...`);
      event.waitUntil(
        caches.open(PRIVATE_CACHE).then((cache) => {
          return Promise.allSettled(
            PRECACHE_PRIVADO.map(url =>
              cache.add(url).catch(err => {
                // No fallar si algún recurso no está disponible
                console.warn(`[SW] No se pudo cachear módulo privado: ${url}`, err.message);
              })
            )
          );
        }).then(() => {
          console.log('[SW] Módulos privados cacheados exitosamente.');
          // Notificar al cliente que el caché privado está listo
          self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({
              tipo: 'MODULOS_PRIVADOS_LISTOS',
              total: PRECACHE_PRIVADO.length
            }));
          });
        })
      );
    }
  }

  // ── LIMPIAR CACHÉ PRIVADO (se dispara en logout) ────────────────────────────
  if (tipo === 'LIMPIAR_CACHE_PRIVADO') {
    console.log('[SW] Logout detectado. Limpiando caché privado...');
    event.waitUntil(
      caches.delete(PRIVATE_CACHE).then(() => {
        console.log('[SW] Caché privado eliminado.');
      })
    );
  }
});

// ── BACKGROUND SYNC: Sincronizar cola al reconectar ──────────────────────────
// Este evento se dispara cuando el navegador detecta conexión Y hay un sync registrado.
// Funciona incluso si el usuario cerró la app (Android/Chrome con SW activo).
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento sync recibido:', event.tag);

  if (event.tag === 'sicag-sync-escritura') {
    // Notificar a todos los clientes activos para que procesen la cola
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: false }).then(clients => {
        if (clients.length > 0) {
          // Hay pestañas abiertas → notificar al cliente para que use su instancia de api.js
          clients.forEach(client => {
            client.postMessage({ tipo: 'EJECUTAR_FLUSH_COLA' });
          });
          console.log(`[SW] Notificados ${clients.length} clientes para sincronizar cola.`);
          return Promise.resolve();
        } else {
          // No hay clientes activos (app cerrada) → el SW sincroniza directamente
          // NOTA: No tenemos acceso a window.auth desde el SW, así que solo podemos
          // ejecutar operaciones que no necesiten token (limitado).
          // En la práctica, la mayoría de sync ocurre con clientes abiertos.
          console.log('[SW] No hay clientes activos. Sincronización en background no disponible sin sesión activa.');
          return Promise.resolve();
        }
      })
    );
  }

  if (event.tag === 'sicag-sync-censo') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ tipo: 'EJECUTAR_FLUSH_CENSO' });
        });
        return Promise.resolve();
      })
    );
  }
});

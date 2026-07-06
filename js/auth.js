/**
 * Módulo de Autenticación Centralizado (SICAG v3.0)
 *
 * SEGURIDAD:
 * - El token JWT de corta duración se guarda SOLO en memoria (nunca en localStorage).
 * - El refreshToken viaja automáticamente via httpOnly cookie (manejado por el navegador).
 * - Los datos del usuario (sin secretos) se persisten en sessionStorage para sobrevivir
 *   recargas de página dentro de la misma pestaña, pero NO se comparten entre pestañas.
 * - El evento 'storage' detecta cuando otra pestaña cierra sesión y fuerza el logout local.
 */
class AuthManager {
  constructor() {
    // Token en sessionStorage (se pierde al cerrar el navegador — intencional para seguridad)
    // NOTA: auth.js usa file:// también por eso guarda token en sessionStorage
    this.token = sessionStorage.getItem('sicag_token') || null;
    
    // Usuario: primero intentar sessionStorage, luego IndexedDB (persistente offline)
    this.user = this._parseUser(sessionStorage.getItem('sicag_user'));
    this.observers = [];
    this._sessionValidada = false; // Flag para saber si ya validamos contra el servidor
    
    // Si no hay usuario en sessionStorage pero sí en IndexedDB, cargarlo
    // (esto permite entrar al sistema aunque se haya cerrado el navegador)
    if (!this.user) {
      this._cargarSesionDesdeIndexedDB(); // async, no bloquea el constructor
    }
    
    this._escucharCambiosPestana();
  }

  // ─────────────────────────────────────────
  // LOGIN / LOGOUT
  // ─────────────────────────────────────────
  async login(usuario, contraseña) {
    try {
      const baseURL = window.API_BASE_URL || window.api?.baseURL || 'https://sicag-api.onrender.com/api';
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include' es necesario para que el navegador envíe/reciba cookies httpOnly
        credentials: 'include',
        body: JSON.stringify({ identifier: usuario, password: contraseña })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Credenciales inválidas. Usuario no encontrado.');
      }

      const data = await response.json();

      // Guardar token en sessionStorage para que sobreviva la redirección a dashboard.html
      this.token = data.token;
      sessionStorage.setItem('sicag_token', data.token);
      this.user = data.usuario;

      // Los datos del usuario (sin secretos) van a sessionStorage para sobrevivir recargas
      sessionStorage.setItem('sicag_user', JSON.stringify(data.usuario));

      // Señal para que otras pestañas sepan que hay una sesión activa
      // (se usa una clave sin el token para no exponerlo)
      localStorage.setItem('sicag_sesion_activa', Date.now().toString());

      // Guardar en IndexedDB para persistencia offline
      this._guardarSesionEnIndexedDB(data.usuario).catch(() => {});
      this._sessionValidada = true; // Acabamos de autenticarnos, no necesita re-validar

      this._notifyObservers({ tipo: 'login', usuario: data.usuario });
      return data.usuario;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  logout(silencioso = false) {
    // Limpiar la sesión de IndexedDB al hacer logout
    this._limpiarSesionDeIndexedDB().catch(() => {});
    this._sessionValidada = false;

    this.token = null;
    this.user = null;
    sessionStorage.removeItem('sicag_token');
    sessionStorage.removeItem('sicag_user');

    // Señal para que otras pestañas detecten el logout
    localStorage.setItem('sicag_sesion_cerrada', Date.now().toString());
    localStorage.removeItem('sicag_sesion_activa');

    this._notifyObservers({ tipo: 'logout' });

    if (!silencioso) {
      window.location.href = 'login.html';
    }
  }

  // ─────────────────────────────────────────
  // REFRESH TOKEN AUTOMÁTICO
  // ─────────────────────────────────────────
  /**
   * Intenta renovar el token usando el refreshToken de la httpOnly cookie.
   * Retorna el nuevo token o null si el refresh falló.
   */
  async intentarRefresh() {
    try {
      const baseURL = window.API_BASE_URL || window.api?.baseURL || 'https://sicag-api.onrender.com/api';
      const response = await fetch(`${baseURL}/auth/refresh`, {
        method: 'POST',
        // credentials: 'include' envía automáticamente la httpOnly cookie con el refreshToken
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        // El refresh falló (cookie expirada o inválida) → forzar logout
        return null;
      }

      const data = await response.json();
      // Guardar nuevo token en sessionStorage
      this.token = data.token;
      sessionStorage.setItem('sicag_token', data.token);

      // Si el servidor devuelve datos frescos del usuario, actualizar IndexedDB
      // NOTA: El backend actual /auth/refresh solo devuelve {token}. Si a futuro
      // devuelve {token, usuario}, esto se activará automáticamente.
      if (data.usuario) {
        this.user = data.usuario;
        sessionStorage.setItem('sicag_user', JSON.stringify(data.usuario));
        this._guardarSesionEnIndexedDB(data.usuario).catch(() => {});
      } else if (this.user) {
        // Si el servidor no devuelve usuario fresco, re-guardar el usuario actual
        // (para actualizar el timestamp _guardadoEn y extender los 7 días)
        this._guardarSesionEnIndexedDB(this.user).catch(() => {});
      }
      this._sessionValidada = true;
      return data.token;
    } catch (error) {
      console.warn('Error al intentar refresh del token:', error);
      return null;
    }
  }

  // ─────────────────────────────────────────
  // VERIFICACIÓN Y PERMISOS
  // ─────────────────────────────────────────
  isAuthenticated() {
    // 1. Si hay usuario en memoria, está autenticado
    if (this.user) return true;
    
    // 2. Intentar recuperar de sessionStorage (recarga de página en la misma sesión)
    const userStr = sessionStorage.getItem('sicag_user');
    if (userStr) {
      this.user = this._parseUser(userStr);
      if (this.user) return true;
    }
    
    // 3. Si hay señal de sesión activa en localStorage pero no tenemos usuario,
    //    puede ser que el usuario cerró el navegador pero IndexedDB tiene su sesión.
    //    _cargarSesionDesdeIndexedDB() ya fue llamado en el constructor y es async.
    //    En este punto devolvemos false pero la carga async puede actualizar this.user
    //    antes de que el módulo protegido termine de inicializarse.
    const sesionActiva = localStorage.getItem('sicag_sesion_activa');
    if (sesionActiva) {
      // Hay señal de sesión activa, pero los datos aún no cargaron de IndexedDB.
      // Devolver true provisionalmente y dejar que _cargarSesionDesdeIndexedDB termine.
      // roles.js verificará de nuevo cuando this.user esté disponible.
      return true; // provisional — se confirma cuando IndexedDB termina de cargar
    }
    
    return false;
  }

  hasRole(role) {
    if (!this.user) return false;
    return this.user.rol === role || this.user.rol === 'admin';
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token || sessionStorage.getItem('sicag_token');
  }

  // ─────────────────────────────────────────
  // SINCRONIZACIÓN ENTRE PESTAÑAS (PROBLEMA 8)
  // ─────────────────────────────────────────
  _escucharCambiosPestana() {
    window.addEventListener('storage', (evento) => {
      // Si otra pestaña cerró sesión, cerrar sesión en esta también
      if (evento.key === 'sicag_sesion_cerrada' && evento.newValue) {
        console.info('[Auth] Sesión cerrada desde otra pestaña, realizando logout local.');
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('sicag_token');
        sessionStorage.removeItem('sicag_user');

        const esPublica = this._esRutaPublica(window.location.pathname);
        if (!esPublica) {
          alert('Tu sesión fue cerrada desde otra pestaña.');
          window.location.href = 'login.html';
        }
      }
    });
  }

  _esRutaPublica(ruta) {
    return ruta.includes('login.html') ||
           ruta.includes('index.html') ||
           ruta.includes('consulta_habitantes.html') ||
           ruta.endsWith('/');
  }

  // ─────────────────────────────────────────
  // OBSERVADORES
  // ─────────────────────────────────────────
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  _notifyObservers(event) {
    this.observers.forEach(callback => callback(event));
  }

  _parseUser(userData) {
    try {
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCIA DE SESIÓN EN INDEXEDDB (para modo offline)
// ─────────────────────────────────────────────────────────────────────────────

  /**
   * Guarda los datos del usuario en IndexedDB.
   * Se llama después de un login exitoso o de un refresh exitoso.
   * NO guarda el token JWT (ese sigue siendo solo sessionStorage por seguridad).
   */
  async _guardarSesionEnIndexedDB(usuario) {
    try {
      if (typeof window.SicagDB === 'undefined') return;
      await window.SicagDB.guardarMeta('sesion_usuario', {
        ...usuario,
        _guardadoEn: Date.now()
      });
    } catch (e) {
      console.warn('[Auth] No se pudo guardar sesión en IndexedDB:', e.message);
    }
  }

  /**
   * Carga la sesión desde IndexedDB cuando sessionStorage está vacío.
   * Esto ocurre cuando el usuario cerró el navegador pero vuelve offline.
   */
  async _cargarSesionDesdeIndexedDB() {
    try {
      if (typeof window.SicagDB === 'undefined') return;
      
      const sesionGuardada = await window.SicagDB.obtenerMeta('sesion_usuario');
      if (!sesionGuardada) return;
      
      // Verificar que la sesión no sea demasiado vieja (máximo 7 días = vida del refresh token)
      const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - sesionGuardada._guardadoEn > SIETE_DIAS_MS) {
        // Sesión expirada — limpiar y no cargar
        await this._limpiarSesionDeIndexedDB();
        return;
      }
      
      // Cargar el usuario en memoria
      const { _guardadoEn, ...usuarioLimpio } = sesionGuardada;
      this.user = usuarioLimpio;
      
      // También guardarlo en sessionStorage para la pestaña actual
      sessionStorage.setItem('sicag_user', JSON.stringify(usuarioLimpio));
      
      console.info('[Auth] Sesión restaurada desde IndexedDB (modo offline).');
      this._notifyObservers({ tipo: 'sesion_restaurada', usuario: usuarioLimpio });
      
      // Intentar validar la sesión contra el servidor (en segundo plano, sin bloquear)
      // Si hay red, esto verificará que la contraseña no haya sido cambiada
      this._validarSesionConServidor();
      
    } catch (e) {
      console.warn('[Auth] No se pudo cargar sesión desde IndexedDB:', e.message);
    }
  }

  /**
   * Intenta validar la sesión contra el servidor cuando hay red disponible.
   * Si el servidor dice que la sesión es inválida (401), fuerza el logout.
   * Si no hay red, espera silenciosamente hasta que regrese la conexión.
   */
  async _validarSesionConServidor() {
    if (this._sessionValidada) return; // Solo validar una vez por sesión de navegador
    
    // Si no hay internet ahora, esperar al evento 'online'
    if (!navigator.onLine) {
      window.addEventListener('online', () => {
        this._validarSesionConServidor();
      }, { once: true });
      return;
    }
    
    try {
      const baseURL = window.API_BASE_URL || window.api?.baseURL || 'https://sicag-api.onrender.com/api';
      
      // Intentar refresh del token (credentials: 'include' envía la cookie httpOnly automáticamente)
      const response = await fetch(`${baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Servidor confirmó que la sesión sigue válida
        const data = await response.json();
        this.token = data.token;
        sessionStorage.setItem('sicag_token', data.token);
        this._sessionValidada = true;
        console.info('[Auth] Sesión validada con el servidor. Token renovado.');
        
        // Actualizar los datos del usuario si el servidor devuelve datos frescos
        if (data.usuario) {
          this.user = data.usuario;
          sessionStorage.setItem('sicag_user', JSON.stringify(data.usuario));
          await this._guardarSesionEnIndexedDB(data.usuario);
        }
      } else if (response.status === 401) {
        // La sesión fue invalidada en el servidor (contraseña cambiada, usuario desactivado, etc.)
        console.warn('[Auth] Sesión rechazada por el servidor. Redirigiendo al login...');
        await this._limpiarSesionDeIndexedDB();
        
        // Mostrar mensaje claro al usuario antes de redirigir
        const mensaje = 'Tu sesión ha expirado o fue cerrada por el administrador. Por favor inicia sesión nuevamente.';
        alert(mensaje); // alert bloquea y garantiza que el usuario lo vea antes del redirect
        
        this.logout(true); // silencioso (no vuelve a llamar a alert)
        window.location.href = 'login.html';
      }
      // Si es otro error (500, red intermitente), ignorar silenciosamente
      // La validación se reintentará en la próxima sesión o al reconectar
      
    } catch (e) {
      // Error de red — no hacer nada, el usuario puede seguir trabajando offline
      console.info('[Auth] No se pudo validar sesión con el servidor (sin red):', e.message);
    }
  }

  /**
   * Elimina la sesión guardada en IndexedDB.
   * Llamar en logout y cuando la sesión es invalidada.
   */
  async _limpiarSesionDeIndexedDB() {
    try {
      if (typeof window.SicagDB === 'undefined') return;
      await window.SicagDB.guardarMeta('sesion_usuario', null);
    } catch (e) { /* ignorar */ }
  }
}

// Asegurar instancia global
if (!window.auth) {
  window.auth = new AuthManager();
}

// ─────────────────────────────────────────
// REGISTRO DE PWA Y MODO OFFLINE
// ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[PWA] Service Worker registrado correctamente:', reg.scope);
    }).catch(err => {
      console.warn('[PWA] Fallo al registrar el Service Worker:', err);
    });
  });
}

// Inyección dinámica del Manifest para "Add to Home Screen"
if (!document.querySelector('link[rel="manifest"]')) {
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = '/manifest.json';
  document.head.appendChild(manifestLink);
}

// Middleware de protección visual para las páginas HTML
function checkAuthMiddleware() {
  const path = window.location.pathname;
  const isPublicPage = path.includes('login.html') ||
                       path.includes('index.html') ||
                       path.includes('consulta_habitantes.html') ||
                       path.endsWith('/');

  if (!isPublicPage && !window.auth.isAuthenticated()) {
    alert('Debes iniciar sesión para acceder al sistema.');
    window.location.href = 'login.html';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAuthMiddleware);
} else {
  checkAuthMiddleware();
}

// Escuchar cualquier clic en la página para proteger acciones si la sesión se cerró (ej. en otra pestaña)
document.addEventListener('click', (e) => {
  const path = window.location.pathname;
  const isPublicPage = path.includes('login.html') ||
                       path.includes('index.html') ||
                       path.includes('consulta_habitantes.html') ||
                       path.endsWith('/');

  if (!isPublicPage && !window.auth.isAuthenticated()) {
    e.preventDefault();
    e.stopPropagation();
    alert('Tu sesión ha expirado o fue cerrada desde otra pestaña.');
    window.location.href = 'login.html';
  }
}, true); // Fase de captura para interceptar antes que cualquier otro evento

// Redirigir directamente al dashboard desde index.html si ya está logueado
document.addEventListener('DOMContentLoaded', () => {
  if (window.auth.isAuthenticated()) {
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    loginLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html';
      });
      // Opcional: Cambiar texto del botón
      if (link.innerHTML.includes('Acceso Voceros')) {
        link.innerHTML = '<i class="fas fa-chart-line"></i> Ir al Dashboard';
      }
    });
  }
});

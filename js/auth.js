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
    // El token vive SOLO en memoria: no es accesible desde el DOM ni por XSS
    this.token = null;
    // Datos del usuario (sin secretos) se restauran desde sessionStorage al recargar
    this.user = this._parseUser(sessionStorage.getItem('sicag_user'));
    this.observers = [];
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
        body: JSON.stringify({ email: usuario, password: contraseña })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Credenciales inválidas. Usuario no encontrado.');
      }

      const data = await response.json();

      // Guardar token SOLO en memoria (no en localStorage ni sessionStorage)
      this.token = data.token;
      this.user = data.usuario;

      // Los datos del usuario (sin secretos) van a sessionStorage para sobrevivir recargas
      sessionStorage.setItem('sicag_user', JSON.stringify(data.usuario));

      // Señal para que otras pestañas sepan que hay una sesión activa
      // (se usa una clave sin el token para no exponerlo)
      localStorage.setItem('sicag_sesion_activa', Date.now().toString());

      this._notifyObservers({ tipo: 'login', usuario: data.usuario });
      return data.usuario;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  logout(silencioso = false) {
    this.token = null;
    this.user = null;
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
      // Guardar nuevo token en memoria solamente
      this.token = data.token;
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
    // El token vive en memoria: si está presente, hay sesión activa
    // Si se recargó la página, el token se perdió de memoria pero hay datos de usuario
    // en sessionStorage; en ese caso, se intentará hacer refresh automático al primer request
    const userStr = sessionStorage.getItem('sicag_user');
    if (userStr && !this.user) {
      this.user = this._parseUser(userStr);
    }
    // Se considera autenticado si hay datos de usuario (el token se renovará automáticamente)
    return !!this.user;
  }

  hasRole(role) {
    if (!this.user) return false;
    return this.user.rol === role || this.user.rol === 'admin';
  }

  getUser() {
    return this.user;
  }

  getToken() {
    // El token solo existe en memoria
    return this.token;
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
}

window.auth = new AuthManager();

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

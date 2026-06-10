/**
 * Módulo de Autenticación Centralizado (SICAG v2.5)
 * Gestiona tokens JWT (simulados), roles y permisos.
 */
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = this._parseUser(localStorage.getItem('user'));
    this.observers = [];
  }

  // ─────────────────────────────────────────
  // LOGIN / LOGOUT
  // ─────────────────────────────────────────
  async login(usuario, contraseña) {
    try {
      // Producción: Petición real al backend
      const baseURL = window.api ? window.api.baseURL : 'https://sicag-api.onrender.com/api';
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuario, password: contraseña })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Credenciales inválidas. Usuario no encontrado.');
      }

      const data = await response.json();
      
      this.token = data.token;
      this.user = data.usuario;
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
      
      this._notifyObservers({ tipo: 'login', usuario: data.usuario });
      return data.usuario;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._notifyObservers({ tipo: 'logout' });
    window.location.href = 'login.html';
  }

  // ─────────────────────────────────────────
  // VERIFICACIÓN Y PERMISOS
  // ─────────────────────────────────────────
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.token = token;
      this.user = this._parseUser(user);
      return true;
    }
    this.token = null;
    this.user = null;
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
    return this.token;
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

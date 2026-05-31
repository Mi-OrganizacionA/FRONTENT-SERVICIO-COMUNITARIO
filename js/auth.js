/**
 * Módulo de Autenticación Centralizado (SICAG v5.0)
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
      // Simulación de validación (en producción haría fetch a /api/auth/login)
      const DEMO_USERS = {
        'admin': { nombre: 'Administrador General', rol: 'admin', consejoComunal: 'Todos' },
        'vocero': { nombre: 'Vocero Jobito I', rol: 'vocero', consejoComunal: 'Jobito I' }
      };

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (DEMO_USERS[usuario] && contraseña.length > 3) {
            const userData = DEMO_USERS[usuario];
            const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulado.' + Date.now();
            
            this.token = fakeToken;
            this.user = userData;
            
            localStorage.setItem('token', fakeToken);
            localStorage.setItem('user', JSON.stringify(userData));
            
            this._notifyObservers({ tipo: 'login', usuario: userData });
            resolve(userData);
          } else {
            reject(new Error('Credenciales inválidas. Usuario no encontrado.'));
          }
        }, 1200); // delay simulado
      });
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
    return !!this.token && !!this.user;
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

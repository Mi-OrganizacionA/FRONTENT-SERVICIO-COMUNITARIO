/* js/roles.js — control de páginas según rol de usuario (Integrado con AuthManager v2.5) */
(() => {
  // Páginas permitidas para el Vocero
  // El Admin tiene acceso a todo, sin restricción
  const VOCERO_ALLOWED = [
    'dashboard.html',
    'censo.html',
    'censo_viviendas.html',
    'cartografia.html',
    'noticias.html',
    'proyectos.html',
    'produccion_agricola.html',
    'organizaciones.html',
    'notificaciones.html',
    'perfil.html',
    'ayuda.html',
    'index.html',
    ''  // raíz
  ];

  const getCurrentPage = () => window.location.pathname.split('/').pop() || 'dashboard.html';

  const isPageAllowed = (role, page) => {
    // Admin puede ver todo
    if (!role || role === 'admin' || !role) return true;
    // Vocero: solo sus páginas
    if (role === 'vocero') return VOCERO_ALLOWED.includes(page);
    return false;
  };

  const protectPage = () => {
    if (!window.auth || !window.auth.isAuthenticated()) {
      return; // auth.js ya maneja la redirección si no hay sesión
    }

    const user = window.auth.getUser();
    const role = user ? user.rol : null;
    const page = getCurrentPage();

    if (role && !isPageAllowed(role, page)) {
      // Redirigir al Vocero a su página principal
      window.location.replace('censo_viviendas.html');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectPage);
  } else {
    protectPage();
  }
})();

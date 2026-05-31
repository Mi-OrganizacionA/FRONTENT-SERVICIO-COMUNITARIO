/* js/roles.js — control de páginas según rol de usuario (Integrado con AuthManager v5.0) */
(() => {
  const ROLE_RULES = {
    vocero: {
      allowedPages: ['dashboard.html', 'censo.html', 'censo_viviendas.html', 'cartografia.html', 'index.html'],
      redirectTo: 'censo.html'
    }
  };

  const getCurrentPage = () => window.location.pathname.split('/').pop() || 'dashboard.html';

  const isPageAllowed = (role, page) => {
    if (!role || role === 'admin' || !ROLE_RULES[role]) return true;
    return ROLE_RULES[role].allowedPages.includes(page);
  };

  const protectPage = () => {
    // Usar el AuthManager en lugar de sessionStorage
    if (!window.auth || !window.auth.isAuthenticated()) {
      return; // auth.js ya se encarga de redirigir si no hay sesión
    }
    
    const user = window.auth.getUser();
    const role = user ? user.rol : null;
    const page = getCurrentPage();

    if (role && !isPageAllowed(role, page)) {
      const destination = ROLE_RULES[role].redirectTo || 'dashboard.html';
      window.location.replace(destination);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectPage);
  } else {
    protectPage();
  }
})();

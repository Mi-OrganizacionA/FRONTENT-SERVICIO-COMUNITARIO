/* js/roles.js — control de páginas según rol de usuario */
(() => {
  const ROLE_RULES = {
    Vocero: {
      allowedPages: ['dashboard.html', 'censo.html', 'censo_viviendas.html', 'cartografia.html', 'index.html'],
      redirectTo: 'censo.html'
    }
  };

  const getCurrentRole = () => sessionStorage.getItem('sicag_rol') || null;

  const getCurrentPage = () => window.location.pathname.split('/').pop() || 'dashboard.html';

  const isPageAllowed = (role, page) => {
    if (!role || !ROLE_RULES[role]) return true;
    return ROLE_RULES[role].allowedPages.includes(page);
  };

  const protectPage = () => {
    const role = getCurrentRole();
    const page = getCurrentPage();
    if (!role) return;
    if (!isPageAllowed(role, page)) {
      const destination = ROLE_RULES[role].redirectTo || 'dashboard.html';
      window.location.replace(destination);
    }
  };

  window.addEventListener('DOMContentLoaded', protectPage);
})();

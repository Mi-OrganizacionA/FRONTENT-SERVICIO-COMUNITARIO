/* js/roles.js — control de páginas según rol de usuario (Integrado con AuthManager v2.5) */
(() => {
  // Páginas permitidas para el Vocero
  // El Admin tiene acceso a todo, sin restricción
  const VOCERO_ALLOWED = [
    'dashboard.html',
    'censo.html',
    'censo_viviendas.html',
    'reportes.html',
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

  const protectPage = async () => {
    await _esperarSesion();

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

  /**
   * Espera hasta 3 segundos a que la sesión se cargue desde IndexedDB.
   * Si después de 3s no hay sesión, asume que el usuario no está autenticado.
   */
  async function _esperarSesion() {
    const MAX_ESPERA_MS = 3000;
    const INTERVALO_MS = 100;
    let tiempo = 0;
    
    // Si ya hay sesión, no esperar
    if (window.auth?.getUser()) return;
    
    // Si no hay señal de sesión activa, tampoco esperar
    if (!localStorage.getItem('sicag_sesion_activa')) return;
    
    // Esperar hasta MAX_ESPERA_MS para que IndexedDB cargue la sesión
    while (tiempo < MAX_ESPERA_MS) {
      await new Promise(resolve => setTimeout(resolve, INTERVALO_MS));
      tiempo += INTERVALO_MS;
      if (window.auth?.getUser()) return; // Ya cargó
    }
    
    // Timeout: limpiar señales de sesión
    localStorage.removeItem('sicag_sesion_activa');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectPage);
  } else {
    protectPage();
  }
})();

/* ============================================================
   SICAG v3.0 — Component Loader Utility
   Archivo: js/components.js

   Carga archivos HTML parciales (componentes) en placeholders
   del DOM usando fetch(). Reemplaza la duplicación de código
   en cada página.

   Uso básico:
     await SICAG.loadComponent('sidebar-placeholder', '/components/sidebar-admin.html');
   ============================================================ */

'use strict';

const SICAG = (() => {

  // ============================================================
  // Caché de componentes ya descargados
  // ============================================================
  const _cache = {};

  // ============================================================
  // loadComponent(targetId, filePath, callback?)
  //   targetId  — ID del elemento donde se inyectará el HTML
  //   filePath  — Ruta al archivo .html del componente
  //   callback  — Función opcional que se ejecuta al terminar
  // ============================================================
  async function loadComponent(targetId, filePath, callback) {
    const target = document.getElementById(targetId);
    if (!target) {
      console.warn(`[SICAG Components] Elemento #${targetId} no encontrado.`);
      return;
    }

    try {
      // Usar caché para no repetir requests
      if (!_cache[filePath]) {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${filePath}`);
        _cache[filePath] = await res.text();
      }
      target.innerHTML = _cache[filePath];

      if (typeof callback === 'function') callback(target);
    } catch (err) {
      console.error(`[SICAG Components] Error al cargar ${filePath}:`, err);
      target.innerHTML = `<p style="color:red;padding:1rem;">Error al cargar componente: ${filePath}</p>`;
    }
  }

  // ============================================================
  // loadPage(config)
  //   Carga múltiples componentes de una sola vez.
  //   config = [ { id, file, callback? }, ... ]
  // ============================================================
  async function loadPage(config) {
    const promises = config.map(({ id, file, callback }) =>
      loadComponent(id, file, callback)
    );
    await Promise.all(promises);
  }

  // ============================================================
  // setActiveNav(linkSelector)
  //   Marca el enlace activo en el sidebar o navbar
  //   basado en el pathname actual.
  // ============================================================
  function setActiveNav(containerSelector = '.sidebar-nav') {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll(`${containerSelector} a`);
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href && currentPath.endsWith(href)) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  // ============================================================
  // getSession()
  //   Devuelve la sesión simulada guardada en sessionStorage.
  //   { user, rol } o null si no hay sesión.
  // ============================================================
  function getSession() {
    const user = sessionStorage.getItem('sicag_user');
    const rol  = sessionStorage.getItem('sicag_rol');
    if (!user || !rol) return null;
    return { user, rol };
  }

  // ============================================================
  // guardRol(requiredRol, redirectTo?)
  //   Verifica el rol del usuario. Si no coincide, redirige.
  // ============================================================
  function guardRol(requiredRol, redirectTo = '../../login.html') {
    const session = getSession();
    if (!session || session.rol !== requiredRol) {
      window.location.href = redirectTo;
    }
    return session;
  }

  // ============================================================
  // renderUserInfo(session)
  //   Inyecta el nombre/rol del usuario en el header.
  // ============================================================
  function renderUserInfo(session) {
    if (!session) return;
    const nameEl   = document.getElementById('header-user-name');
    const rolEl    = document.getElementById('header-user-rol');
    const avatarEl = document.getElementById('header-user-avatar');
    if (nameEl)   nameEl.textContent   = session.user.charAt(0).toUpperCase() + session.user.slice(1);
    if (rolEl)    rolEl.textContent    = session.rol;
    if (avatarEl) avatarEl.textContent = session.user.charAt(0).toUpperCase();
  }

  // ============================================================
  // logout()
  //   Elimina la sesión y redirige al login.
  // ============================================================
  function logout(redirectTo = '../../login.html') {
    sessionStorage.removeItem('sicag_user');
    sessionStorage.removeItem('sicag_rol');
    window.location.href = redirectTo;
  }

  // API pública
  return { loadComponent, loadPage, setActiveNav, getSession, guardRol, renderUserInfo, logout };

})();

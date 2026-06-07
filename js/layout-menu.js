/* js/layout-menu.js — plantilla común del panel — con soporte de roles Admin / Vocero */
(() => {

  /* ─── MENÚ COMPLETO (Admin) ─────────────────────────────── */
  const MENU_ADMIN = [
    {
      title: 'Gestión Principal',
      items: [
        { href: 'dashboard.html',      icon: 'gauge-high',           label: 'Dashboard' },
        { href: 'censo.html',          icon: 'users',                label: 'Censo Comunitario', badge: '347' },
        { href: 'censo_viviendas.html',icon: 'house-chimney-crack',  label: 'Censo Viviendas' },
        { href: 'noticias.html',       icon: 'newspaper',            label: 'Cartelera Digital', badge: '12' },
        { href: 'proyectos.html',      icon: 'seedling',             label: 'Proyectos Agroecológicos' },
        { href: 'produccion_agricola.html', icon: 'tractor',         label: 'Producción Agrícola' },
        { href: 'organizaciones.html', icon: 'hands-holding-circle', label: 'Organizaciones Sociales' }
      ]
    },
    {
      title: 'Análisis y Reportes',
      items: [
        { href: 'reportes.html',    icon: 'chart-column',       label: 'Reportes' },
        { href: 'cartografia.html', icon: 'map-location-dot',   label: 'Cartografía Social' }
      ]
    },
    {
      title: 'Administración',
      items: [
        { href: 'voceros.html',      icon: 'users-gear',   label: 'Gestión de Voceros' },
        { href: 'notificaciones.html', icon: 'bell', label: 'Centro de Notificaciones' },
        { href: 'configuracion.html',icon: 'gear',         label: 'Configuración' }
      ]
    },
    {
      title: 'Acceso Rápido',
      items: [
        { href: 'ayuda.html', icon: 'circle-question', label: 'Centro de Ayuda' },
        { href: 'index.html', icon: 'globe', label: 'Portal Público', target: '_blank' },
        { href: 'login.html', icon: 'right-from-bracket', label: 'Cerrar Sesión', style: 'color:rgba(255,100,100,.85);' }
      ]
    }
  ];

  /* ─── MENÚ VOCERO (sólo sus páginas) ────────────────────── */
  const MENU_VOCERO = [
    {
      title: 'Mi Trabajo',
      items: [
        { href: 'censo_viviendas.html', icon: 'house-chimney-crack', label: 'Censo de Viviendas' },
        { href: 'censo.html',           icon: 'users',               label: 'Consultar Habitantes' }
      ]
    },
    {
      title: 'Recursos',
      items: [
        { href: 'cartografia.html', icon: 'map-location-dot', label: 'Mapa Comunal' },
        { href: 'ayuda.html',       icon: 'circle-question',  label: 'Centro de Ayuda' },
        { href: 'index.html',       icon: 'globe',             label: 'Portal Público', target: '_blank' }
      ]
    },
    {
      title: 'Sesión',
      items: [
        { href: 'login.html', icon: 'right-from-bracket', label: 'Cerrar Sesión', style: 'color:rgba(255,130,100,.9);' }
      ]
    }
  ];

  const DEFAULT_PLACEHOLDER = 'Buscar...';

  const getCurrentPage = () => {
    const page = window.location.pathname.split('/').pop();
    return page || 'dashboard.html';
  };

  const getUserData = () => {
    if (window.auth && window.auth.getUser()) return window.auth.getUser();
    return null;
  };

  const getUserRole = () => {
    const u = getUserData();
    return u ? u.rol : null;
  };

  const getSearchPlaceholder = () => document.body.dataset.searchPlaceholder || DEFAULT_PLACEHOLDER;

  /* ── Build sidebar item ── */
  const buildSidebarItem = (item, currentPage) => {
    const isActive = item.href === currentPage;
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    const target = item.target ? ` target="${item.target}"` : '';
    const style = item.style ? ` style="${item.style}"` : '';
    const badge = item.badge ? `<span class="sidebar-badge">${item.badge}</span>` : '';

    return `
      <li class="sidebar-nav-item">
        <a href="${item.href}" class="sidebar-nav-link${isActive ? ' active' : ''}"${ariaCurrent}${target}${style}>
          <i class="fas fa-${item.icon}"></i>
          <span>${item.label}</span>
          ${badge}
        </a>
      </li>`;
  };

  /* ── Build sidebar HTML según rol ── */
  const buildSidebarHtml = () => {
    const currentPage = getCurrentPage();
    const role        = getUserRole();
    const user        = getUserData();
    const isVocero    = role === 'vocero';
    const menuSections = isVocero ? MENU_VOCERO : MENU_ADMIN;

    const sections = menuSections.map(section => {
      const itemsHtml = section.items
        .map(item => buildSidebarItem(item, currentPage))
        .filter(Boolean)
        .join('');
      return itemsHtml ? `
        <span class="sidebar-section-title">${section.title}</span>
        <ul class="sidebar-nav">${itemsHtml}</ul>` : '';
    }).join('');

    /* Branding diferenciado por rol */
    const brandIcon  = isVocero ? 'house-user'  : 'seedling';
    const brandTitle = isVocero ? 'SICAG'        : 'SICAG';
    const brandSub   = isVocero ? 'Módulo Vocero · Censo'  : 'Panel Administrativo v3.0';

    /* Etiqueta de rol para el sidebar */
    const roleBadgeHtml = isVocero
      ? `<div class="sidebar-role-badge vocero"><i class="fas fa-id-badge"></i> Vocero Comunal</div>`
      : `<div class="sidebar-role-badge admin"><i class="fas fa-shield-halved"></i> Administrador</div>`;

    /* Info del consejo comunal del vocero */
    const ccInfoHtml = (isVocero && user && user.consejoComunal)
      ? `<div class="sidebar-cc-info"><i class="fas fa-map-pin"></i> ${user.consejoComunal}</div>`
      : '';

    return `
      <div class="sidebar-brand ${isVocero ? 'sidebar-brand-vocero' : ''}">
        <img src="assets/img/logo_comuna.png" alt="Logo SICAG" width="42" height="42" style="object-fit: cover; border-radius: 50%; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,.15);">
        <div class="sidebar-brand-text">
          <strong>${brandTitle}</strong>
          <small>${brandSub}</small>
        </div>
      </div>
      ${roleBadgeHtml}
      ${ccInfoHtml}
      ${sections}
      <div class="sidebar-footer">
        <small>SICAG v3.0 · Sala de Autogobierno · 2026</small>
      </div>`;
  };

  const buildHeaderHtml = () => {
    const placeholder = getSearchPlaceholder();
    const user     = getUserData();
    const role     = getUserRole();
    const isVocero = role === 'vocero';

    /* Iniciales del avatar */
    const nombre = user ? user.nombre : 'Sala Autogobierno';
    const initials = nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'SA';

    /* Badge de rol en el header */
    const rolLabel   = isVocero ? 'Vocero' : 'Admin';
    const rolClass   = isVocero ? 'header-role-badge-vocero' : 'header-role-badge-admin';
    const roleBadge  = `<span class="header-role-badge ${rolClass}"><i class="fas fa-${isVocero ? 'id-badge' : 'shield-halved'}"></i> ${rolLabel}</span>`;

    return `
      <div class="header-search">
        <i class="fas fa-magnifying-glass"></i>
        <label for="globalSearch" class="sr-only">Buscar</label>
        <input type="search" id="globalSearch" placeholder="${placeholder}">
      </div>
      <div class="header-actions">
        ${roleBadge}
        
        <div class="header-notif-wrapper" id="headerNotifWrapper">
          <button class="header-action-btn" type="button" aria-label="Notificaciones" id="headerNotifBtn">
            <i class="fas fa-bell"></i><span class="badge-notif" id="headerNotifBadge" style="display:none;">0</span>
          </button>
          
          <div class="header-notif-dropdown" id="headerNotifDropdown">
            <div class="notif-dropdown-header">
              <span>Notificaciones</span>
              <a href="notificaciones.html">Ver todas</a>
            </div>
            <div class="notif-dropdown-body" id="headerNotifList">
              <div class="notif-dropdown-empty">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando...</p>
              </div>
            </div>
          </div>
        </div>

        <a href="ayuda.html" class="header-action-btn" aria-label="Centro de Ayuda">
          <i class="fas fa-circle-question"></i>
        </a>
        <a href="perfil.html" class="header-user" aria-label="Mi Perfil" title="${nombre}" style="text-decoration:none;">
          <div class="header-user-avatar ${isVocero ? 'avatar-vocero' : ''}">${initials}</div>
          <span>${nombre}</span>
          <i class="fas fa-chevron-right" style="font-size:0.8rem; opacity:0.7;"></i>
        </a>
      </div>`;
  };

  const renderHeader = () => {
    let header = document.querySelector('header.app-header');
    const placeholder = document.getElementById('header-placeholder');
    if (!header && placeholder) {
      header = document.createElement('header');
      header.className = 'app-header';
      header.setAttribute('role', 'banner');
      placeholder.replaceWith(header);
    }
    if (!header) return;
    header.innerHTML = buildHeaderHtml();
  };

  const renderSidebar = () => {
    let sidebar = document.getElementById('sidebar');
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!sidebar && placeholder) {
      sidebar = document.createElement('nav');
      sidebar.id = 'sidebar';
      placeholder.replaceWith(sidebar);
    }
    if (!sidebar) return;
    sidebar.className = 'app-sidebar';
    sidebar.setAttribute('role', 'navigation');
    sidebar.setAttribute('aria-label', 'Menú principal');
    sidebar.innerHTML = buildSidebarHtml();
  };

  const initSidebarToggle = () => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }

    let toggle = document.getElementById('sidebarToggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'sidebarToggle';
      toggle.className = 'sidebar-toggle';
      toggle.setAttribute('aria-label', 'Abrir menú lateral');
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.appendChild(toggle);
    }

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
      const isOpen = sidebar.classList.contains('open');
      toggle.style.opacity = isOpen ? '0' : '1';
      toggle.style.pointerEvents = isOpen ? 'none' : 'auto';
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      toggle.style.opacity = '1';
      toggle.style.pointerEvents = 'auto';
    });
  };

  /* ── DROPDOWN NOTIFICACIONES LOGIC ── */
  const initNotificationsDropdown = () => {
    const btn = document.getElementById('headerNotifBtn');
    const dropdown = document.getElementById('headerNotifDropdown');
    const list = document.getElementById('headerNotifList');
    const badge = document.getElementById('headerNotifBadge');
    
    if (!btn || !dropdown) return;

    let loaded = false;

    // Toggle dropdown
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('show');
      
      // Cerrar otros dropdowns si existen
      document.querySelectorAll('.show').forEach(el => {
        if (el !== dropdown && el.classList.contains('header-notif-dropdown')) {
          el.classList.remove('show');
        }
      });

      dropdown.classList.toggle('show');

      if (!isOpen && !loaded) {
        // Fetch real data
        try {
          if (!window.api) throw new Error("API no disponible");
          const notifs = await window.api.getNotificaciones();
          const pendientes = notifs.filter(n => n.status === 'pendiente');
          
          if (badge) {
            badge.textContent = pendientes.length;
            badge.style.display = pendientes.length > 0 ? 'block' : 'none';
          }

          if (pendientes.length === 0) {
            list.innerHTML = `
              <div class="notif-dropdown-empty">
                <i class="fas fa-check-circle" style="color:var(--vp)"></i>
                <p>Estás al día</p>
                <span style="font-size:0.7rem">No tienes solicitudes pendientes</span>
              </div>
            `;
          } else {
            // Sort by new
            pendientes.sort((a, b) => new Date(b.createdAt || b.fechaSolicitud) - new Date(a.createdAt || a.fechaSolicitud));
            
            list.innerHTML = pendientes.slice(0, 5).map(n => {
              const dateObj = new Date(n.createdAt || n.fechaSolicitud);
              const timeStr = isNaN(dateObj.getTime()) ? 'Reciente' : dateObj.toLocaleDateString();
              
              return `
                <a href="notificaciones.html" class="notif-item">
                  <div class="notif-item-icon">
                    <i class="fas fa-user-plus"></i>
                  </div>
                  <div class="notif-item-content">
                    <h4>${n.titulo || 'Solicitud de registro'}</h4>
                    <p>${n.mensaje || 'Un vocero solicita validación.'}</p>
                    <span class="notif-item-time">${timeStr}</span>
                  </div>
                </a>
              `;
            }).join('');
            
            if (pendientes.length > 5) {
              list.innerHTML += `
                <a href="notificaciones.html" style="display:block; text-align:center; padding:.8rem; font-size:.8rem; font-weight:600; color:var(--vp); text-decoration:none;">
                  Ver ${pendientes.length - 5} más...
                </a>
              `;
            }
          }
          loaded = true;
        } catch (err) {
          list.innerHTML = `
            <div class="notif-dropdown-empty">
              <i class="fas fa-exclamation-triangle" style="color:var(--ru)"></i>
              <p>Error al cargar</p>
            </div>
          `;
        }
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
    
    // Initial fetch to set the badge count
    if (window.api && badge) {
      window.api.getNotificaciones().then(notifs => {
        const p = notifs.filter(n => n.status === 'pendiente').length;
        badge.textContent = p;
        badge.style.display = p > 0 ? 'block' : 'none';
      }).catch(() => {});
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderSidebar();
    initSidebarToggle();
    initNotificationsDropdown();
  });
})();

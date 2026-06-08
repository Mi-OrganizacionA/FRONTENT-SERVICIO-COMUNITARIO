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
        { href: 'notificaciones.html', icon: 'bell',       label: 'Validaciones' },
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
        <input type="search" id="globalSearch" placeholder="${placeholder}" autocomplete="off">
        <div id="globalSearchDropdown" class="global-search-dropdown">
          <div class="search-empty">Escribe para buscar...</div>
        </div>
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
          const count = notifs.length;
          
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
        const count = notifs.length;
        if (count > 0) {
          const mItem = document.querySelector('.mobile-menu-item[href="notificaciones.html"]');
          if (mItem) mItem.innerHTML += `<span class="mobile-badge">${count > 99 ? '99+' : count}</span>`;
        }
      });
    }
  };

  const initGlobalSearch = () => {
    const input = document.getElementById('globalSearch');
    const dropdown = document.getElementById('globalSearchDropdown');
    if (!input || !dropdown) return;

    let timeoutId;

    const renderResults = (results) => {
      dropdown.innerHTML = '';
      if (results.length === 0) {
        dropdown.innerHTML = '<div class="search-empty">No se encontraron resultados</div>';
        return;
      }

      results.forEach(item => {
        let icon = 'search';
        if (item.tipo === 'habitante') icon = 'user';
        if (item.tipo === 'vocero') icon = 'user-tie';
        if (item.tipo === 'configuracion') icon = 'gear';
        if (item.tipo === 'familiar_vivienda') icon = 'people-roof';

        if (item.tipo === 'seccion') icon = 'folder-open';

        const a = document.createElement('a');
        a.className = 'search-result-item';
        a.href = item.url;
        a.innerHTML = `
          <div class="search-result-icon"><i class="fas fa-${icon}"></i></div>
          <div class="search-result-text">
            <div class="search-result-title">${item.titulo}</div>
            <div class="search-result-sub">${item.subtitulo}</div>
          </div>
        `;
        dropdown.appendChild(a);
      });
    };

    const STATIC_SECTIONS = [
  {
    "tipo": "seccion",
    "titulo": "Why am I seeing this?",
    "subtitulo": "Sección en 404.html",
    "url": "404.html?highlightSection=why%20am%20i%20seeing%20this%3F",
    "keywords": "why am i seeing this? seccion 404"
  },
  {
    "tipo": "seccion",
    "titulo": "1. Solicitud de Registro",
    "subtitulo": "Sección en ayuda.html",
    "url": "ayuda.html?highlightSection=1.%20solicitud%20de%20registro",
    "keywords": "1. solicitud de registro seccion ayuda"
  },
  {
    "tipo": "seccion",
    "titulo": "2. Estado Pendiente",
    "subtitulo": "Sección en ayuda.html",
    "url": "ayuda.html?highlightSection=2.%20estado%20pendiente",
    "keywords": "2. estado pendiente seccion ayuda"
  },
  {
    "tipo": "seccion",
    "titulo": "3. Revisión Administrativa",
    "subtitulo": "Sección en ayuda.html",
    "url": "ayuda.html?highlightSection=3.%20revisi%C3%B3n%20administrativa",
    "keywords": "3. revisión administrativa seccion ayuda"
  },
  {
    "tipo": "seccion",
    "titulo": "4. Aprobación Final",
    "subtitulo": "Sección en ayuda.html",
    "url": "ayuda.html?highlightSection=4.%20aprobaci%C3%B3n%20final",
    "keywords": "4. aprobación final seccion ayuda"
  },
  {
    "tipo": "seccion",
    "titulo": "Área Total",
    "subtitulo": "Sección en cartografia.html",
    "url": "cartografia.html?highlightSection=%C3%A1rea%20total",
    "keywords": "área total seccion cartografia"
  },
  {
    "tipo": "seccion",
    "titulo": "Consejos Comunales",
    "subtitulo": "Sección en cartografia.html",
    "url": "cartografia.html?highlightSection=consejos%20comunales",
    "keywords": "consejos comunales seccion cartografia"
  },
  {
    "tipo": "seccion",
    "titulo": "Ha Cultivadas",
    "subtitulo": "Sección en cartografia.html",
    "url": "cartografia.html?highlightSection=ha%20cultivadas",
    "keywords": "ha cultivadas seccion cartografia"
  },
  {
    "tipo": "seccion",
    "titulo": "Familias",
    "subtitulo": "Sección en cartografia.html",
    "url": "cartografia.html?highlightSection=familias",
    "keywords": "familias seccion cartografia"
  },
  {
    "tipo": "seccion",
    "titulo": "Habitantes Censados",
    "subtitulo": "Sección en censo.html",
    "url": "censo.html?highlightSection=habitantes%20censados",
    "keywords": "habitantes censados seccion censo"
  },
  {
    "tipo": "seccion",
    "titulo": "Electores Activos",
    "subtitulo": "Sección en censo.html",
    "url": "censo.html?highlightSection=electores%20activos",
    "keywords": "electores activos seccion censo"
  },
  {
    "tipo": "seccion",
    "titulo": "Consejos Comunales",
    "subtitulo": "Sección en censo.html",
    "url": "censo.html?highlightSection=consejos%20comunales",
    "keywords": "consejos comunales seccion censo"
  },
  {
    "tipo": "seccion",
    "titulo": "Apertura del Censo Comunitario",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=apertura%20del%20censo%20comunitario",
    "keywords": "apertura del censo comunitario seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Aprobación Automática (Global)",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=aprobaci%C3%B3n%20autom%C3%A1tica%20(global)",
    "keywords": "aprobación automática (global) seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Aprobación Habitantes",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=aprobaci%C3%B3n%20habitantes",
    "keywords": "aprobación habitantes seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Aprobación Noticias",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=aprobaci%C3%B3n%20noticias",
    "keywords": "aprobación noticias seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Aprobación Proyectos",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=aprobaci%C3%B3n%20proyectos",
    "keywords": "aprobación proyectos seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Aprobación Organizaciones",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=aprobaci%C3%B3n%20organizaciones",
    "keywords": "aprobación organizaciones seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Aprobación Reportes Inter-comunales",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=aprobaci%C3%B3n%20reportes%20inter-comunales",
    "keywords": "aprobación reportes inter-comunales seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Respaldo del Sistema (Backup)",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=respaldo%20del%20sistema%20(backup)",
    "keywords": "respaldo del sistema (backup) seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Purgar Registros de Auditoría",
    "subtitulo": "Sección en configuracion.html",
    "url": "configuracion.html?highlightSection=purgar%20registros%20de%20auditor%C3%ADa",
    "keywords": "purgar registros de auditoría seccion configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Habitantes Censados",
    "subtitulo": "Sección en dashboard.html",
    "url": "dashboard.html?highlightSection=habitantes%20censados",
    "keywords": "habitantes censados seccion dashboard"
  },
  {
    "tipo": "seccion",
    "titulo": "Electores Activos",
    "subtitulo": "Sección en dashboard.html",
    "url": "dashboard.html?highlightSection=electores%20activos",
    "keywords": "electores activos seccion dashboard"
  },
  {
    "tipo": "seccion",
    "titulo": "Niños (0–11 años)",
    "subtitulo": "Sección en dashboard.html",
    "url": "dashboard.html?highlightSection=ni%C3%B1os%20(0%E2%80%9311%20a%C3%B1os)",
    "keywords": "niños (0–11 años) seccion dashboard"
  },
  {
    "tipo": "seccion",
    "titulo": "Noticias Publicadas",
    "subtitulo": "Sección en dashboard.html",
    "url": "dashboard.html?highlightSection=noticias%20publicadas",
    "keywords": "noticias publicadas seccion dashboard"
  },
  {
    "tipo": "seccion",
    "titulo": "Total Publicaciones",
    "subtitulo": "Sección en noticias.html",
    "url": "noticias.html?highlightSection=total%20publicaciones",
    "keywords": "total publicaciones seccion noticias"
  },
  {
    "tipo": "seccion",
    "titulo": "Noticias",
    "subtitulo": "Sección en noticias.html",
    "url": "noticias.html?highlightSection=noticias",
    "keywords": "noticias seccion noticias"
  },
  {
    "tipo": "seccion",
    "titulo": "Convocatorias",
    "subtitulo": "Sección en noticias.html",
    "url": "noticias.html?highlightSection=convocatorias",
    "keywords": "convocatorias seccion noticias"
  },
  {
    "tipo": "seccion",
    "titulo": "Avisos / Encuestas",
    "subtitulo": "Sección en noticias.html",
    "url": "noticias.html?highlightSection=avisos%20%2F%20encuestas",
    "keywords": "avisos / encuestas seccion noticias"
  },
  {
    "tipo": "seccion",
    "titulo": "Organizaciones",
    "subtitulo": "Sección en organizaciones.html",
    "url": "organizaciones.html?highlightSection=organizaciones",
    "keywords": "organizaciones seccion organizaciones"
  },
  {
    "tipo": "seccion",
    "titulo": "Movimientos Sociales",
    "subtitulo": "Sección en organizaciones.html",
    "url": "organizaciones.html?highlightSection=movimientos%20sociales",
    "keywords": "movimientos sociales seccion organizaciones"
  },
  {
    "tipo": "seccion",
    "titulo": "Con Contacto",
    "subtitulo": "Sección en organizaciones.html",
    "url": "organizaciones.html?highlightSection=con%20contacto",
    "keywords": "con contacto seccion organizaciones"
  },
  {
    "tipo": "seccion",
    "titulo": "Comités",
    "subtitulo": "Sección en organizaciones.html",
    "url": "organizaciones.html?highlightSection=comit%C3%A9s",
    "keywords": "comités seccion organizaciones"
  },
  {
    "tipo": "seccion",
    "titulo": "Parcelas Activas",
    "subtitulo": "Sección en produccion_agricola.html",
    "url": "produccion_agricola.html?highlightSection=parcelas%20activas",
    "keywords": "parcelas activas seccion produccion_agricola"
  },
  {
    "tipo": "seccion",
    "titulo": "Hectáreas Cultivadas",
    "subtitulo": "Sección en produccion_agricola.html",
    "url": "produccion_agricola.html?highlightSection=hect%C3%A1reas%20cultivadas",
    "keywords": "hectáreas cultivadas seccion produccion_agricola"
  },
  {
    "tipo": "seccion",
    "titulo": "Rubro Principal",
    "subtitulo": "Sección en produccion_agricola.html",
    "url": "produccion_agricola.html?highlightSection=rubro%20principal",
    "keywords": "rubro principal seccion produccion_agricola"
  },
  {
    "tipo": "seccion",
    "titulo": "Rendimiento (Ton)",
    "subtitulo": "Sección en produccion_agricola.html",
    "url": "produccion_agricola.html?highlightSection=rendimiento%20(ton)",
    "keywords": "rendimiento (ton) seccion produccion_agricola"
  },
  {
    "tipo": "seccion",
    "titulo": "Total Proyectos",
    "subtitulo": "Sección en proyectos.html",
    "url": "proyectos.html?highlightSection=total%20proyectos",
    "keywords": "total proyectos seccion proyectos"
  },
  {
    "tipo": "seccion",
    "titulo": "Propuestos",
    "subtitulo": "Sección en proyectos.html",
    "url": "proyectos.html?highlightSection=propuestos",
    "keywords": "propuestos seccion proyectos"
  },
  {
    "tipo": "seccion",
    "titulo": "En Ejecución",
    "subtitulo": "Sección en proyectos.html",
    "url": "proyectos.html?highlightSection=en%20ejecuci%C3%B3n",
    "keywords": "en ejecución seccion proyectos"
  },
  {
    "tipo": "seccion",
    "titulo": "Finalizados",
    "subtitulo": "Sección en proyectos.html",
    "url": "proyectos.html?highlightSection=finalizados",
    "keywords": "finalizados seccion proyectos"
  },
  {
    "tipo": "seccion",
    "titulo": "Total Personas",
    "subtitulo": "Sección en reportes.html",
    "url": "reportes.html?highlightSection=total%20personas",
    "keywords": "total personas seccion reportes"
  },
  {
    "tipo": "seccion",
    "titulo": "Con Discapacidad",
    "subtitulo": "Sección en reportes.html",
    "url": "reportes.html?highlightSection=con%20discapacidad",
    "keywords": "con discapacidad seccion reportes"
  },
  {
    "tipo": "seccion",
    "titulo": "Viviendas Censadas",
    "subtitulo": "Sección en reportes.html",
    "url": "reportes.html?highlightSection=viviendas%20censadas",
    "keywords": "viviendas censadas seccion reportes"
  },
  {
    "tipo": "seccion",
    "titulo": "Adultos Mayores",
    "subtitulo": "Sección en reportes.html",
    "url": "reportes.html?highlightSection=adultos%20mayores",
    "keywords": "adultos mayores seccion reportes"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: 404",
    "subtitulo": "Página Principal",
    "url": "404.html",
    "keywords": "modulo pagina 404"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: AYUDA",
    "subtitulo": "Página Principal",
    "url": "ayuda.html",
    "keywords": "modulo pagina ayuda"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: CARTOGRAFIA",
    "subtitulo": "Página Principal",
    "url": "cartografia.html",
    "keywords": "modulo pagina cartografia"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: CENSO",
    "subtitulo": "Página Principal",
    "url": "censo.html",
    "keywords": "modulo pagina censo"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: CENSO VIVIENDAS",
    "subtitulo": "Página Principal",
    "url": "censo_viviendas.html",
    "keywords": "modulo pagina censo_viviendas"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: CONFIGURACION",
    "subtitulo": "Página Principal",
    "url": "configuracion.html",
    "keywords": "modulo pagina configuracion"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: DASHBOARD",
    "subtitulo": "Página Principal",
    "url": "dashboard.html",
    "keywords": "modulo pagina dashboard"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: NOTICIAS",
    "subtitulo": "Página Principal",
    "url": "noticias.html",
    "keywords": "modulo pagina noticias"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: NOTIFICACIONES",
    "subtitulo": "Página Principal",
    "url": "notificaciones.html",
    "keywords": "modulo pagina notificaciones"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: ORGANIZACIONES",
    "subtitulo": "Página Principal",
    "url": "organizaciones.html",
    "keywords": "modulo pagina organizaciones"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: PERFIL",
    "subtitulo": "Página Principal",
    "url": "perfil.html",
    "keywords": "modulo pagina perfil"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: PRODUCCION AGRICOLA",
    "subtitulo": "Página Principal",
    "url": "produccion_agricola.html",
    "keywords": "modulo pagina produccion_agricola"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: PROYECTOS",
    "subtitulo": "Página Principal",
    "url": "proyectos.html",
    "keywords": "modulo pagina proyectos"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: REPORTES",
    "subtitulo": "Página Principal",
    "url": "reportes.html",
    "keywords": "modulo pagina reportes"
  },
  {
    "tipo": "seccion",
    "titulo": "Módulo: VOCEROS",
    "subtitulo": "Página Principal",
    "url": "voceros.html",
    "keywords": "modulo pagina voceros"
  }
];

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length < 2) {
        dropdown.classList.remove('show');
        return;
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        dropdown.innerHTML = '<div class="search-empty"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
        dropdown.classList.add('show');
        
        try {
          const lowerQ = q.toLowerCase();
          const localMatches = STATIC_SECTIONS.filter(s => 
            s.titulo.toLowerCase().includes(lowerQ) || 
            s.keywords.includes(lowerQ)
          );

          let dbResults = [];
          if (window.api && typeof window.api.globalSearch === 'function') {
            dbResults = await window.api.globalSearch(q).catch(() => []);
          }

          const combined = [...localMatches, ...dbResults];
          renderResults(combined);
        } catch (error) {
          dropdown.innerHTML = '<div class="search-empty text-danger">Error en la búsqueda</div>';
        }
      }, 400); // 400ms debounce
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // Abrir al enfocar si tiene texto
    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) {
        dropdown.classList.add('show');
      }
    });
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderSidebar();
    initSidebarToggle();
    initNotificationsDropdown();
    initGlobalSearch();
  });

  // ─────────────────────────────────────────
  // Resaltado de Sección Dinámico Global
  // ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('highlightSection');
    
    if (sectionParam) {
      const textLower = decodeURIComponent(sectionParam).toLowerCase();
      
      setTimeout(() => {
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, .card-header, .card-title');
        let target = null;
        for (let el of elements) {
          if (el.textContent.toLowerCase().includes(textLower)) {
            target = el;
            break;
          }
        }
        
        if (target) {
          const container = target.closest('.card, .card-sicag, section, .modal-content') || target.parentElement;
          if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            container.style.transition = 'box-shadow 0.5s ease, background-color 0.5s ease';
            container.style.boxShadow = '0 0 15px rgba(255,193,7,0.8)';
            container.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
            
            setTimeout(() => {
              container.style.boxShadow = '';
              container.style.backgroundColor = '';
            }, 3000);
          }
        }
      }, 600); // Dar tiempo a que otras cosas rendericen
    }
  });
})();

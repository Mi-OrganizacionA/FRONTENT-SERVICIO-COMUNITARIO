/* js/layout-menu.js — plantilla común del panel administrativo */
(() => {
  const MENU_SECTIONS = [
    {
      title: 'Gestión Principal',
      items: [
        { href: 'dashboard.html', icon: 'tachometer-alt', label: 'Dashboard' },
        { href: 'censo.html', icon: 'users', label: 'Censo Comunitario', badge: '347' },
        { href: 'censo_viviendas.html', icon: 'house', label: 'Censo Viviendas' },
        { href: 'noticias.html', icon: 'newspaper', label: 'Cartelera Digital', badge: '12' }
      ]
    },
    {
      title: 'Análisis y Reportes',
      items: [
        { href: 'reportes.html', icon: 'chart-bar', label: 'Reportes' },
        { href: 'cartografia.html', icon: 'map-marked-alt', label: 'Cartografía Social' }
      ]
    },
    {
      title: 'Información Comunal',
      items: [
        { href: 'institucional.html', icon: 'landmark', label: 'Info Institucional' }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { href: 'configuracion.html', icon: 'cog', label: 'Configuración' },
        { href: 'index.html', icon: 'globe', label: 'Portal Público', target: '_blank' },
        { href: 'login.html', icon: 'sign-out-alt', label: 'Cerrar Sesión', style: 'color:rgba(255,100,100,.8);' }
      ]
    }
  ];

  const ROLE_PERMISSIONS = {
    Vocero: {
      allowedPages: ['dashboard.html', 'censo.html', 'censo_viviendas.html', 'cartografia.html', 'index.html'],
      redirectPage: 'censo.html'
    }
  };

  const DEFAULT_PLACEHOLDER = 'Buscar...';

  const getCurrentPage = () => {
    const page = window.location.pathname.split('/').pop();
    return page || 'dashboard.html';
  };

  const getUserRole = () => sessionStorage.getItem('sicag_rol') || null;

  const getSearchPlaceholder = () => document.body.dataset.searchPlaceholder || DEFAULT_PLACEHOLDER;

  const isMenuItemAllowed = (item, role) => {
    if (role !== 'Vocero') return true;
    return ROLE_PERMISSIONS.Vocero.allowedPages.includes(item.href);
  };

  const buildSidebarItem = (item, currentPage, role) => {
    if (!isMenuItemAllowed(item, role)) return '';
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

  const buildSidebarHtml = () => {
    const currentPage = getCurrentPage();
    const role = getUserRole();

    const sections = MENU_SECTIONS.map(section => {
      const itemsHtml = section.items
        .map(item => buildSidebarItem(item, currentPage, role))
        .filter(Boolean)
        .join('');

      return itemsHtml ? `
        <span class="sidebar-section-title">${section.title}</span>
        <ul class="sidebar-nav">${itemsHtml}</ul>` : '';
    }).join('');

    return `
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon"><i class="fas fa-seedling"></i></div>
        <div class="sidebar-brand-text">
          <strong>SICAG</strong>
          <small>Panel Administrativo v3.0</small>
        </div>
      </div>
      ${sections}
      <div class="sidebar-footer">
        <small>SICAG v3.0 · Sala de Autogobierno · 2026</small>
      </div>`;
  };

  const buildHeaderHtml = () => {
    const placeholder = getSearchPlaceholder();
    return `
      <div class="header-brand">
        <img src="assets/img/logo_comuna.png" alt="Logo SICAG">
        <span>SICAG</span>
      </div>
      <div class="header-search">
        <i class="fas fa-search"></i>
        <label for="globalSearch" class="sr-only">Buscar</label>
        <input type="search" id="globalSearch" placeholder="${placeholder}">
      </div>
      <div class="header-actions">
        <button class="header-action-btn" type="button" aria-label="Notificaciones">
          <i class="fas fa-bell"></i><span class="badge-notif">5</span>
        </button>
        <button class="header-action-btn" type="button" aria-label="Ayuda">
          <i class="fas fa-question-circle"></i>
        </button>
        <button class="header-user" type="button" aria-label="Menú de usuario">
          <div class="header-user-avatar">SA</div>
          <span>Sala Autogobierno</span>
          <i class="fas fa-chevron-down"></i>
        </button>
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
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  };

  const initSpaRouter = () => {
    document.body.addEventListener('click', async (e) => {
      const link = e.target.closest('.sidebar-nav-link');
      if (!link) return;
      
      const href = link.getAttribute('href');
      // No interceptar enlaces externos, modales o la página de login
      if (!href || href.startsWith('http') || href.startsWith('#') || link.target === '_blank' || href === 'login.html') {
        return;
      }
      
      e.preventDefault();
      
      // Actualizar menú activo
      document.querySelectorAll('.sidebar-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Mostrar indicador visual en la página actual
      const mainContent = document.querySelector('main.app-main');
      if (mainContent) {
        mainContent.style.opacity = '0.5';
        mainContent.style.pointerEvents = 'none';
      }
      
      try {
        const response = await fetch(href);
        if (!response.ok) throw new Error('Network response was not ok');
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        const newMain = doc.querySelector('main.app-main');
        if (newMain) {
          // Reemplazar main principal
          if (mainContent) {
            mainContent.replaceWith(newMain);
          } else {
            document.body.appendChild(newMain);
          }
          
          document.title = doc.title;
          
          // Asegurar que si la nueva página requiere Bootstrap CSS, se inyecte
          const currentLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'));
          doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const hrefAttr = link.getAttribute('href');
            if (hrefAttr && !currentLinks.includes(hrefAttr)) {
              const newLink = document.createElement('link');
              newLink.rel = 'stylesheet';
              newLink.href = hrefAttr;
              newLink.className = 'spa-dynamic-style';
              document.head.appendChild(newLink);
            }
          });
          
          // Sincronizar y ejecutar scripts
          const currentExternalSrcs = Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
          const newScripts = Array.from(doc.querySelectorAll('script'));
          
          for (const oldScript of newScripts) {
            const src = oldScript.getAttribute('src');
            
            // Ignorar scripts base para evitar conflictos
            if (src && (src.includes('layout-menu.js') || src.includes('roles.js'))) continue;
            
            // Si es una librería externa (CDN), cargarla solo una vez y esperar a que termine
            if (src && src.startsWith('http')) {
              if (!currentExternalSrcs.includes(src)) {
                await new Promise(resolve => {
                  const newScript = document.createElement('script');
                  newScript.src = src;
                  newScript.onload = resolve;
                  newScript.onerror = resolve;
                  document.head.appendChild(newScript);
                  currentExternalSrcs.push(src); // registrar para no volver a cargar
                });
              }
              continue;
            }
            
            // Scripts locales o inline: re-ejecutar siempre
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            if (!src) newScript.textContent = oldScript.textContent;
            newScript.className = 'spa-dynamic-script';
            document.body.appendChild(newScript);
            
            // Limpiar scripts inline del DOM para no saturarlo
            if (!src) {
              setTimeout(() => { if (newScript.parentNode) newScript.remove(); }, 100);
            }
          }

          // Cerrar sidebar en móviles tras navegar
          const sidebar = document.getElementById('sidebar');
          const overlay = document.getElementById('sidebarOverlay');
          if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
          }
          
          window.history.pushState(null, '', href);
          window.scrollTo(0, 0);
          
          // Trigger evento personalizado por si otros módulos lo necesitan
          document.dispatchEvent(new Event('spa-navigated'));
        } else {
          window.location.href = href; // fallback si la página no tiene un <main> compatible
        }
      } catch (err) {
        console.error('SPA Navigation Error:', err);
        window.location.href = href; // fallback si falla fetch
      }
    });
    
    // Manejar botón de retroceso nativo del navegador
    window.addEventListener('popstate', () => {
      window.location.reload(); 
    });
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderSidebar();
    initSidebarToggle();
    initSpaRouter();
  });
})();

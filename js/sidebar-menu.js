/* Sidebar compartido para todas las páginas administrativas de SICAG */
(function() {
  const menuSections = [
    {
      title: 'Gestión Principal',
      items: [
        { href: 'dashboard.html', icon: 'tachometer-alt', label: 'Dashboard' },
        { href: 'censo.html', icon: 'users', label: 'Censo Comunitario', badge: '347' },
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
        { href: '#', icon: 'cog', label: 'Configuración' },
        { href: 'index.html', icon: 'globe', label: 'Portal Público', target: '_blank' },
        { href: 'login.html', icon: 'sign-out-alt', label: 'Cerrar Sesión', style: 'color:rgba(255,100,100,.7);' }
      ]
    }
  ];

  function getCurrentPage() {
    const path = window.location.pathname.split('/').pop();
    return path || 'dashboard.html';
  }

  function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const currentPage = getCurrentPage();
    const htmlSections = menuSections.map(section => {
      const items = section.items.map(item => {
        const isActive = item.href === currentPage;
        const activeClass = isActive ? ' sidebar-nav-link active' : ' sidebar-nav-link';
        const ariaCurrent = isActive ? ' aria-current="page"' : '';
        const target = item.target ? ` target="${item.target}"` : '';
        const style = item.style ? ` style="${item.style}"` : '';
        const badge = item.badge ? `<span class="sidebar-badge">${item.badge}</span>` : '';
        return `
          <li class="sidebar-nav-item">
            <a href="${item.href}" class="${activeClass.trim()}"${ariaCurrent}${target}${style}>
              <i class="fas fa-${item.icon}"></i><span>${item.label}</span>${badge}
            </a>
          </li>`;
      }).join('');

      return `
        <span class="sidebar-section-title">${section.title}</span>
        <ul class="sidebar-nav">${items}
        </ul>`;
    }).join('');

    sidebar.className = 'app-sidebar';
    sidebar.setAttribute('role', 'navigation');
    sidebar.setAttribute('aria-label', 'Menú principal');
    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon"><i class="fas fa-seedling"></i></div>
        <div class="sidebar-brand-text">
          <strong>SICAG</strong>
          <small>Panel Administrativo v3.0</small>
        </div>
      </div>
      ${htmlSections}
      <div class="sidebar-footer">
        <small>SICAG v3.0 · Sala de Autogobierno · 2026</small>
      </div>`;
  }

  window.addEventListener('DOMContentLoaded', renderSidebar);
})();

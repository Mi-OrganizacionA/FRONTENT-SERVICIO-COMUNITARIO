/**
 * ============================================================
 * SICAG — Sistema de Información Comunal Agroecológica
 * Utilidades JavaScript Compartidas
 * Comuna Socialista Simón Rodríguez — Venezuela
 * ============================================================
 */

// ---- SIDEBAR TOGGLE (shared across dashboard pages) ----
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      const icon = this.querySelector('i');
      if (sidebar.classList.contains('open')) {
        icon.classList.replace('fa-bars', 'fa-times');
      } else {
        icon.classList.replace('fa-times', 'fa-bars');
      }
    });

    // Close sidebar when clicking outside on mobile/tablet
    document.addEventListener('click', function (e) {
      if (
        window.innerWidth < 992 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        sidebar.classList.remove('open');
        const icon = toggle.querySelector('i');
        icon.classList.replace('fa-times', 'fa-bars');
      }
    });

    // Close sidebar on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        const icon = toggle.querySelector('i');
        icon.classList.replace('fa-times', 'fa-bars');
      }
    });
  }
}

// ---- ACTIVE SIDEBAR LINK ----
function setActiveSidebarLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ---- NOTIFICATION SYSTEM (demo) ----
function initNotifications() {
  const btn = document.getElementById('notifBtn');
  if (!btn) return;

  const notifications = [
    { title: 'Nuevo proyecto registrado', text: 'Parcela Los Mangos ha sido creado por Vocero María.', time: 'Hace 5 min', icon: 'fa-leaf', color: '#4CAF50' },
    { title: 'Cosecha completada', text: 'Conuco Ribas reportó 1,200 kg de yuca cosechados.', time: 'Hace 1 hora', icon: 'fa-wheat-awn', color: '#D2691E' },
    { title: 'Alerta de siembra', text: 'Se acerca la fecha de siembra de Café Orgánico Montaña.', time: 'Hace 3 horas', icon: 'fa-calendar-alt', color: '#FF8C00' }
  ];

  btn.addEventListener('click', function () {
    // Simple alert demo (could be replaced with a dropdown)
    let msg = '🔔 NOTIFICACIONES\n\n';
    notifications.forEach((n, i) => {
      msg += `${i + 1}. ${n.title}\n   ${n.text}\n   ⏰ ${n.time}\n\n`;
    });
    alert(msg);
  });
}

// ---- SEARCH FUNCTIONALITY (demo) ----
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearch');
  if (!searchInput) return;

  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const query = this.value.trim();
      if (query) {
        alert(`🔍 Buscando: "${query}"\n\nEsta funcionalidad se conectará con el backend para buscar proyectos, reportes y usuarios.`);
      }
    }
  });
}

// ---- FORMAT NUMBERS ----
function formatNumber(num) {
  return num.toLocaleString('es-VE');
}

// ---- ANIMATE COUNTER ----
function animateCounter(element, target, suffix = '', duration = 1200) {
  let current = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quad
    const eased = 1 - (1 - progress) * (1 - progress);
    current = Math.floor(eased * target);
    element.textContent = formatNumber(current) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatNumber(target) + suffix;
    }
  }

  requestAnimationFrame(update);
}

// ---- INTERSECTION OBSERVER for fade-in animations ----
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-in-up, .fade-in-left').forEach((el) => {
    if (!el.style.opacity) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    }
    observer.observe(el);
  });
}

// ---- TOOLTIP INIT (Bootstrap) ----
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach((el) => new bootstrap.Tooltip(el));
}

// ---- DARK MODE TOGGLE (future) ----
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// ---- LOADING BUTTON HELPER ----
function setButtonLoading(btn, loading, originalHTML) {
  if (loading) {
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Procesando...';
    btn.disabled = true;
  } else {
    btn.innerHTML = originalHTML || btn._originalHTML || 'Listo';
    btn.disabled = false;
  }
}

// ---- CONFIRM DIALOG HELPER ----
function showConfirm(message, onConfirm) {
  if (confirm(message)) {
    onConfirm();
  }
}

// ---- DATE FORMATTING ----
function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('es-VE', options);
}

// ---- INIT ON DOM READY ----
document.addEventListener('DOMContentLoaded', function () {
  initSidebar();
  setActiveSidebarLink();
  initNotifications();
  initGlobalSearch();
  initScrollAnimations();

  // Init Bootstrap tooltips if available
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    initTooltips();
  }

  console.log(
    '%c🌿 SICAG v1.0 — Sistema de Información Comunal Agroecológica',
    'color: #4CAF50; font-size: 14px; font-weight: bold;'
  );
  console.log(
    '%cComuna Socialista Simón Rodríguez — Venezuela',
    'color: #228B22; font-size: 11px;'
  );
});

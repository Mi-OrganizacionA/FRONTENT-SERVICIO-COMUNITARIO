import { authService } from './services/auth-service.js';
import { habitantesService } from './services/habitantes-service.js';
import { produccionService } from './services/produccion-service.js';
import { gruposService } from './services/grupos-service.js';
import { censoService } from './services/censo-service.js';

window.authService = authService;
window.habitantesService = habitantesService;
window.produccionService = produccionService;
window.gruposService = gruposService;
window.censoService = censoService;

// Firebase Auth no es el sistema principal de login.
// Comentado para evitar confusiones en consola:
// authService.onAuthChange(user => {
//   if (user) {
//     console.log('Firebase authenticated user:', user.uid);
//     if (window.Components && Components.applyCommunityScope) {
//       Components.applyCommunityScope();
//     }
//   } else {
//     console.log('Firebase session closed.');
//   }
// });

/**
 * ============================================================
 * SICAG — Sistema de Información Comunal Agroecológica
 * Utilidades JavaScript Compartidas
 * Comuna Socialista Agroecológica Simón Rodríguez — Venezuela
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
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    tooltipTriggerList.forEach((el) => bootstrap.Tooltip.getOrCreateInstance(el));
  }
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

// ---- SYNC NOTIFICATIONS ----
window.addEventListener('offline:syncCompleted', (e) => {
  if (e.detail && e.detail.sincronizados > 0) {
    if (typeof Components !== 'undefined' && Components.showToast) {
      Components.showToast(`📡 Conexión restaurada: ${e.detail.sincronizados} operaciones sincronizadas con éxito.`, 'success');
    }
  }
});
window.addEventListener('censo:syncCompleted', (e) => {
  if (e.detail && e.detail.sincronizados > 0) {
    if (typeof Components !== 'undefined' && Components.showToast) {
      Components.showToast(`📡 Censo sincronizado: ${e.detail.sincronizados} encuestas enviadas con éxito.`, 'success');
    }
  }
});

// ---- INIT ON DOM READY ----
document.addEventListener('DOMContentLoaded', function () {
  initSidebar();
  setActiveSidebarLink();
  initNotifications();
  initGlobalSearch();
  initScrollAnimations();

  // Cargar configuraciones del sistema desde el backend al localStorage
  if (window.api && typeof window.api.getSystemConfig === 'function') {
    window.api.getSystemConfig().catch(err => console.warn('No se pudo cargar configuración:', err));
  }

  // Init Bootstrap tooltips if available
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    initTooltips();
  }

  // Re-init tooltips when any modal opens (useful for dynamically loaded forms)
  document.addEventListener('shown.bs.modal', function () {
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      initTooltips();
    }
  });

  console.log(
    '%c🌿 SICAG v2.5 — Sistema de Información Comunal Agroecológica',
    'color: #4CAF50; font-size: 14px; font-weight: bold;'
  );
  console.log(
    '%cComuna Socialista Agroecológica Simón Rodríguez — Venezuela',
    'color: #228B22; font-size: 11px;'
  );
});
  // ---- REGISTRO DEL SERVICE WORKER (PWA - MODO OFFLINE) ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((registration) => {
          console.log('[PWA] Service Worker registrado con éxito. Scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Error al registrar el Service Worker:', error);
        });
    });
  }

  // ---- GESTIÓN DE INSTALACIÓN (Añadir a pantalla de inicio) ----
  window.addEventListener('beforeinstallprompt', (e) => {
    // Guarda el evento para poder dispararlo luego con un botón de "Instalar App"
    window.deferredPrompt = e;
    console.log('[PWA] El evento beforeinstallprompt fue capturado. Listo para instalar.');
  });

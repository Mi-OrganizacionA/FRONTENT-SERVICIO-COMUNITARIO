/**
 * Componentes reutilizables de SICAG v2.5 y utilidades de interfaz
 * Archivo: js/components.js
 */

class Components {
  // ─────────────────────────────────────────
  // Toast notifications (Notificaciones flotantes)
  // ─────────────────────────────────────────
  static showToast(mensaje, tipo = 'info', duracion = 3000) {
    const toastId = 'toast-' + Date.now();
    const colores = {
      success: '#2E7D32',
      error: '#C62828',
      warning: '#F9A825',
      info: '#1565C0'
    };

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colores[tipo] || colores.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${mensaje}
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(400px); }
          to { transform: translateX(0); }
        }
      </style>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      const el = document.getElementById(toastId);
      if (el) {
        el.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => el.remove(), 300);
      }
    }, duracion);
  }

  // ─────────────────────────────────────────
  // Modal de confirmación dinámica
  // ─────────────────────────────────────────
  static confirmDialog(mensaje, onConfirm, onCancel = null) {
    const modalId = 'modal-' + Date.now();
    const modal = document.createElement('div');
    modal.id = modalId;
    
    // Asignar funciones globales temporales para los botones en linea
    window[`confirm_${modalId}`] = () => {
      document.getElementById(modalId).remove();
      delete window[`confirm_${modalId}`];
      delete window[`cancel_${modalId}`];
      if (typeof onConfirm === 'function') onConfirm();
    };

    window[`cancel_${modalId}`] = () => {
      document.getElementById(modalId).remove();
      delete window[`confirm_${modalId}`];
      delete window[`cancel_${modalId}`];
      if (typeof onCancel === 'function') onCancel();
    };

    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      " onclick="if(event.target === this) window['cancel_${modalId}']()">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          text-align: center;
          position: relative;
        ">
          <button onclick="window['cancel_${modalId}']()" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: transparent;
            border: none;
            font-size: 20px;
            color: #999;
            cursor: pointer;
            transition: color 0.2s;
          " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#999'" title="Cerrar">
            <i class="fas fa-times"></i>
          </button>
          <div style="font-size: 48px; color: #F9A825; margin-bottom: 16px;">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 style="margin-bottom: 16px; color: #1A1A1A; font-family: 'Poppins', sans-serif;">Confirmación Requerida</h3>
          <p style="color: #666; margin-bottom: 24px;">${mensaje}</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="window['cancel_${modalId}']()" style="
              padding: 10px 20px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: background 0.2s;
            " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">Cancelar</button>
            
            <button onclick="window['confirm_${modalId}']()" style="
              padding: 10px 20px;
              background: #2E7D32;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: background 0.2s;
            " onmouseover="this.style.background='#1B5E20'" onmouseout="this.style.background='#2E7D32'">Confirmar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // ─────────────────────────────────────────
  // Modal de acción dinámica (Botones Personalizados)
  // ─────────────────────────────────────────
  static actionDialog({ titulo, mensaje, icono = 'fa-question-circle', colorIcono = '#1565C0', btnPrimaryText, btnPrimaryIcon, btnPrimaryColor = '#2E7D32', btnSecondaryText, btnSecondaryIcon, onPrimary, onSecondary }) {
    const modalId = 'modal-action-' + Date.now();
    const modal = document.createElement('div');
    modal.id = modalId;
    
    window[`primary_${modalId}`] = () => {
      document.getElementById(modalId).remove();
      delete window[`primary_${modalId}`];
      delete window[`secondary_${modalId}`];
      if (typeof onPrimary === 'function') onPrimary();
    };

    window[`secondary_${modalId}`] = () => {
      document.getElementById(modalId).remove();
      delete window[`primary_${modalId}`];
      delete window[`secondary_${modalId}`];
      if (typeof onSecondary === 'function') onSecondary();
    };

    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.2s ease-out;
      " onclick="if(event.target === this) { document.getElementById('${modalId}').remove(); delete window['primary_${modalId}']; delete window['secondary_${modalId}']; }">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          text-align: center;
          position: relative;
          animation: slideUp 0.3s ease-out;
        ">
          <button onclick="document.getElementById('${modalId}').remove(); delete window['primary_${modalId}']; delete window['secondary_${modalId}'];" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: transparent;
            border: none;
            font-size: 20px;
            color: #999;
            cursor: pointer;
            transition: color 0.2s;
          " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#999'" title="Cerrar">
            <i class="fas fa-times"></i>
          </button>
          <div style="font-size: 48px; color: ${colorIcono}; margin-bottom: 16px;">
            <i class="fas ${icono}"></i>
          </div>
          <h3 style="margin-bottom: 12px; color: #1A1A1A; font-family: 'Poppins', sans-serif;">${titulo}</h3>
          <p style="color: #666; margin-bottom: 24px; font-size: 15px; line-height: 1.5;">${mensaje}</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button onclick="window['secondary_${modalId}']()" style="
              padding: 10px 20px;
              border: 1px solid #ddd;
              background: #f8f9fa;
              color: #333;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              gap: 8px;
            " onmouseover="this.style.background='#e2e6ea'; this.style.borderColor='#dae0e5'" onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#ddd'">
              ${btnSecondaryIcon ? `<i class="fas ${btnSecondaryIcon}"></i>` : ''} ${btnSecondaryText}
            </button>
            
            <button onclick="window['primary_${modalId}']()" style="
              padding: 10px 20px;
              background: ${btnPrimaryColor};
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='none'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
              ${btnPrimaryIcon ? `<i class="fas ${btnPrimaryIcon}"></i>` : ''} ${btnPrimaryText}
            </button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      </style>
    `;

    document.body.appendChild(modal);
  }

  // ─────────────────────────────────────────
  // Spinner de carga
  // ─────────────────────────────────────────
  static createLoadingSpinner() {
    return `
      <div style="display: flex; justify-content: center; align-items: center; padding: 40px; flex-direction: column; gap: 12px; color: #666;">
        <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--primary);"></i>
        <span>Cargando datos...</span>
      </div>
    `;
  }

  // ─────────────────────────────────────────
  // Badge de Estado
  // ─────────────────────────────────────────
  static createBadge(estado) {
    const estilos = {
      'Activo': { bg: 'rgba(76, 175, 80, 0.1)', color: '#2E7D32' },
      'En Desarrollo': { bg: 'rgba(255, 152, 0, 0.1)', color: '#E65100' },
      'Pendiente': { bg: 'rgba(158, 158, 158, 0.1)', color: '#616161' },
      'Inactivo': { bg: 'rgba(244, 67, 54, 0.1)', color: '#C62828' }
    };
    
    const estilo = estilos[estado] || estilos['Pendiente'];
    
    return `<span style="
      background: ${estilo.bg};
      color: ${estilo.color};
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    "><i class="fas fa-circle" style="font-size: 6px;"></i> ${estado}</span>`;
  }

  // ─────────────────────────────────────────
  // Alcance por Consejo Comunal (Contexto Visual y Bloqueos)
  // ─────────────────────────────────────────
  static applyCommunityScope() {
    const user = window.auth ? window.auth.getUser() : null;
    if (!user || !user.rol || user.rol.toLowerCase() !== 'vocero') return;
    
    // 1. Mostrar banner de comunidad activa
    let headerMain = document.querySelector('.page-header') || document.querySelector('.main-content');
    let banner = document.getElementById('communityScopeBanner');
    if (!banner && headerMain) {
      banner = document.createElement('div');
      banner.id = 'communityScopeBanner';
      banner.style.cssText = `
        background-color: var(--primary, #2E7D32);
        color: white;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;
      banner.innerHTML = `<i class="fas fa-users"></i> Consejo Comunal Activo: <strong>${user.consejoComunal || 'Tu Comunidad'}</strong> (Vista Restringida)`;
      if (headerMain.firstChild) {
        headerMain.insertBefore(banner, headerMain.firstChild);
      } else {
        headerMain.appendChild(banner);
      }
    }

    // 2. Bloquear cualquier selector de consejo comunal
    const lockSelects = () => {
      const selectors = document.querySelectorAll('select[id*="consejo"], select[name*="consejo"], select[id*="comunidad"], select[id="comunidadAsignada"]');
      selectors.forEach(select => {
        let found = false;
        Array.from(select.options).forEach(opt => {
          if (opt.text.trim() === user.consejoComunal || String(opt.value) === String(user.id_comunidad_asignada)) {
            opt.selected = true;
            found = true;
          }
        });
        
        // Si no se encontró pero hay opciones y estamos seguros de que es un select de CC
        if (!found && select.options.length > 1) {
           // A veces el texto del option tiene espacios extra
           Array.from(select.options).forEach(opt => {
             if (opt.text.toLowerCase().includes(user.consejoComunal?.toLowerCase())) {
               opt.selected = true;
               found = true;
             }
           });
        }
        
        if (select.options.length > 0) {
           select.disabled = true;
           select.title = "Solo puedes gestionar registros de tu propio consejo comunal.";
        }
      });
    };
    
    // Ejecutar inmediatamente y también observar cambios en el DOM para modals
    lockSelects();
    setTimeout(lockSelects, 500);
    setTimeout(lockSelects, 2000);
  }
}

// ─────────────────────────────────────────
// Funciones Legadas de compatibilidad (SICAG object)
// ─────────────────────────────────────────
const SICAG = {
  loadComponent: async (targetId, filePath, callback) => {
    // Si quedan referencias viejas
    console.warn('SICAG.loadComponent is deprecated in v2.5.');
  },
  getSession: () => {
    // Proxy al nuevo auth
    return window.auth ? window.auth.getUser() : null;
  },
  logout: () => {
    if (window.auth) window.auth.logout();
  }
};

window.Components = Components;
window.SICAG = SICAG;

/**
 * SicagBadgePendientes
 * Badge visual que muestra cuántas operaciones están pendientes de sincronización.
 * Se actualiza automáticamente al escuchar el evento 'offline:pendingCount'.
 *
 * USO: Llamar SicagBadgePendientes.init() al cargar cualquier página del panel privado.
 *
 * HTML requerido (agregar en dashboard.html y otras páginas):
 * <span id="badgePendientesOffline" class="badge bg-warning text-dark" style="display:none">0</span>
 */
window.SicagBadgePendientes = {
  _badge: null,
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._badge = document.getElementById('badgePendientesOffline');
    if (!this._badge) {
      console.warn('[Badge] No se encontró #badgePendientesOffline en el DOM.');
      return;
    }

    // Escuchar actualizaciones del conteo
    window.addEventListener('offline:pendingCount', (e) => {
      this._actualizarConConflictos();
    });

    // Escuchar sincronización completada
    window.addEventListener('offline:syncCompleted', (e) => {
      const pendientes = e.detail?.fallidas || 0;
      this._actualizarConConflictos();
      if (e.detail?.sincronizados > 0 && window.Components?.showToast) {
        Components.showToast(
          `✅ ${e.detail.sincronizados} operación(es) sincronizadas con el servidor.`,
          'success'
        );
      }
    });

    // Escuchar operaciones fallidas permanentemente
    window.addEventListener('offline:operacionFallida', (e) => {
      if (window.Components?.showToast) {
        Components.showToast(
          `⚠️ Una operación no pudo sincronizarse después de varios intentos. Contáctese con el administrador.`,
          'error'
        );
      }
    });

        window.addEventListener('offline:conflictoDetectado', (e) => {
      const conf = e.detail;
      if (window.Components?.showToast) {
        Components.showToast(
          '⚠️ Conflicto en ' + (conf.operacion?.modulo || 'un registro') + ': ya existe un registro con los mismos datos. El administrador debe resolverlo.',
          'warning'
        );
      }
      this._actualizarConConflictos();
    });

    window.addEventListener('offline:registroEliminado', (e) => {
      if (window.Components?.showToast) {
        Components.showToast(
          'ℹ️ Un registro que intentabas modificar fue eliminado por otro usuario. La operación fue descartada.',
          'info'
        );
      }
    });

    window.addEventListener('offline:operacionInvalida', (e) => {
      if (window.Components?.showToast) {
        Components.showToast(
          'ℹ️ Una operación offline fue descartada porque los datos ya no son válidos.',
          'info'
        );
      }
    });
    this._initialized = true;

    // Cargar conteo inicial
    this._cargarConteoInicial();
  },

  async _cargarConteoInicial() {
    try {
      if (window.SicagDB) {
        const cola = await window.SicagDB.obtenerColaEscritura();
        this._actualizarConConflictos();
      }
    } catch (e) { /* ignorar */ }
  },

  async _actualizarConConflictos() {
    if (!this._badge) return;
    try {
      let pendientes = 0;
      let conflictos = 0;
      if (window.SicagDB) {
        const cola = await window.SicagDB.obtenerColaEscritura();
        pendientes = cola.length;
      }
      if (window.SicagConflictos) {
        conflictos = await window.SicagConflictos.contarConflictos();
      }
      const total = pendientes + conflictos;
      if (total > 0) {
        this._badge.textContent = total;
        this._badge.style.display = '';
        // Cambiar color si hay conflictos (rojo) vs solo pendientes (naranja)
        this._badge.style.backgroundColor = conflictos > 0 ? '#C62828' : '#E65100';
        this._badge.title = `${pendientes} pendiente(s), ${conflictos} conflicto(s)`;
      } else {
        this._badge.style.display = 'none';
      }
    } catch (e) { /* ignorar */ }
  }
};

/**
 * SicagFormOffline
 * Muestra un banner en la parte superior de un formulario cuando no hay internet.
 * El vocero sabe que sus cambios se guardarán localmente.
 *
 * USO: Llamar SicagFormOffline.init('idDelFormulario') en cada página con formularios.
 * ALTERNATIVA: Llamar SicagFormOffline.initTodos() para aplicar a todos los formularios.
 */
window.SicagFormOffline = {
  _banners: new Map(), // formId → elemento banner

  /**
   * Inicializa el indicador para un formulario específico.
   * @param {string} formId - ID del formulario HTML
   */
  init(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const banner = document.createElement('div');
    banner.className = 'sicag-form-offline-banner';
    banner.style.cssText = `
      display: none;
      background: #FFF3CD; border: 1px solid #FFC107; border-radius: 6px;
      padding: 8px 14px; margin-bottom: 12px; font-size: 0.83rem; color: #856404;
      align-items: center; gap: 8px;
    `;
    banner.innerHTML = `
      <i class="fas fa-wifi" style="text-decoration: line-through;"></i>
      <span>Sin conexión. Tus cambios se guardarán localmente y se sincronizarán cuando haya internet.</span>
    `;
    // Insertar como primer hijo del formulario
    form.insertBefore(banner, form.firstChild);
    this._banners.set(formId, banner);

    // Mostrar/ocultar según estado de conexión actual
    this._actualizar(banner);
  },

  /**
   * Aplica el indicador a TODOS los formularios de la página.
   */
  initTodos() {
    document.querySelectorAll('form[id]').forEach(form => {
      this.init(form.id);
    });
    // Si no hay forms con ID, buscar divs que funcionen como formularios
    document.querySelectorAll('.modal-body, .card-body').forEach((container, idx) => {
      if (container.querySelector('input, textarea, select')) {
        const fakeId = `sicag-form-auto-${idx}`;
        container.id = fakeId;
        const banner = document.createElement('div');
        banner.style.cssText = `
          display:none; background:#FFF3CD; border:1px solid #FFC107; border-radius:6px;
          padding:8px 14px; margin-bottom:12px; font-size:0.83rem; color:#856404;
        `;
        banner.innerHTML = `<i class="fas fa-wifi" style="text-decoration: line-through;"></i> Sin conexión — cambios guardados localmente.`;
        container.insertBefore(banner, container.firstChild);
        this._banners.set(fakeId, banner);
        this._actualizar(banner);
      }
    });
  },

  _actualizar(banner) {
    if (!navigator.onLine) {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  },

  _actualizarTodos(online) {
    this._banners.forEach(banner => {
      banner.style.display = online ? 'none' : 'flex';
    });
  }
};

// Escuchar cambios de conectividad para actualizar todos los banners
window.addEventListener('online',  () => window.SicagFormOffline._actualizarTodos(true));
window.addEventListener('offline', () => window.SicagFormOffline._actualizarTodos(false));


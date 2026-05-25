/**
 * Componentes reutilizables de SICAG v5.0 y utilidades de interfaz
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
      ">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          text-align: center;
        ">
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
}

// ─────────────────────────────────────────
// Funciones Legadas de compatibilidad (SICAG object)
// ─────────────────────────────────────────
const SICAG = {
  loadComponent: async (targetId, filePath, callback) => {
    // Si quedan referencias viejas
    console.warn('SICAG.loadComponent is deprecated in v5.0.');
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

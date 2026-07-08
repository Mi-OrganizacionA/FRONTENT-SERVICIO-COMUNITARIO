const fs = require('fs');
const path = require('path');

const compPath = path.join(__dirname, 'js/components.js');
let content = fs.readFileSync(compPath, 'utf8');

// --- PASO 4.3 ---
const conflictEvents = `
    // Escuchar operaciones fallidas permanentemente
    window.addEventListener('offline:operacionFallida', (e) => {
      if (window.Components?.showToast) {
        Components.showToast(
          \`⚠️ Una operación no pudo sincronizarse después de varios intentos. Contáctese con el administrador.\`,
          'error'
        );
      }
    });

    window.addEventListener('offline:conflictoDetectado', (e) => {
      const conf = e.detail;
      if (window.Components?.showToast) {
        Components.showToast(
          \`⚠️ Conflicto en \${conf.operacion?.modulo || 'un registro'}: ya existe un registro con los mismos datos. El administrador debe resolverlo.\`,
          'warning'
        );
      }
      this._actualizarConConflictos();
    });

    window.addEventListener('offline:registroEliminado', (e) => {
      if (window.Components?.showToast) {
        Components.showToast(
          \`ℹ️ Un registro que intentabas modificar fue eliminado por otro usuario. La operación fue descartada.\`,
          'info'
        );
      }
    });

    window.addEventListener('offline:operacionInvalida', (e) => {
      if (window.Components?.showToast) {
        Components.showToast(
          \`ℹ️ Una operación offline fue descartada porque los datos ya no son válidos.\`,
          'info'
        );
      }
    });
`;

// Reemplazar la parte del evento offline:operacionFallida original
const oldOperacionFallida = `    // Escuchar operaciones fallidas permanentemente
    window.addEventListener('offline:operacionFallida', (e) => {
      if (window.Components?.showToast) {
        Components.showToast(
          \`⚠️ Una operación no pudo sincronizarse después de varios intentos. Contáctese con el administrador.\`,
          'error'
        );
      }
    });`;

if (content.includes(oldOperacionFallida)) {
    content = content.replace(oldOperacionFallida, conflictEvents);
} else {
    console.warn('oldOperacionFallida not found');
}

// Reemplazar _actualizar por _actualizarConConflictos y cambiar la llamada en _cargarConteoInicial
const funcActualizarConflictos = `  async _actualizarConConflictos() {
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
        this._badge.className = conflictos > 0
          ? 'badge-notif bg-danger'
          : 'badge-notif bg-warning text-dark';
        this._badge.style.backgroundColor = conflictos > 0 ? '#C62828' : '#E65100';
        this._badge.title = \`\${pendientes} pendiente(s), \${conflictos} conflicto(s)\`;
      } else {
        this._badge.style.display = 'none';
      }
    } catch (e) { /* ignorar */ }
  }
};`;

content = content.replace(/_actualizar\(total\) \{[\s\S]*?\n\};/, funcActualizarConflictos);
content = content.replace(/this._actualizar\(cola.length\);/g, 'this._actualizarConConflictos();');
content = content.replace(/this._actualizar\(pendientes\);/g, 'this._actualizarConConflictos();');
content = content.replace(/this._actualizar\(e.detail\?.total \|\| 0\);/g, 'this._actualizarConConflictos();');

// --- PASO 4.5 ---
const formOffline = `
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
    banner.style.cssText = \`
      display: none;
      background: #FFF3CD; border: 1px solid #FFC107; border-radius: 6px;
      padding: 8px 14px; margin-bottom: 12px; font-size: 0.83rem; color: #856404;
      align-items: center; gap: 8px;
    \`;
    banner.innerHTML = \`
      <i class="fas fa-wifi" style="text-decoration: line-through;"></i>
      <span>Sin conexión. Tus cambios se guardarán localmente y se sincronizarán cuando haya internet.</span>
    \`;
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
        const fakeId = \`sicag-form-auto-\${idx}\`;
        container.id = fakeId;
        const banner = document.createElement('div');
        banner.style.cssText = \`
          display:none; background:#FFF3CD; border:1px solid #FFC107; border-radius:6px;
          padding:8px 14px; margin-bottom:12px; font-size:0.83rem; color:#856404;
        \`;
        banner.innerHTML = \`<i class="fas fa-wifi" style="text-decoration: line-through;"></i> Sin conexión — cambios guardados localmente.\`;
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
`;

content = content + '\\n' + formOffline;

fs.writeFileSync(compPath, content, 'utf8');
console.log('Update completed in components.js');

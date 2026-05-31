/**
 * Módulo de Censo Comunitario (SICAG v5.0)
 * Archivo: js/modules/censo.js
 */

class CensoController {
  constructor() {
    this.habitantes = [];
    this.form = new FormValidator('formCenso', 'habitante');
    this.init();
  }

  async init() {
    try {
      this._setupUI();
      await this.cargarDatos();
    } catch (error) {
      console.error('Error inicializando Censo:', error);
      if (window.Components) Components.showToast('Error al cargar módulo de Censo', 'error');
    }
  }

  _setupUI() {
    // Calculo automático de edad y estatus
    const fechaNacInput = document.getElementById('habFechaNac');
    if (fechaNacInput) {
      fechaNacInput.addEventListener('change', () => this.calcularDatosNacimiento(fechaNacInput.value));
    }

    // Toggle para rubro productor
    const productorSelect = document.getElementById('habProductor');
    if (productorSelect) {
      productorSelect.addEventListener('change', () => this.toggleRubroProduccion());
    }

    // Escuchar el evento de formulario válido de FormValidator
    const formElement = document.getElementById('formCenso');
    if (formElement) {
      formElement.addEventListener('validSubmit', (e) => this.guardarHabitante(e.detail));
    }

    // Exponer métodos globalmente para botones onClick en HTML (legacy support temporal)
    window.abrirModalCenso = (id) => this.abrirModalCenso(id);
    window.cerrarModalCenso = () => this.cerrarModalCenso();
    window.confirmarEliminarHab = (id) => this.confirmarEliminarHab(id);
    window.filtrarCenso = (e) => this.filtrarCenso(e);
    window.exportarExcelCenso = () => this.exportarExcelCenso();
    window.cerrarModalElimHab = () => this.cerrarModalElimHab();
  }

  async cargarDatos() {
    const tbody = document.getElementById('censoBody');
    if (!tbody) return;
    
    // Mostramos un spinner inicial si la tabla está vacía
    if (tbody.innerHTML.trim() === '') {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">${Components.createLoadingSpinner()}</td></tr>`;
    }

    try {
      this.habitantes = await window.api.getHabitantes();
      this.renderizarTabla();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:red;">Error cargando datos</td></tr>`;
    }
  }

  renderizarTabla() {
    const tbody = document.getElementById('censoBody');
    if (!tbody) return;

    if (this.habitantes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;">No hay habitantes registrados</td></tr>`;
      return;
    }

    tbody.innerHTML = this.habitantes.map(h => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="user-avatar-sm">${h.nombre.charAt(0).toUpperCase()}${h.apellido ? h.apellido.charAt(0).toUpperCase() : ''}</div>
            <div>
              <strong>${h.nombre} ${h.apellido || ''}</strong><br>
              <small class="text-gris">C.I. V-${h.cedula}</small>
            </div>
          </div>
        </td>
        <td>${h.edad} años</td>
        <td>${h.genero}</td>
        <td>${h.consejoComunal}</td>
        <td>${h.telefono || 'N/A'}</td>
        <td><span class="badge ${this._getColorClasificacion(h.clasificacion)}">${this._formatClasificacion(h.clasificacion)}</span></td>
        <td>${h.elector ? '<span class="status-indicator active">Sí</span>' : '<span class="status-indicator inactive">No</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-action view" title="Ver Expediente" onclick="abrirModalCenso(${h.id})"><i class="fas fa-file-alt"></i></button>
            <button class="btn-action edit" title="Editar" onclick="abrirModalCenso(${h.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete" title="Eliminar" onclick="confirmarEliminarHab(${h.id})"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  abrirModalCenso(id) {
    const modal = document.getElementById('modalCenso');
    const title = document.getElementById('modalCensoTitle');
    const formElement = document.getElementById('formCenso');
    
    if (id) {
      title.innerHTML = '<i class="fas fa-user-edit" style="color:var(--au);"></i> Editar Habitante #' + id;
      // TODO: Cargar datos en el formulario
    } else {
      title.innerHTML = '<i class="fas fa-user-plus" style="color:var(--vv);"></i> Registrar Habitante';
      if (formElement) {
        formElement.reset();
        this.form.limpiarErrores();
      }
      this.toggleRubroProduccion();
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  cerrarModalCenso() {
    document.getElementById('modalCenso').classList.remove('show');
    document.body.style.overflow = '';
  }

  async guardarHabitante(datosForm) {
    const btn = document.querySelector('#modalCenso .modal-footer-sicag .btn-primary');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      btn.disabled = true;
    }

    try {
      // Simular guardado a API
      const nuevoHabitante = await window.api.crearHabitante({
        cedula: datosForm.cedula,
        nombre: datosForm.nombre_completo.split(' ')[0],
        apellido: datosForm.nombre_completo.split(' ').slice(1).join(' '),
        edad: parseInt(document.getElementById('habEdad').value) || 0,
        genero: datosForm.genero,
        consejoComunal: document.getElementById('habCC').options[document.getElementById('habCC').selectedIndex]?.text || 'Desconocido',
        telefono: datosForm.telefono,
        clasificacion: document.getElementById('t4Status').value.toLowerCase().replace(' ', '_'),
        elector: document.getElementById('electoralStatus').value.includes('Elector')
      });

      if (window.Components) Components.showToast('Habitante registrado con éxito', 'success');
      
      this.cerrarModalCenso();
      await this.cargarDatos(); // Recargar la tabla
    } catch (error) {
      console.error(error);
      if (window.Components) Components.showToast('Error al guardar habitante', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar Habitante';
        btn.disabled = false;
      }
    }
  }

  confirmarEliminarHab(id) {
    Components.confirmDialog(
      `¿Está seguro de que desea eliminar al habitante con ID #${id}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await window.api.eliminarHabitante(id);
          Components.showToast('Habitante eliminado correctamente', 'success');
          await this.cargarDatos();
        } catch(e) {
          Components.showToast('Error al eliminar', 'error');
        }
      }
    );
  }

  cerrarModalElimHab() {
    const modal = document.getElementById('modalEliminarHab');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  calcularDatosNacimiento(fechaStr) {
    const birthDate = new Date(fechaStr);
    const today = new Date();
    
    if (!fechaStr || isNaN(birthDate.getTime())) {
      document.getElementById('habEdad').value = '';
      document.getElementById('t4Status').value = '';
      document.getElementById('electoralStatus').value = '';
      return;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    
    document.getElementById('habEdad').value = age >= 0 ? age : '';

    const t4Value = age >= 0 && age <= 10 ? 'Niño' : age >= 60 ? 'Adulto Mayor' : 'Adulto';
    const electoralValue = age < 15 ? 'Inactivo electoralmente' : age < 18 ? 'Elector Comunal' : 'Elector Universal';

    document.getElementById('t4Status').value = age >= 0 ? t4Value : '';
    document.getElementById('electoralStatus').value = age >= 0 ? electoralValue : '';
  }

  toggleRubroProduccion() {
    const productor = document.getElementById('habProductor')?.value;
    const rubroGroup = document.getElementById('rubroProduccionGroup');
    const rubroInput = document.getElementById('rubroProduccion');
    if (!rubroGroup) return;

    if (productor === 'si') {
      rubroGroup.style.display = 'block';
    } else {
      rubroGroup.style.display = 'none';
      if (rubroInput) rubroInput.value = '';
    }
  }

  filtrarCenso(e) {
    const btn = (e && e.target) ? e.target.closest('.btn-sicag') : null;
    if (!btn) return;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Filtrando...';
    setTimeout(() => { 
      btn.innerHTML = oldHtml;
      Components.showToast('Filtros aplicados (Simulación)', 'info');
    }, 600);
  }

  exportarExcelCenso() {
    const btn = document.getElementById('btnExportCenso');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
        Components.showToast('Descargando archivo Excel...', 'success');
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar Censo';
          btn.disabled = false;
        }, 1500);
      }, 1500);
    }
  }

  _getColorClasificacion(clasif) {
    const map = { 'adulto_mayor': 'badge-danger', 'niño': 'badge-warning', 'adulto': 'badge-primary' };
    return map[clasif] || 'badge-secondary';
  }

  _formatClasificacion(clasif) {
    const map = { 'adulto_mayor': 'Adulto Mayor', 'niño': 'Niño/a', 'adulto': 'Adulto' };
    return map[clasif] || clasif;
  }
}

// Inicialización vía SPA Router o recarga directa
document.addEventListener('DOMContentLoaded', () => {
  window.censoCtrl = new CensoController();
});
document.addEventListener('spa-navigated', () => {
  if (window.location.pathname.includes('censo.html')) {
    window.censoCtrl = new CensoController();
  }
});

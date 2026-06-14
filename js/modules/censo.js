/**
 * Modulo de Censo Comunitario (SICAG v2.5)
 * Archivo: js/modules/censo.js
 */

class CensoController {
  constructor() {
    this.habitantes = [];
    this.editingId = null;
    this.init();
  }

  async init() {
    try {
      this._setupUI();
      await this.cargarDatos();
    } catch (error) {
      console.error('Error inicializando Censo:', error);
      if (window.Components) Components.showToast('Error al cargar modulo de Censo', 'error');
    }
  }

  _setupUI() {
    const fechaNacInput = document.getElementById('habFechaNac');
    if (fechaNacInput) {
      fechaNacInput.addEventListener('change', () => this.calcularDatosNacimiento(fechaNacInput.value));
    }

    const productorSelect = document.getElementById('habProductor');
    if (productorSelect) {
      productorSelect.addEventListener('change', () => this.toggleRubroProduccion());
    }

    window.censoCtrl = this;
  }

  async guardarHabitante(datos) {
    // Validar cédula duplicada antes de guardar (aplica para vocero y administrador)
    const cedulaNueva = (datos.cedula || '').trim();
    if (cedulaNueva) {
      try {
        const existentes = await window.api.getHabitantes({ cedula: cedulaNueva });
        const duplicado = Array.isArray(existentes) && existentes.some(h =>
          (h.cedula || '').trim().toUpperCase() === cedulaNueva.toUpperCase()
        );
        if (duplicado) {
          // Resaltar el campo de cédula con error visual
          const cedulaInput = document.getElementById('habCedula');
          if (cedulaInput) {
            cedulaInput.style.borderColor = '#C62828';
            cedulaInput.style.boxShadow = '0 0 0 3px rgba(198,40,40,.15)';
          }
          if (window.Components) {
            Components.showToast('Ya existe un habitante registrado con esa cédula.', 'error');
          }
          return; // Bloquear el guardado
        }
      } catch (err) {
        console.warn('No se pudo verificar cédulas duplicadas:', err.message);
        // Si falla la verificación, continuamos para no bloquear el flujo
      }
    }

    // Guardar el habitante si no hay duplicado
    try {
      await window.api.crearHabitante(datos);
      if (window.Components) Components.showToast('Habitante registrado correctamente', 'success');
      await this.cargarDatos();
    } catch (error) {
      console.error('Error guardando habitante:', error);
      if (window.Components) Components.showToast('Error al guardar el habitante', 'error');
    }
  }



  async cargarDatos() {
    try {
      const data = await window.api.getHabitantes();
      this.habitantes = data.map(h => {
         let age = h.edad ?? 0;
         if (!age && h.fecha_nacimiento) {
            const today = new Date();
            const fnac = new Date(h.fecha_nacimiento);
            age = today.getFullYear() - fnac.getFullYear();
            if (today.getMonth() < fnac.getMonth() || (today.getMonth() === fnac.getMonth() && today.getDate() < fnac.getDate())) age--;
         }
         return {
            id: h.id,
            nombre: h.nombres,
            apellido: h.apellidos,
            cedula: h.cedula,
            edad: age,
            genero: h.genero,
            consejoComunal: h.consejo?.nombre_comunidad || 'No asignado',
            telefono: h.telefono,
            clasificacion: age >= 60 ? 'adulto_mayor' : age <= 11 ? 'niño' : 'adulto',
            elector: h.elector ?? age >= 18
         };
      });

      this.actualizarKpis();
      this.renderTabla();
    } catch (error) {
      console.error('Error cargando habitantes:', error);
      const tbody = document.getElementById('censoBody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#C62828;">Error cargando datos. Verifique que haya iniciado sesión.</td></tr>`;
      }
    }
  }

  actualizarKpis() {
     const total = this.habitantes.length;
     const electores = this.habitantes.filter(h => h.elector).length;
     
     const elTotal = document.getElementById('kpiHabitantes');
     const elElec = document.getElementById('kpiElectores');
     
     if (elTotal) elTotal.textContent = total;
     if (elElec) elElec.textContent = electores;
     
     const elCC = document.getElementById('kpiCC') || document.getElementById('kpiConsejos');
     if (elCC) elCC.textContent = 9;
  }

  renderTabla(highlightId = null) {
    const tbody = document.getElementById('censoBody');
    if (!tbody) return;

    if (this.habitantes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;">No hay habitantes registrados</td></tr>`;
      return;
    }

    tbody.innerHTML = this.habitantes.map((h, idx) => `
      <tr data-hab-id="${h.id}" class="${highlightId && String(h.id) === String(highlightId) ? 'row-highlight' : ''}">
        <td><span class="cv-cedula">V-${h.cedula}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="user-avatar-sm">${(h.nombre||'?').charAt(0).toUpperCase()}${(h.apellido||'').charAt(0).toUpperCase()}</div>
            <strong>${h.nombre} ${h.apellido || ''}</strong>
          </div>
        </td>
        <td>${h.edad} años</td>
        <td>${h.genero || '—'}</td>
        <td>${h.consejoComunal}</td>
        <td><span class="badge ${this._getColorClasificacion(h.clasificacion)}">${this._formatClasificacion(h.clasificacion)}</span></td>
        <td>${h.elector ? '<span class="status-indicator active">Sí</span>' : '<span class="status-indicator inactive">No</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-action view" title="Ver Expediente" onclick="censoCtrl.verExpediente(${h.id})"><i class="fas fa-id-card"></i></button>
            <button class="btn-action edit" title="Editar" onclick="censoCtrl.editarHabitante(${h.id})"><i class="fas fa-pen-to-square"></i></button>
            <button class="btn-action delete" title="Eliminar" onclick="confirmarEliminarHab(${h.id})"><i class="fas fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    if (highlightId) {
      const row = tbody.querySelector(`tr[data-hab-id="${highlightId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => row.classList.remove('row-highlight'), 4000);
      }
    }
  }

  async editarHabitante(id) {
    try {
      const h = await window.api.getHabitanteById(id);
      this.editingId = id;
      this._llenarFormulario(h);
      const title = document.getElementById('modalCensoTitle');
      if (title) title.textContent = 'Editar Habitante #' + id;
      const modalEl = document.getElementById('modalCenso');
      if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
      if (typeof goTo === 'function') goTo(1);
    } catch (e) {
      console.error(e);
      if (window.Components) Components.showToast('No se pudo cargar el habitante.', 'error');
    }
  }

  verExpediente(id) {
    const h = this.habitantes.find(x => String(x.id) === String(id));
    if (!h) return;
    this.renderTabla(id);
    const info = [
      `Nombre: ${h.nombre} ${h.apellido || ''}`,
      `Cédula: V-${h.cedula}`,
      `Edad: ${h.edad} años`,
      `Género: ${h.genero}`,
      `Consejo Comunal: ${h.consejoComunal}`,
      `Teléfono: ${h.telefono || 'No registrado'}`,
      `Clasificación: ${this._formatClasificacion(h.clasificacion)}`,
      `Elector: ${h.elector ? 'Sí' : 'No'}`
    ].join('\n');
    if (window.Components) {
      Components.showToast('Expediente resaltado en la tabla', 'info');
    }
    alert('EXPEDIENTE DEL HABITANTE\n\n' + info);
  }

  _llenarFormulario(h) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    };
    setVal('habCedula', h.cedula);
    setVal('habNombre', `${h.nombres || ''} ${h.apellidos || ''}`.trim());
    setVal('habFechaNac', h.fecha_nacimiento ? h.fecha_nacimiento.split('T')[0] : '');
    setVal('habGenero', h.genero);
    setVal('habTelefono', h.telefono);
    setVal('habEmail', h.email);
    setVal('habDireccion', h.direccion);
    setVal('habCC', h.consejo_comunal_id);
    setVal('habOcupacion', h.ocupacion);
    setVal('habNivelEducativo', h.nivel_educativo);
    setVal('condicionSalud', h.condicion_salud || 'saludable');
    this.calcularDatosNacimiento(h.fecha_nacimiento ? h.fecha_nacimiento.split('T')[0] : '');
  }

  resetFormulario() {
    this.editingId = null;
    const form = document.getElementById('formCenso');
    if (form) form.reset();
  }

  calcularDatosNacimiento(fechaStr) {
    const birthDate = new Date(fechaStr);
    const today = new Date();
    
    if (!fechaStr || isNaN(birthDate.getTime())) {
      const edad = document.getElementById('habEdad');
      const t4 = document.getElementById('t4Status');
      const elec = document.getElementById('electoralStatus');
      if (edad) edad.value = '';
      if (t4) t4.value = '';
      if (elec) elec.value = '';
      return;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    
    const edadEl = document.getElementById('habEdad');
    if (edadEl) edadEl.value = age >= 0 ? age : '';

    const t4Value = age >= 0 && age <= 10 ? 'Niño' : age >= 60 ? 'Adulto Mayor' : 'Adulto';
    const electoralValue = age < 15 ? 'Inactivo electoralmente' : age < 18 ? 'Elector Comunal' : 'Elector Universal';

    const t4El = document.getElementById('t4Status');
    const elecEl = document.getElementById('electoralStatus');
    if (t4El) t4El.value = age >= 0 ? t4Value : '';
    if (elecEl) elecEl.value = age >= 0 ? electoralValue : '';
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

  _getColorClasificacion(clasif) {
    const map = { 'adulto_mayor': 'badge-danger', 'niño': 'badge-warning', 'adulto': 'badge-primary' };
    return map[clasif] || 'badge-secondary';
  }

  _formatClasificacion(clasif) {
    const map = { 'adulto_mayor': 'Adulto Mayor', 'niño': 'Niño/a', 'adulto': 'Adulto' };
    return map[clasif] || clasif;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.censoCtrl = new CensoController();
});
document.addEventListener('spa-navigated', () => {
  if (window.location.pathname.includes('censo.html')) {
    window.censoCtrl = new CensoController();
  }
});

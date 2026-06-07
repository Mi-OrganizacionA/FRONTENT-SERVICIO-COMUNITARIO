/**
 * Modulo de Censo Comunitario (SICAG v5.0)
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

    const formElement = document.getElementById('formCenso');
    if (formElement) {
      formElement.addEventListener('validSubmit', (e) => this.guardarHabitante(e.detail));
    }

    // Ya no sobrescribimos abrirModalCenso porque censo.html tiene la logica correcta con stepper
  }

  async cargarDatos() {
    try {
      const data = await window.api.getHabitantes();
      this.habitantes = data.map(h => {
         let age = 0;
         if (h.fecha_nacimiento) {
            const today = new Date();
            const fnac = new Date(h.fecha_nacimiento);
            age = today.getFullYear() - fnac.getFullYear();
            if (today.getMonth() < fnac.getMonth() || (today.getMonth() === fnac.getMonth() && today.getDate() < fnac.getDate())) age--;
         }
         return {
            id: h.id_habitante,
            nombre: h.nombres,
            apellido: h.apellidos,
            cedula: h.cedula,
            edad: age,
            genero: h.genero,
            consejoComunal: h.consejo ? h.consejo.nombre_comunidad : 'No asignado',
            telefono: h.telefono,
            clasificacion: age >= 60 ? 'adulto_mayor' : age <= 11 ? 'niño' : 'adulto',
            elector: age >= 18
         };
      });

      this.actualizarKpis();
      this.renderTabla();
    } catch (error) {
      console.error('Error cargando habitantes:', error);
      const tbody = document.getElementById('censoBody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#C62828;">Error cargando datos del censo.</td></tr>`;
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
     
     // Para "Consejos Comunales" dejaremos en 9 fijo de momento si es la comuna.
     const elCC = document.getElementById('kpiConsejos');
     if (elCC) elCC.textContent = 9;
  }

  renderTabla() {
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
            <button class="btn-action view" title="Ver Expediente"><i class="fas fa-file-alt"></i></button>
            <button class="btn-action edit" title="Editar" onclick="abrirModalCenso(${h.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete" title="Eliminar" onclick="confirmarEliminarHab(${h.id})"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
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

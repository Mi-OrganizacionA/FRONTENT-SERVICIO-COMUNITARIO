var STORAGE_KEY = 'sicag_censo_viviendas_t2';

var personasSimuladas = [
  { cedula: 'V-12.345.678', nombre: 'María Pérez' },
  { cedula: 'V-24.876.543', nombre: 'José Ramírez' },
  { cedula: 'V-30.123.987', nombre: 'Ana Díaz' },
  { cedula: 'V-14.987.321', nombre: 'Carlos Fernández' },
  { cedula: 'V-15.222.111', nombre: 'Laura Martínez' }
];

var viviendas = [];
var nextId = 1;
var editingId = null;
var tableBody;
var kpiTotal;
var kpiRiesgo;
var kpiSinGas;
var toastContainer;
var formVivienda;
var modalVivienda;
var cedulaJefe;
var gasDomestico;
var cantidadCilindrosGas;
var rowCilindrosGas;
var collapseOneInst;
var collapseTwoInst;
var collapseThreeInst;

async function loadViviendas() {
  try {
    viviendas = await window.api.getViviendas();
  } catch (error) {
    console.error('Error al cargar viviendas:', error);
    viviendas = [];
  }
}

function persistData() {
  // Ya no es necesario con el backend
}

function createBadge(condicion) {
  if (condicion === 'Buena') return '<span class="badge bg-success">Buena</span>';
  if (condicion === 'Alto Riesgo') return '<span class="badge bg-danger">Alto Riesgo</span>';
  return '<span class="badge badge-regular">' + condicion + '</span>';
}

function createGasBadge(valor) {
  if (valor === 'Bombona' || valor === 'Tubería') return '<span class="badge bg-success">' + valor + '</span>';
  return '<span class="badge badge-regular">' + valor + '</span>';
}

function renderKPIs() {
  const total = viviendas.length;
  const riesgo = viviendas.filter(v => v.condicion_general === 'Alto Riesgo').length;
  const sinGas = viviendas.filter(v => v.gas_domestico === 'No posee').length;
  kpiTotal.textContent = total;
  kpiRiesgo.textContent = riesgo;
  kpiSinGas.textContent = sinGas;
}

function renderTable() {
  tableBody.innerHTML = viviendas.map((v, index) => {
    return `
      <tr>
        <td>${v.cedula_jefe_familia}</td>
        <td>${v.sector_comunidad}</td>
        <td>${v.cantidad_habitantes}</td>
        <td>${createBadge(v.condicion_general)}</td>
        <td>${createGasBadge(v.gas_domestico)}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="editarVivienda(${v.id})"><i class="fas fa-edit"></i> Editar</button>
          <button type="button" class="btn btn-sm btn-outline-danger me-2" onclick="eliminarVivienda(${v.id})"><i class="fas fa-trash-alt"></i> Eliminar</button>
          <button type="button" class="btn btn-sm btn-outline-secondary" onclick="window.api.exportarPdfVivienda(${v.id})" title="Imprimir Planilla de Censo"><i class="fas fa-file-pdf"></i> Planilla</button>
        </td>
      </tr>`;
  }).join('');
}

function showToast(message, type = 'success') {
  const toastId = `toast-${Date.now()}`;
  const toastMarkup = `
    <div id="${toastId}" class="toast align-items-center text-white ${type === 'danger' ? 'bg-danger' : 'bg-success'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
    </div>`;
  toastContainer.insertAdjacentHTML('beforeend', toastMarkup);
  const toastEl = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function validarCedula() {
  const cedula = cedulaJefe.value.trim();
  if (!cedula) {
    showToast('Ingrese una cédula antes de validar.', 'danger');
    return;
  }

  const persona = personasSimuladas.find(p => p.cedula.toUpperCase() === cedula.toUpperCase());
  if (!persona) {
    showToast('No se encontró el Jefe de Familia en el sistema.', 'danger');
    return;
  }

  const registroExistente = viviendas.find(v => v.cedula_jefe_familia.toUpperCase() === cedula.toUpperCase());
  if (registroExistente && registroExistente.id !== editingId) {
    showToast('Error: Este Jefe de Familia ya posee una vivienda en el sistema.', 'danger');
    return;
  }

  showToast(`Cédula válida: ${persona.nombre}`, 'success');
}

function toggleCilindrosGas() {
  const tieneBombona = gasDomestico.value === 'Bombona';
  cantidadCilindrosGas.disabled = !tieneBombona;
  if (!tieneBombona) {
    cantidadCilindrosGas.value = '';
  }
  rowCilindrosGas.style.display = tieneBombona ? 'block' : 'none';
}

function abrirSeccion(id) {
  const secciones = [collapseOneInst, collapseTwoInst, collapseThreeInst];
  secciones.forEach(inst => {
    if (!inst) return;
    if (inst._element.id === id) {
      inst.show();
    } else {
      inst.hide();
    }
  });
}

function resetForm() {
  editingId = null;
  formVivienda.reset();
  cedulaJefe.removeAttribute('disabled');
  toggleCilindrosGas();
  abrirSeccion('collapseOne');
}

function abrirModalEdicion(id) {
  const vivienda = viviendas.find(item => item.id === id);
  if (!vivienda) return;
  editingId = id;
  cedulaJefe.value = vivienda.cedula_jefe_familia;
  document.getElementById('sectorComunidad').value = vivienda.sector_comunidad;
  document.getElementById('direccionExacta').value = vivienda.direccion_exacta;
  document.getElementById('cantidadHabitantes').value = vivienda.cantidad_habitantes;
  document.getElementById('condicionGeneral').value = vivienda.condicion_general;
  document.getElementById('tipoVivienda').value = vivienda.tipo_vivienda;
  document.getElementById('tenencia').value = vivienda.tenencia;
  document.getElementById('condicionesTerreno').value = vivienda.condiciones_terreno;
  document.getElementById('materialParedes').value = vivienda.material_paredes;
  document.getElementById('materialTecho').value = vivienda.material_techo;
  document.getElementById('aguasBlancas').value = vivienda.aguas_blancas;
  document.getElementById('aguasServidas').value = vivienda.aguas_servidas;
  gasDomestico.value = vivienda.gas_domestico;
  toggleCilindrosGas();
  cantidadCilindrosGas.value = vivienda.cantidad_cilindros_gas || '';
  document.getElementById('sistemaElectrico').value = vivienda.sistema_electrico;
  document.getElementById('recoleccionBasura').value = vivienda.recoleccion_basura;
  cedulaJefe.setAttribute('disabled', 'disabled');
  modalVivienda.show();
}

function editarVivienda(id) {
  abrirModalEdicion(id);
}

async function eliminarVivienda(id) {
  if (!confirm('¿Seguro que desea eliminar esta vivienda del censo?')) return;
  try {
    await window.api.eliminarVivienda(id);
    viviendas = viviendas.filter(item => item.id !== id);
    renderTable();
    renderKPIs();
    showToast('Vivienda eliminada correctamente.', 'success');
  } catch(e) {
    showToast('Error al eliminar la vivienda.', 'danger');
  }
}

function validarFormulario() {
  const cedula = cedulaJefe.value.trim();
  const sectorComunidad = document.getElementById('sectorComunidad').value;
  const direccionExacta = document.getElementById('direccionExacta').value.trim();
  const cantidadHabitantes = Number(document.getElementById('cantidadHabitantes').value);
  const condicionGeneral = document.getElementById('condicionGeneral').value;
  const tipoVivienda = document.getElementById('tipoVivienda').value;
  const tenencia = document.getElementById('tenencia').value;
  const condicionesTerreno = document.getElementById('condicionesTerreno').value;
  const materialParedes = document.getElementById('materialParedes').value;
  const materialTecho = document.getElementById('materialTecho').value;
  const aguasBlancas = document.getElementById('aguasBlancas').value;
  const aguasServidas = document.getElementById('aguasServidas').value;
  const gas = gasDomestico.value;
  const cantidadCilindros = Number(cantidadCilindrosGas.value || 0);
  const sistemaElectrico = document.getElementById('sistemaElectrico').value;
  const recoleccionBasura = document.getElementById('recoleccionBasura').value;

  if (!cedula || !sectorComunidad || !direccionExacta || !cantidadHabitantes || !condicionGeneral || !tipoVivienda || !tenencia || !condicionesTerreno || !materialParedes || !materialTecho || !aguasBlancas || !aguasServidas || !gas || !sistemaElectrico || !recoleccionBasura) {
    showToast('Complete todos los campos obligatorios del formulario.', 'danger');
    return null;
  }

  if (gas === 'Bombona' && cantidadCilindros < 1) {
    showToast('Indique la cantidad de cilindros de gas cuando se seleccione Bombona.', 'danger');
    return null;
  }

  const duplicado = viviendas.some(item => item.cedula_jefe_familia.toUpperCase() === cedula.toUpperCase() && item.id !== editingId);
  if (duplicado) {
    showToast('Error: Este Jefe de Familia ya posee una vivienda en el sistema.', 'danger');
    return null;
  }

  return {
    cedula_jefe_familia: cedula,
    sector_comunidad: sectorComunidad,
    direccion_exacta: direccionExacta,
    cantidad_habitantes: cantidadHabitantes,
    condicion_general: condicionGeneral,
    tipo_vivienda: tipoVivienda,
    tenencia,
    condiciones_terreno: condicionesTerreno,
    material_paredes: materialParedes,
    material_techo: materialTecho,
    aguas_blancas: aguasBlancas,
    aguas_servidas: aguasServidas,
    gas_domestico: gas,
    cantidad_cilindros_gas: gas === 'Bombona' ? cantidadCilindros : 0,
    sistema_electrico: sistemaElectrico,
    recoleccion_basura: recoleccionBasura
  };
}

async function guardarVivienda(event) {
  event.preventDefault();
  const registro = validarFormulario();
  if (!registro) return;

  try {
    if (editingId) {
      await window.api.actualizarVivienda(editingId, registro);
      showToast('Registro actualizado correctamente.', 'success');
    } else {
      await window.api.crearVivienda(registro);
      showToast('Vivienda registrada correctamente.', 'success');
    }
    await loadViviendas();
    renderTable();
    renderKPIs();
    modalVivienda.hide();
    resetForm();
  } catch(e) {
    showToast('Error al guardar la vivienda.', 'danger');
  }
}

async function initPage() {
  if (!document.getElementById('collapseOne')) {
    window.editarVivienda = function(id) {
      const btn = document.getElementById('btnNuevaVivienda');
      if (btn) btn.click();
      if (typeof goToStep === 'function') goToStep(1);
    };
    window.eliminarVivienda = eliminarVivienda;
    return;
  }

  tableBody = document.querySelector('#tablaViviendas tbody');
  kpiTotal = document.getElementById('kpi-total');
  kpiRiesgo = document.getElementById('kpi-riesgo');
  kpiSinGas = document.getElementById('kpi-sin-gas');
  toastContainer = document.querySelector('.toast-container');
  formVivienda = document.getElementById('formVivienda');
  modalVivienda = new bootstrap.Modal(document.getElementById('modalVivienda'));
  cedulaJefe = document.getElementById('cedulaJefe');
  gasDomestico = document.getElementById('gasDomestico');
  cantidadCilindrosGas = document.getElementById('cantidadCilindrosGas');
  rowCilindrosGas = document.getElementById('rowCilindrosGas');

  collapseOneInst = new bootstrap.Collapse(document.getElementById('collapseOne'), { toggle: false });
  collapseTwoInst = new bootstrap.Collapse(document.getElementById('collapseTwo'), { toggle: false });
  collapseThreeInst = new bootstrap.Collapse(document.getElementById('collapseThree'), { toggle: false });

  await loadViviendas();
  renderTable();
  renderKPIs();
  toggleCilindrosGas();
  abrirSeccion('collapseOne');

  document.getElementById('btnValidarCedula').addEventListener('click', validarCedula);
  document.getElementById('btnNextA').addEventListener('click', () => abrirSeccion('collapseTwo'));
  document.getElementById('btnPrevB').addEventListener('click', () => abrirSeccion('collapseOne'));
  document.getElementById('btnNextB').addEventListener('click', () => abrirSeccion('collapseThree'));
  document.getElementById('btnPrevC').addEventListener('click', () => abrirSeccion('collapseTwo'));
  gasDomestico.addEventListener('change', toggleCilindrosGas);
  formVivienda.addEventListener('submit', guardarVivienda);
  document.getElementById('modalVivienda').addEventListener('hidden.bs.modal', resetForm);

  window.editarVivienda = editarVivienda;
  window.eliminarVivienda = eliminarVivienda;
}

window.addEventListener('DOMContentLoaded', initPage);

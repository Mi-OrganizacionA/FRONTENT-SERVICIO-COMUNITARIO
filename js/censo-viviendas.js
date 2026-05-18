const STORAGE_KEY = 'sicag_censo_viviendas_t2';

const personasSimuladas = [
  { cedula: 'V-12.345.678', nombre: 'María Pérez' },
  { cedula: 'V-24.876.543', nombre: 'José Ramírez' },
  { cedula: 'V-30.123.987', nombre: 'Ana Díaz' },
  { cedula: 'V-14.987.321', nombre: 'Carlos Fernández' },
  { cedula: 'V-15.222.111', nombre: 'Laura Martínez' }
];

let viviendas = [];
let nextId = 1;
let editingId = null;
let tableBody;
let kpiTotal;
let kpiRiesgo;
let kpiSinGas;
let toastContainer;
let formVivienda;
let modalVivienda;
let cedulaJefe;
let gasDomestico;
let cantidadCilindrosGas;
let rowCilindrosGas;
let collapseOneInst;
let collapseTwoInst;
let collapseThreeInst;

function loadViviendas() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        viviendas = parsed;
        nextId = viviendas.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        return;
      }
    } catch (error) {
      console.warn('No se pudo cargar datos previos:', error);
    }
  }

  viviendas = [
    {
      id: 1,
      cedula_jefe_familia: 'V-12.345.678',
      sector_comunidad: 'Jobito I',
      direccion_exacta: 'Sector La Esperanza, Calle 5',
      cantidad_habitantes: 5,
      condicion_general: 'Buena',
      tipo_vivienda: 'Casa',
      tenencia: 'Propia',
      condiciones_terreno: 'Estable',
      material_paredes: 'Frisadas',
      material_techo: 'Zinc',
      aguas_blancas: 'Acueducto',
      aguas_servidas: 'Cloacas',
      gas_domestico: 'Tubería',
      cantidad_cilindros_gas: 0,
      sistema_electrico: 'Pública',
      recoleccion_basura: 'Aseo urbano'
    },
    {
      id: 2,
      cedula_jefe_familia: 'V-24.876.543',
      sector_comunidad: 'Brisas del Yurubí',
      direccion_exacta: 'Barrio San José, Casa 12',
      cantidad_habitantes: 6,
      condicion_general: 'Regular',
      tipo_vivienda: 'Rancho',
      tenencia: 'Alquilada',
      condiciones_terreno: 'Inestable',
      material_paredes: 'Tablas',
      material_techo: 'Teja',
      aguas_blancas: 'Pila pública',
      aguas_servidas: 'Pozo séptico',
      gas_domestico: 'Bombona',
      cantidad_cilindros_gas: 2,
      sistema_electrico: 'Planta eléctrica',
      recoleccion_basura: 'Contenedor'
    },
    {
      id: 3,
      cedula_jefe_familia: 'V-30.123.987',
      sector_comunidad: 'Cacique Tamanaco',
      direccion_exacta: 'Urbanización El Valle, Manzana 4',
      cantidad_habitantes: 8,
      condicion_general: 'Alto Riesgo',
      tipo_vivienda: 'Barraca',
      tenencia: 'Invadida',
      condiciones_terreno: 'Alto Riesgo',
      material_paredes: 'Bahareque/Adobe',
      material_techo: 'Asbesto',
      aguas_blancas: 'No tiene',
      aguas_servidas: 'Letrinas',
      gas_domestico: 'No posee',
      cantidad_cilindros_gas: 0,
      sistema_electrico: 'No tiene',
      recoleccion_basura: 'Al aire libre'
    }
  ];
  nextId = viviendas.length + 1;
  persistData();
}

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(viviendas));
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
        <th scope="row">${index + 1}</th>
        <td>${v.cedula_jefe_familia}</td>
        <td>${v.sector_comunidad}</td>
        <td>${v.cantidad_habitantes}</td>
        <td>${createBadge(v.condicion_general)}</td>
        <td>${createGasBadge(v.gas_domestico)}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="editarVivienda(${v.id})"><i class="fas fa-edit"></i> Editar</button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarVivienda(${v.id})"><i class="fas fa-trash-alt"></i> Eliminar</button>
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

function eliminarVivienda(id) {
  if (!confirm('¿Seguro que desea eliminar esta vivienda del censo?')) return;
  viviendas = viviendas.filter(item => item.id !== id);
  persistData();
  renderTable();
  renderKPIs();
  showToast('Vivienda eliminada correctamente.', 'success');
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

function guardarVivienda(event) {
  event.preventDefault();
  const registro = validarFormulario();
  if (!registro) return;

  if (editingId) {
    viviendas = viviendas.map(item => item.id === editingId ? { ...item, ...registro } : item);
    showToast('Registro actualizado correctamente.', 'success');
  } else {
    viviendas.push({ id: nextId++, ...registro });
    showToast('Vivienda registrada correctamente.', 'success');
  }

  persistData();
  renderTable();
  renderKPIs();
  modalVivienda.hide();
  resetForm();
}

function initPage() {
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

  loadViviendas();
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

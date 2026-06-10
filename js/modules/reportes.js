/**
 * Módulo de Reportes - SICAG v2.5
 * Archivo: js/modules/reportes.js
 */

class ReportesController {
  constructor() {
    this.init();
  }

  async init() {
    try {
      this._setupUI();
      // Cargar KPIs dinámicos, gráficos y la tabla resumen
      this.cargarKPIs();
      this.cargarResumen();
    } catch (error) {
      console.error('Error inicializando Reportes:', error);
      if (window.Components) Components.showToast('Error al cargar módulo de reportes', 'error');
    }
  }

  _setupUI() {
    // Configurar botones de descarga reales
    document.querySelectorAll('.dl-btn').forEach(btn => {
      btn.addEventListener('click', () => this.ejecutarDescarga(btn));
    });
    
    const btnExportExcel = document.getElementById('btnExportExcel');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', () => {
        this.iniciarExportacion('total-personas', 'excel', btnExportExcel);
      });
    }

    const btnExportPDF = document.getElementById('btnExportPDF');
    if (btnExportPDF) {
      btnExportPDF.addEventListener('click', () => {
        this.iniciarExportacion('total-personas', 'pdf', btnExportPDF);
      });
    }

    const btnExportTabla = document.getElementById('btnExportTabla');
    if (btnExportTabla) {
      btnExportTabla.addEventListener('click', () => {
        this.iniciarExportacion('resumen-consejos', 'excel', btnExportTabla);
      });
    }

    // Lógica del Modal de Filtros Avanzados
    const btnOpenFilters = document.getElementById('btnOpenFilters');
    const btnCloseFilters = document.getElementById('btnCloseFilters');
    const modalFiltros = document.getElementById('modalFiltrosAvanzados');
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

    if (btnOpenFilters && modalFiltros) {
      btnOpenFilters.addEventListener('click', () => modalFiltros.style.display = 'flex');
    }
    if (btnCloseFilters && modalFiltros) {
      btnCloseFilters.addEventListener('click', () => modalFiltros.style.display = 'none');
    }

    // Pre-cargar fecha mínima del sistema para "Fecha Desde"
    const filtroDesde = document.getElementById('filtroDesde');
    const filtroHasta = document.getElementById('filtroHasta');
    if (filtroDesde && filtroHasta) {
      const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
      fetch(`${baseUrl}/censo-reportes/fecha-minima`)
        .then(res => res.json())
        .then(data => {
          if (data.fecha_minima) filtroDesde.value = data.fecha_minima;
        })
        .catch(err => console.error('Error cargando fecha minima:', err));
      
      const hoy = new Date().toISOString().split('T')[0];
      filtroHasta.value = hoy;
    }

    // Lógica del Toggle de Fecha Nacimiento vs Edad
    const chkNac = document.getElementById('chkNacimiento');
    const fnacMin = document.getElementById('filtroNacMin');
    const fnacMax = document.getElementById('filtroNacMax');
    const edMin = document.getElementById('filtroEdadMin');
    const edMax = document.getElementById('filtroEdadMax');
    const lblNacMin = document.getElementById('lblNacMin');
    const lblNacMax = document.getElementById('lblNacMax');

    if (chkNac) {
      chkNac.addEventListener('change', (e) => {
        const isNac = e.target.checked;
        if (isNac) {
          // Activa Nacimiento, Desactiva Edades
          fnacMin.disabled = false; fnacMin.style.background = '#fff'; fnacMin.style.cursor = 'text';
          fnacMax.disabled = false; fnacMax.style.background = '#fff'; fnacMax.style.cursor = 'text';
          lblNacMin.style.color = '#111'; lblNacMax.style.color = '#111';
          
          edMin.disabled = true; edMin.style.background = '#f3f4f6'; edMin.style.cursor = 'not-allowed'; edMin.value = '';
          edMax.disabled = true; edMax.style.background = '#f3f4f6'; edMax.style.cursor = 'not-allowed'; edMax.value = '';
        } else {
          // Activa Edades, Desactiva Nacimiento
          fnacMin.disabled = true; fnacMin.style.background = '#f3f4f6'; fnacMin.style.cursor = 'not-allowed'; fnacMin.value = '';
          fnacMax.disabled = true; fnacMax.style.background = '#f3f4f6'; fnacMax.style.cursor = 'not-allowed'; fnacMax.value = '';
          lblNacMin.style.color = '#888'; lblNacMax.style.color = '#888';
          
          edMin.disabled = false; edMin.style.background = '#fff'; edMin.style.cursor = 'text';
          edMax.disabled = false; edMax.style.background = '#fff'; edMax.style.cursor = 'text';
        }
      });
    }

    // Limpiar Filtros
    if (btnLimpiarFiltros) {
      btnLimpiarFiltros.addEventListener('click', () => {
        ['filtroEdadMin', 'filtroEdadMax', 'filtroNacMin', 'filtroNacMax', 'filtroConsejo', 'filtroGenero', 'filtroSalud', 'filtroCne', 'filtroTrabajo'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        document.querySelectorAll('.chk-extra').forEach(el => el.checked = false);
        if (chkNac) { chkNac.checked = false; chkNac.dispatchEvent(new Event('change')); }
      });
    }

    // Exportar desde Modal
    const btnCustomExcel = document.getElementById('btnCustomExcel');
    const btnCustomPDF = document.getElementById('btnCustomPDF');
    const customSelect = document.getElementById('customReportType');
    
    if (btnCustomExcel && customSelect) {
      btnCustomExcel.addEventListener('click', () => {
        if (!customSelect.value) return Components.showToast('Selecciona un tipo de reporte', 'warning');
        this.iniciarExportacion(customSelect.value, 'excel', btnCustomExcel);
        if (modalFiltros) modalFiltros.style.display = 'none';
      });
    }

    if (btnCustomPDF && customSelect) {
      btnCustomPDF.addEventListener('click', () => {
        if (!customSelect.value) return Components.showToast('Selecciona un tipo de reporte', 'warning');
        this.iniciarExportacion(customSelect.value, 'pdf', btnCustomPDF);
        if (modalFiltros) modalFiltros.style.display = 'none';
      });
    }
  }

  getFiltrosUrl() {
    const desde = document.getElementById('filtroDesde')?.value;
    const hasta = document.getElementById('filtroHasta')?.value;
    const consejo_id = document.getElementById('filtroConsejo')?.value;
    const edad_min = document.getElementById('filtroEdadMin')?.value;
    const edad_max = document.getElementById('filtroEdadMax')?.value;
    const nac_min = document.getElementById('filtroNacMin')?.value;
    const nac_max = document.getElementById('filtroNacMax')?.value;
    const genero = document.getElementById('filtroGenero')?.value;
    const salud = document.getElementById('filtroSalud')?.value;
    const cne = document.getElementById('filtroCne')?.value;
    const trabajo = document.getElementById('filtroTrabajo')?.value;
    
    // Obtener extras
    const extras = Array.from(document.querySelectorAll('.chk-extra:checked')).map(el => el.value).join(',');

    let params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (consejo_id) params.append('consejo_id', consejo_id);
    
    const chkNac = document.getElementById('chkNacimiento');
    if (chkNac && chkNac.checked) {
      if (nac_min) params.append('nac_min', nac_min);
      if (nac_max) params.append('nac_max', nac_max);
    } else {
      if (edad_min) params.append('edad_min', edad_min);
      if (edad_max) params.append('edad_max', edad_max);
    }

    if (genero) params.append('genero', genero);
    if (salud) params.append('salud', salud);
    if (cne) params.append('cne', cne);
    if (trabajo) params.append('trabajo', trabajo);
    if (extras) params.append('extras', extras);

    return params.toString();
  }

  async cargarKPIs() {
    try {
      const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
      
      // La instrucción del usuario es que los KPIs generales y las gráficas visuales NO se filtren,
      // siempre deben mostrar el padrón completo sin importar lo que haya en el Modal.
      const res = await fetch(`${baseUrl}/censo-reportes/kpis`);
      if (!res.ok) throw new Error('Error al cargar KPIs');
      const kpis = await res.json();
      
      // Actualizar el DOM - Valores Principales
      const elPersonas = document.getElementById('kpi-total-personas');
      const elDiscapacidad = document.getElementById('kpi-discapacidad');
      const elViviendas = document.getElementById('kpi-viviendas');
      const elAdultos = document.getElementById('kpi-adultos-mayores');

      if(elPersonas) elPersonas.textContent = kpis.totalPersonas;
      if(elDiscapacidad) elDiscapacidad.textContent = kpis.conDiscapacidad;
      if(elViviendas) elViviendas.textContent = kpis.totalViviendas;
      if(elAdultos) elAdultos.textContent = kpis.adultosMayores;

      // Actualizar Tendencias y Porcentajes
      const trPersonas = document.getElementById('kpi-trend-personas');
      if (trPersonas) {
        trPersonas.className = 'kpi-trend up';
        trPersonas.innerHTML = `<i class="fas fa-chart-line"></i> Total empadronado`;
      }

      const trDiscapacidad = document.getElementById('kpi-trend-discapacidad');
      if (trDiscapacidad && kpis.totalPersonas > 0) {
        trDiscapacidad.className = 'kpi-trend up';
        trDiscapacidad.innerHTML = `<i class="fas fa-circle" style="font-size:.5rem;"></i> ${((kpis.conDiscapacidad / kpis.totalPersonas) * 100).toFixed(1)}% del censo`;
      }

      const trViviendas = document.getElementById('kpi-trend-viviendas');
      if (trViviendas) {
        trViviendas.className = 'kpi-trend up';
        // Simulado: leer cuántos consejos filtró
        const ddlConsejo = document.getElementById('filtroConsejo');
        trViviendas.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${ddlConsejo && ddlConsejo.value ? 'En ' + ddlConsejo.options[ddlConsejo.selectedIndex].text : 'Comunidad general'}`;
      }

      const trAdultos = document.getElementById('kpi-trend-adultos');
      if (trAdultos && kpis.totalPersonas > 0) {
        trAdultos.className = 'kpi-trend up';
        trAdultos.innerHTML = `<i class="fas fa-circle" style="font-size:.5rem;"></i> ${((kpis.adultosMayores / kpis.totalPersonas) * 100).toFixed(1)}% del censo`;
      }

      // Actualizar gráficos
      this.renderGraficos(kpis);

    } catch (error) {
      console.warn('Backend API de KPIs no disponible, mostrando guiones.', error);
    }
  }

  async cargarResumen() {
    try {
      const tbody = document.getElementById('resumen-tbody');
      if (!tbody) return;

      const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
      // La tabla inferior también debe mostrar SIEMPRE el resumen completo, ignorando los filtros del modal.
      const res = await fetch(`${baseUrl}/censo-reportes/resumen`);
      if (!res.ok) throw new Error('Error al cargar resumen');
      
      const datos = await res.json();
      tbody.innerHTML = ''; // Limpiar filas

      if (!datos || datos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay datos disponibles.</td></tr>`;
        return;
      }

      datos.forEach(item => {
        const isTotal = item.consejo === 'TOTAL';
        const tr = document.createElement('tr');
        if (isTotal) {
          tr.style.background = 'rgba(46,125,50,.08)';
          tr.style.fontWeight = '700';
        }
        
        tr.innerHTML = `
          <td>${isTotal ? 'TOTAL' : `<strong>${item.consejo}</strong>`}</td>
          <td>${item.total_hab}</td>
          <td>${item.electores}</td>
          <td>${item.ninos}</td>
          <td>${item.mayores}</td>
          <td>${item.disc}</td>
          <td>${item.viviendas}</td>
        `;
        tbody.appendChild(tr);
      });

    } catch (error) {
      console.error('Error cargando tabla de resumen:', error);
      const tbody = document.getElementById('resumen-tbody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">Error al cargar datos.</td></tr>`;
    }
  }

  ejecutarDescarga(btn) {
    if (!btn) return;
    const tipo = btn.getAttribute('data-report');
    const formato = btn.getAttribute('data-format');
    
    if (!tipo || !formato) return;
    this.iniciarExportacion(tipo, formato, btn);
  }

  iniciarExportacion(tipo, formato, btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    btn.disabled = true;

    // Obtener filtros
    const urlParams = this.getFiltrosUrl();
    const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
    
    // El navegador manejará la descarga del archivo automáticamente al usar window.open
    const downloadUrl = `${baseUrl}/censo-reportes/exportar?tipo=${tipo}&format=${formato}&${urlParams}`;
    
    window.open(downloadUrl, '_blank');

    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
      if (window.Components) Components.showToast('Archivo generado. Verifica tus descargas.', 'success');
      setTimeout(() => { 
        btn.innerHTML = orig; 
        btn.disabled = false; 
      }, 2000);
    }, 1500); // Simulamos el retraso visual mientras se inicia la descarga
  }

  renderGraficos(kpis) {
    if (typeof Chart === 'undefined') return;

    const ctxClasif = document.getElementById('chartClasif');
    if (ctxClasif) {
      // Destruir gráfico previo si existe
      if (window.chartClasifInstance) window.chartClasifInstance.destroy();

      // Preparar datos reales: Adultos Mayores, Niños. El resto lo ponemos como "Adultos/Otros"
      let ninos = kpis ? kpis.ninos : 62;
      let adultosMayores = kpis ? kpis.adultosMayores : 39;
      let discapacidad = kpis ? kpis.conDiscapacidad : 12;
      let total = kpis ? kpis.totalPersonas : 347;
      let resto = total - (ninos + adultosMayores + discapacidad);
      if (resto < 0) resto = 0;

      window.chartClasifInstance = new Chart(ctxClasif.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Adultos', 'Niños (0-17)', 'Adultos Mayores (60+)', 'Con Discapacidad'],
          datasets: [{ data: [resto, ninos, adultosMayores, discapacidad],
            backgroundColor: ['#2E7D32','#F9A825','#C62828','#1565C0'],
            borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '50%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 10, font: { family: 'Poppins', size: 10 }, usePointStyle: true, pointStyleWidth: 8 } },
            tooltip: { backgroundColor: '#1A2E1A', padding: 12, cornerRadius: 8,
              callbacks: { label: ctx => { const t = ctx.dataset.data.reduce((a,b)=>a+b,0); return ` ${ctx.label}: ${ctx.raw} (${((ctx.raw/t)*100).toFixed(1)}%)`; } } }
          }
        }
      });
    }

    const ctxCC = document.getElementById('chartCC');
    if (ctxCC) {
      if (window.chartCCInstance) window.chartCCInstance.destroy();
      // Como no trajimos el conteo por consejo desde el endpoint principal,
      // usaremos el total actual como una sola barra representativa si hay filtros
      // o datos dummy si no hay nada
      let val = kpis ? kpis.totalPersonas : 52;
      
      const ddlConsejo = document.getElementById('filtroConsejo');
      let lbl = (ddlConsejo && ddlConsejo.value) ? ddlConsejo.options[ddlConsejo.selectedIndex].text : 'Toda la Comunidad';

      window.chartCCInstance = new Chart(ctxCC.getContext('2d'), {
        type: 'bar',
        data: {
          labels: [lbl],
          datasets: [{
            label: 'Habitantes',
            data: [val],
            backgroundColor: 'rgba(46,125,50,.8)',
            borderColor: '#2E7D32',
            borderWidth: 2, borderRadius: 6, borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1A2E1A', padding: 12, cornerRadius: 8 } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { callback: v => v+' hab.' } },
            x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0 } }
          }
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.reportesCtrl = new ReportesController();
});
document.addEventListener('spa-navigated', () => {
  if (window.location.pathname.includes('reportes.html')) {
    window.reportesCtrl = new ReportesController();
  }
});

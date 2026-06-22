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
        this.iniciarExportacion('total-personas', 'excel', btnExportExcel, this.getFiltrosPersonasUrl());
      });
    }

    const btnExportPDF = document.getElementById('btnExportPDF');
    if (btnExportPDF) {
      btnExportPDF.addEventListener('click', () => {
        this.iniciarExportacion('total-personas', 'pdf', btnExportPDF, this.getFiltrosPersonasUrl());
      });
    }

    const btnExportTabla = document.getElementById('btnExportTabla');
    if (btnExportTabla) {
      btnExportTabla.addEventListener('click', () => {
        this.iniciarExportacion('resumen-consejos', 'excel', btnExportTabla);
      });
    }

    // Lógica de Modales de Filtros Avanzados
    const btnOpenFiltersPersonas = document.getElementById('btnOpenFiltersPersonas');
    const btnCloseFiltersPersonas = document.getElementById('btnCloseFilters');
    const modalFiltrosPersonas = document.getElementById('modalFiltrosPersonas');
    
    const btnOpenFiltersVivienda = document.getElementById('btnOpenFiltersVivienda');
    const btnCloseFiltersVivienda = document.getElementById('btnCloseFiltersVivienda');
    const modalFiltrosVivienda = document.getElementById('modalFiltrosVivienda');

    // Deshabilitar filtro de consejo si es vocero
    const user = window.auth ? window.auth.getUser() : null;
    const isVocero = user && user.rol && user.rol.toLowerCase() === 'vocero';
    
    if (isVocero) {
      const filtroCC = document.getElementById('filtroConsejo');
      const filtroVCC = document.getElementById('filtroV_Consejo');
      if (filtroCC) {
        filtroCC.value = user.id_comunidad_asignada || '';
        filtroCC.disabled = true; // Solo deshabilitar, no ocultar
      }
      if (filtroVCC) {
        filtroVCC.value = user.id_comunidad_asignada || '';
        filtroVCC.disabled = true;
      }
      const subtitulo = document.getElementById('reportes-subtitulo');
      if (subtitulo) subtitulo.textContent = `Reportes de: ${user.nombre_comunidad || 'Tu Comunidad'}`;
    }

    // Modal Personas
    if (btnOpenFiltersPersonas && modalFiltrosPersonas) {
      btnOpenFiltersPersonas.addEventListener('click', () => modalFiltrosPersonas.style.display = 'flex');
    }
    if (btnCloseFiltersPersonas && modalFiltrosPersonas) {
      btnCloseFiltersPersonas.addEventListener('click', () => modalFiltrosPersonas.style.display = 'none');
    }

    // Modal Viviendas
    if (btnOpenFiltersVivienda && modalFiltrosVivienda) {
      btnOpenFiltersVivienda.addEventListener('click', () => modalFiltrosVivienda.style.display = 'flex');
    }
    if (btnCloseFiltersVivienda && modalFiltrosVivienda) {
      btnCloseFiltersVivienda.addEventListener('click', () => modalFiltrosVivienda.style.display = 'none');
    }

    // Pre-cargar fecha mínima del sistema para "Fecha Desde"
    const filtroDesde = document.getElementById('filtroDesde');
    const filtroHasta = document.getElementById('filtroHasta');
    if (filtroDesde && filtroHasta) {
      const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
      const headers = window.auth ? { 'Authorization': `Bearer ${window.auth.getToken()}` } : {};
      fetch(`${baseUrl}/censo-reportes/fecha-minima`, { headers })
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

    if (btnCustomExcel) {
      btnCustomExcel.addEventListener('click', () => {
        const type = document.getElementById('customReportType')?.value || 'total-personas';
        this.iniciarExportacion(type, 'excel', btnCustomExcel, this.getFiltrosPersonasUrl());
      });
    }

    if (btnCustomPDF) {
      btnCustomPDF.addEventListener('click', () => {
        const type = document.getElementById('customReportType')?.value || 'total-personas';
        this.iniciarExportacion(type, 'pdf', btnCustomPDF, this.getFiltrosPersonasUrl());
      });
    }

    // Modal de Viviendas - Botones de Exportación
    const btnExportViviendaAvanzadoExcel = document.getElementById('btnExportViviendaAvanzadoExcel');
    const btnExportViviendaAvanzadoPDF = document.getElementById('btnExportViviendaAvanzadoPDF');
    const btnLimpiarFiltrosVivienda = document.getElementById('btnLimpiarFiltrosVivienda');

    if (btnExportViviendaAvanzadoExcel) {
      btnExportViviendaAvanzadoExcel.addEventListener('click', () => {
        this.iniciarExportacion('viviendas_avanzado', 'excel', btnExportViviendaAvanzadoExcel, this.getFiltrosViviendaUrl());
      });
    }

    if (btnExportViviendaAvanzadoPDF) {
      btnExportViviendaAvanzadoPDF.addEventListener('click', () => {
        this.iniciarExportacion('viviendas_avanzado', 'pdf', btnExportViviendaAvanzadoPDF, this.getFiltrosViviendaUrl());
      });
    }

    if (btnLimpiarFiltrosVivienda) {
      btnLimpiarFiltrosVivienda.addEventListener('click', () => {
        document.querySelectorAll('#modalFiltrosVivienda select, #modalFiltrosVivienda input[type="text"]').forEach(el => {
          if (!el.disabled || el.id === 'filtroV_Planilla' || el.id === 'filtroV_Encuestador') {
            el.value = '';
          }
        });
      });
    }
  }

  getFiltrosPersonasUrl() {
    let q = '';
    const desde = document.getElementById('filtroDesde')?.value;
    const hasta = document.getElementById('filtroHasta')?.value;
    const user = window.auth ? window.auth.getUser() : null;
    const isVocero = user && user.rol && user.rol.toLowerCase() === 'vocero';
    const consejo_id = isVocero ? user.id_comunidad_asignada : document.getElementById('filtroConsejo')?.value;

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

  getFiltrosViviendaUrl() {
    let q = '&avanzado=true';
    const user = window.auth ? window.auth.getUser() : null;
    const isVocero = user && user.rol && user.rol.toLowerCase() === 'vocero';
    
    const consejo_id = isVocero ? user.id_comunidad_asignada : document.getElementById('filtroV_Consejo')?.value;
    if (consejo_id) q += `&consejo_id=${encodeURIComponent(consejo_id)}`;

    const incluirIntegrantes = document.getElementById('filtroV_IncluirIntegrantes')?.checked;
    if (incluirIntegrantes) q += `&incluir_integrantes=true`;

    // Identificación
    const planilla = document.getElementById('filtroV_Planilla')?.value;
    if (planilla) q += `&planilla_nro=${encodeURIComponent(planilla)}`;
    const encuestador = document.getElementById('filtroV_Encuestador')?.value;
    if (encuestador) q += `&encuestador_cedula=${encodeURIComponent(encuestador)}`;

    // Familia
    const edadMin = document.getElementById('filtroV_EdadMin')?.value;
    if (edadMin) q += `&edad_min=${encodeURIComponent(edadMin)}`;
    const edadMax = document.getElementById('filtroV_EdadMax')?.value;
    if (edadMax) q += `&edad_max=${encodeURIComponent(edadMax)}`;
    
    const rangoHab = document.getElementById('filtroV_HabitantesRango')?.value;
    if (rangoHab) q += `&rango_habitantes=${encodeURIComponent(rangoHab)}`;
    const menores = document.getElementById('filtroV_TieneMenores12')?.value;
    if (menores) q += `&tiene_menores_12=true`;
    const disc = document.getElementById('filtroV_TieneDiscapacitados')?.value;
    if (disc) q += `&tiene_discapacitados=true`;

    // Vivienda
    const tipo = document.getElementById('filtroV_Tipo')?.value;
    if (tipo) q += `&tipo_vivienda=${encodeURIComponent(tipo)}`;
    const gas = document.getElementById('filtroV_Gas')?.value;
    if (gas) q += `&gas_tipo=${encodeURIComponent(gas)}`;
    const agua = document.getElementById('filtroV_Agua')?.value;
    if (agua) q += `&aguas_blancas_tipo=${encodeURIComponent(agua)}`;
    const salubridad = document.getElementById('filtroV_Salubridad')?.value;
    if (salubridad) q += `&condiciones_salubridad=${encodeURIComponent(salubridad)}`;

    // Salud y Economía
    const ingreso = document.getElementById('filtroV_Ingreso')?.value;
    if (ingreso) q += `&ingreso_familiar_rango=${encodeURIComponent(ingreso)}`;
    const ayudaMed = document.getElementById('filtroV_AyudaMedica')?.value;
    if (ayudaMed) q += `&necesita_ayuda_especial=${encodeURIComponent(ayudaMed)}`;
    const comercio = document.getElementById('filtroV_Comercio')?.value;
    if (comercio) q += `&actividad_comercial_vivienda=${encodeURIComponent(comercio)}`;

    // Opciones Múltiples (Plagas, Animales y Enfermedades)
    const insectosSeleccionados = Array.from(document.querySelectorAll('.chk-insectos:checked')).map(el => el.value);
    if (insectosSeleccionados.length > 0 && insectosSeleccionados.length < 7) {
      // Si todos están marcados, no filtramos por defecto. Solo filtramos si hay alguna desmarcada.
      q += `&insectos=${encodeURIComponent(insectosSeleccionados.join(','))}`;
    }
    
    const animalesSeleccionados = Array.from(document.querySelectorAll('.chk-animales:checked')).map(el => el.value);
    if (animalesSeleccionados.length > 0 && animalesSeleccionados.length < 6) {
      q += `&animales=${encodeURIComponent(animalesSeleccionados.join(','))}`;
    }
    
    const enfermedadesSeleccionadas = Array.from(document.querySelectorAll('.chk-enfermedades:checked')).map(el => el.value);
    if (enfermedadesSeleccionadas.length > 0) {
      q += `&enfermedades=${encodeURIComponent(enfermedadesSeleccionadas.join(','))}`;
    }

    return q;
  }

  async cargarKPIs() {
    try {
      const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
      
      const user = window.auth ? window.auth.getUser() : null;
      const isVocero = user && user.rol && user.rol.toLowerCase() === 'vocero';
      const paramConsejo = isVocero ? `?consejo_id=${user.id_comunidad_asignada}` : '';

      // La instrucción del usuario es que los KPIs generales y las gráficas visuales NO se filtren,
      // siempre deben mostrar el padrón completo sin importar lo que haya en el Modal (a menos que sea vocero).
      const headers = window.auth ? { 'Authorization': `Bearer ${window.auth.getToken()}` } : {};
      const res = await fetch(`${baseUrl}/censo-reportes/kpis${paramConsejo}`, { headers });
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

    } catch (error) {
      console.warn('Backend API de KPIs no disponible, mostrando guiones.', error);
    }
  }

  async cargarResumen() {
    try {
      const tbody = document.getElementById('resumen-tbody');
      if (!tbody) return;

      const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
      const user = window.auth ? window.auth.getUser() : null;
      const isVocero = user && user.rol && user.rol.toLowerCase() === 'vocero';
      const paramConsejo = isVocero ? `?consejo_id=${user.id_comunidad_asignada}` : '';

      // La tabla inferior también debe mostrar SIEMPRE el resumen completo, ignorando los filtros del modal (a menos que sea vocero).
      const headers = window.auth ? { 'Authorization': `Bearer ${window.auth.getToken()}` } : {};
      const res = await fetch(`${baseUrl}/censo-reportes/resumen${paramConsejo}`, { headers });
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
    
    // Si el reporte es de viviendas, usar el filtro de viviendas
    const paramsAdicionales = (tipo === 'viviendas' || tipo === 'viviendas_avanzado') 
      ? this.getFiltrosViviendaUrl() 
      : this.getFiltrosPersonasUrl();
      
    this.iniciarExportacion(tipo, formato, btn, paramsAdicionales);
  }

  iniciarExportacion(tipo, formato, btn, paramsAdicionales = '') {
    const orig = btn.innerHTML;

    if (window.Components && typeof Components.actionDialog === 'function') {
      Components.actionDialog({
        titulo: 'Opciones de Documento',
        mensaje: '¿Deseas abrir el reporte aquí mismo en el navegador o descargarlo directamente a tu equipo?',
        icono: 'fa-file-pdf',
        colorIcono: '#1565C0',
        btnPrimaryText: 'Descargar Archivo',
        btnPrimaryIcon: 'fa-download',
        btnPrimaryColor: '#1565C0',
        btnSecondaryText: 'Solo Ver',
        btnSecondaryIcon: 'fa-eye',
        onPrimary: () => {
          this._ejecutarRequestExportacion(tipo, formato, btn, orig, 'download', paramsAdicionales);
        },
        onSecondary: () => {
          this._ejecutarRequestExportacion(tipo, formato, btn, orig, 'view', paramsAdicionales);
        }
      });
    } else {
      // Fallback si no está cargado el componente
      const accion = confirm('Pulsa Aceptar para VER el reporte, o Cancelar para DESCARGARLO.') ? 'view' : 'download';
      this._ejecutarRequestExportacion(tipo, formato, btn, orig, accion, paramsAdicionales);
    }
  }

  async _ejecutarRequestExportacion(tipo, formato, btn, orig, action, paramsAdicionales = '') {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    btn.disabled = true;

    const overlay = document.getElementById('reporteLoadingOverlay');
    const msg = document.getElementById('reporteLoadingMsg');
    
    try {
      if (overlay) overlay.style.display = 'flex';
      if (msg) msg.textContent = 'Consultando base de datos...';

      const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
      const token = window.auth?.getToken() || '';
      const downloadUrl = `${baseUrl}/censo-reportes/exportar?tipo=${tipo}&format=${formato}&action=${action}&token=${token}&${paramsAdicionales}`;
      
      console.log('🔗 URL de exportación:', downloadUrl);
      if (msg) msg.textContent = 'Preparando archivo...';
      const headers = window.auth ? { 'Authorization': `Bearer ${window.auth.getToken()}` } : {};
      const response = await fetch(downloadUrl, { headers });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      
      if (action === 'view' && formato === 'pdf') {
        window.open(objUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `reporte_${tipo}_${Date.now()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
      }
      
      btn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
      if (window.Components) Components.showToast('Reporte generado exitosamente.', 'success');
      
      setTimeout(() => { 
        btn.innerHTML = orig; 
        btn.disabled = false; 
      }, 2000);
      
    } catch(err) {
      if (window.Components) Components.showToast('Error al generar el reporte: ' + err.message, 'error');
      btn.innerHTML = orig; 
      btn.disabled = false; 
    } finally {
      if (overlay) overlay.style.display = 'none';
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

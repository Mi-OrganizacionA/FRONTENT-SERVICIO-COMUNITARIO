/**
 * Módulo de Dashboard (SICAG v2.5)
 * Archivo: js/dashboard.js
 */

class DashboardController {
  constructor() {
    this.habitantes = [];
    this.proyectos = [];
    this.init();
    window.generarReporteGeneral = this.generarReporteGeneral.bind(this);
  }

  generarReporteGeneral() {
    let html = `
      <html><head><title>Reporte General - Comuna Socialista Agroecológica Simón Rodríguez</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
        h1, h2 { text-align: center; color: #1B5E20; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
        th { background: #4CAF50; color: white; }
        .logo { display: block; margin: 0 auto 20px auto; max-width: 150px; }
        .summary { display: flex; justify-content: space-around; background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .summary div { text-align: center; }
        .summary h3 { margin: 0; font-size: 24px; color: #1B5E20; }
        .summary p { margin: 5px 0 0 0; font-size: 14px; color: #666; }
      </style>
      </head><body>
      <img src="assets/img/logo_comuna_fondoremovido.svg" class="logo" alt="Logo Comuna">
      <h1>Reporte General de la Comuna</h1>
      <h2>Comuna Socialista Agroecológica Simón Rodríguez</h2>
      <p style="text-align:center;">Fecha de emisión: ${new Date().toLocaleDateString('es-VE')}</p>
      
      <div class="summary">
        <div><h3>${this.habitantes.length}</h3><p>Habitantes</p></div>
        <div><h3>${this.viviendas?.length || 0}</h3><p>Viviendas</p></div>
        <div><h3>${this.stats?.consejeros || 0}</h3><p>Voceros</p></div>
      </div>
      
      <h3>Resumen de Viviendas por Consejo Comunal</h3>
      <table>
        <thead><tr><th>Consejo Comunal</th><th>Viviendas Censadas</th></tr></thead>
        <tbody>
    `;

    const ccMap = {};
    if (this.viviendas) {
      this.viviendas.forEach(v => {
        const cc = v.consejo?.nombre_comunidad || v.sector || 'Sin Asignar';
        ccMap[cc] = (ccMap[cc] || 0) + 1;
      });
    }

    for (const [cc, count] of Object.entries(ccMap)) {
      html += `<tr><td>${cc}</td><td>${count}</td></tr>`;
    }

    html += `
        </tbody>
      </table>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }

  async init() {
    try {
      // 1. Mostrar loading en lugar de KPIs temporalmente
      // (Opcional: podríamos agregar spinners en los KPIs)

      // 2. Cargar datos desde la API (simulada)
      await this.cargarDatos();

      // 3. Renderizar vista
      this.actualizarKPIs();
      this.inicializarGraficos();

    } catch (error) {
      console.error('Error inicializando dashboard:', error);
      if (window.Components) Components.showToast('Error cargando los datos del dashboard', 'error');
    }
  }

  async cargarDatos() {
    try {
      const pStats = window.api.getDashboardStats().catch(() => ({ habitantes: 0, proyectos: 0, consejos: 0, viviendas: 0 }));
      const pHabitantes = window.api.getHabitantes().catch(() => []);
      const pNoticias = window.api.getNoticias().catch(() => []);
      const pResumen = window.api.getDashboardResumen().catch(() => []);
      const pViviendas = window.api.getEstudiosDemograficos ? window.api.getEstudiosDemograficos().catch(() => []) : window.api.getViviendas().catch(() => []);
      
      this.stats = await pStats;
      this.habitantes = await pHabitantes;
      this.noticias = await pNoticias;
      this.resumen = await pResumen;
      this.viviendas = await pViviendas;
      this.habitantesTotales = await window.api.getHabitantes({ limit: 5000 }).catch(() => this.habitantes);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  actualizarKPIs() {
    // Actualizar tarjetas numéricas
    const totalHab = document.getElementById('kpiTotalHab');
    if (totalHab) totalHab.textContent = this.stats?.habitantes || 0;

    const elNoticias = document.getElementById('kpiNoticias');
    if (elNoticias) elNoticias.textContent = this.noticias?.length || 0;

    // Calcular electores ficticios o reales si vienen en el array
    const elElectores = document.getElementById('kpiElectores');
    const elNinos = document.getElementById('kpiNinos');
    
    if (this.habitantes && this.habitantes.length > 0) {
      let electores = 0;
      let ninos = 0;
      const today = new Date();
      this.habitantes.forEach(h => {
        if (h.fecha_nacimiento) {
          const fnac = new Date(h.fecha_nacimiento);
          let age = today.getFullYear() - fnac.getFullYear();
          if (today.getMonth() < fnac.getMonth() || (today.getMonth() === fnac.getMonth() && today.getDate() < fnac.getDate())) {
            age--;
          }
          if (age >= 18) electores++;
          if (age <= 11) ninos++;
        }
      });
      if (elElectores) elElectores.textContent = electores;
      if (elNinos) elNinos.textContent = ninos;
    } else {
      if (elElectores) elElectores.textContent = 0;
      if (elNinos) elNinos.textContent = 0;
    }

    // Actualizar tabla resumen consejos
    const tbConsejos = document.getElementById('tbConsejos');
    if (tbConsejos && this.resumen) {
      tbConsejos.innerHTML = '';
      const dataResumen = this.resumen.filter(r => r.consejo !== 'TOTAL' && r.total_hab > 0);
      if (dataResumen.length === 0) {
        tbConsejos.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#666;">Sin datos en la base de datos.</td></tr>';
      } else {
        dataResumen.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${r.consejo}</td>
            <td>${r.total_hab}</td>
            <td>${r.electores}</td>
            <td>${r.ninos}</td>
          `;
          tbConsejos.appendChild(tr);
        });
      }
    }

    // Actualizar tabla recientes
    const tbody = document.querySelector('#recentTable tbody');
    if (tbody && this.habitantes) {
      tbody.innerHTML = '';
      // Tomamos los ultimos 5
      const recientes = [...this.habitantes].slice(-5).reverse();
      if (recientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">Sin registros recientes.</td></tr>';
      } else {
        recientes.forEach(h => {
          let age = '-';
          if (h.fecha_nacimiento) {
            const today = new Date();
            const fnac = new Date(h.fecha_nacimiento);
            age = today.getFullYear() - fnac.getFullYear();
            if (today.getMonth() < fnac.getMonth() || (today.getMonth() === fnac.getMonth() && today.getDate() < fnac.getDate())) age--;
          }
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${h.cedula || 'S/C'}</td>
            <td>${h.nombres || ''} ${h.apellidos || ''}</td>
            <td>${age}</td>
            <td>${h.genero || '-'}</td>
            <td>${h.consejo?.nombre_comunidad || 'No asignado'}</td>
            <td><span class="badge ${age >= 18 ? 'bg-verde' : 'bg-amarillo'}">${age >= 18 ? 'Adulto' : 'Menor'}</span></td>
            <td>${age >= 18 ? '<i class="fas fa-check-circle text-success"></i>' : '-'}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
    
    console.log(`[Dashboard] Datos cargados: ${this.stats?.habitantes} habitantes.`);
    
    // Animación de los botones de reload
    document.querySelectorAll('.kpi-reload').forEach(btn => {
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        const icon = this.querySelector('i');
        icon.classList.add('fa-spin');
        await new Promise(r => setTimeout(r, 1000));
        icon.classList.remove('fa-spin');
        if (window.Components) Components.showToast('Datos actualizados', 'success');
      });
    });
  }

  inicializarGraficos() {
    if (typeof Chart === 'undefined') return;
    if (typeof ChartDataLabels !== 'undefined') {
      Chart.register(ChartDataLabels);
    }

    var palVerde = ['#2E7D32','#388E3C','#43A047','#4CAF50','#66BB6A','#81C784','#A5D6A7','#C8E6C9','#E8F5E9'];

    // Procesar datos para Donut Consejos
    let labelsConsejos = [];
    let dataConsejos = [];
    if (this.resumen && this.resumen.length > 0) {
      const filtered = this.resumen.filter(r => r.consejo !== 'TOTAL' && r.total_hab > 0);
      labelsConsejos = filtered.map(r => r.consejo);
      dataConsejos = filtered.map(r => r.total_hab);
    }
    if (dataConsejos.length === 0) { labelsConsejos = ['Sin Datos']; dataConsejos = [1]; }

    // Procesar datos para Bar Clasificaciones
    let ninos = 0, adol = 0, mayores = 0, embaraz = 0, lactantes = 0, discap = 0, electores = 0;
    if (this.habitantesTotales && this.habitantesTotales.length > 0) {
      const today = new Date();
      this.habitantesTotales.forEach(h => {
        if (h.fecha_nacimiento) {
          const fnac = new Date(h.fecha_nacimiento);
          let age = today.getFullYear() - fnac.getFullYear();
          if (today.getMonth() < fnac.getMonth() || (today.getMonth() === fnac.getMonth() && today.getDate() < fnac.getDate())) age--;
          if (age <= 11) ninos++;
          else if (age >= 12 && age <= 17) adol++;
          if (age >= 60) mayores++;
          if (age >= 18) electores++;
        }
        if (h.condicion_salud === 'discapacidad') discap++;
        if (h.condicion_salud === 'embarazada' || h.condicion_salud === 'embarazo') embaraz++;
        if (h.condicion_salud === 'lactante') lactantes++;
      });
    }
    const dataClasificaciones = [ninos, adol, mayores, embaraz, lactantes, discap, electores];

    // Procesar datos para Line Registros (Por Mes del Año Actual)
    const registrosPorMes = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    if (this.habitantesTotales && this.habitantesTotales.length > 0) {
      this.habitantesTotales.forEach(h => {
        const d = h.fecha_registro ? new Date(h.fecha_registro) : new Date();
        if (d.getFullYear() === currentYear) {
          registrosPorMes[d.getMonth()]++;
        }
      });
    }

    // --- Donut Consejos ---
    const ctxConsejos = document.getElementById('chartConsejos');
    if (ctxConsejos) {
      new Chart(ctxConsejos.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labelsConsejos,
          datasets: [{ data: dataConsejos, backgroundColor: palVerde, borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '52%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 10, font: { family: 'Poppins', size: 10 }, usePointStyle: true, pointStyleWidth: 8 } },
            datalabels: {
              color: '#fff',
              font: { weight: 'bold', size: 11 },
              formatter: (value, ctx) => {
                let sum = 0;
                let dataArr = ctx.chart.data.datasets[0].data;
                dataArr.forEach(data => { sum += data; });
                if(sum === 0) return null;
                let percentage = (value * 100 / sum).toFixed(2) + "%";
                return value > 0 ? percentage : null;
              }
            },
            tooltip: { backgroundColor: '#1A2E1A', padding: 12, cornerRadius: 8,
              callbacks: { label: ctx => { const t = ctx.dataset.data.reduce((a,b)=>a+b,0); return ` ${ctx.label}: ${ctx.raw} hab. (${((ctx.raw/t)*100).toFixed(1)}%)`; } } }
          }
        }
      });
    }

    // --- Bar clasificaciones ---
    const ctxClas = document.getElementById('chartClasificaciones');
    if (ctxClas) {
      new Chart(ctxClas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Niños\n(0-11)','Adolesc.','Adultos\nMayores','Embaraz.','Lactantes','Discap.','Electores'],
          datasets: [{ label: 'Personas', data: dataClasificaciones,
            backgroundColor: ['rgba(249,168,37,.85)','rgba(255,140,0,.85)','rgba(198,40,40,.85)','rgba(233,30,99,.85)','rgba(156,39,176,.85)','rgba(21,101,192,.85)','rgba(46,125,50,.85)'],
            borderRadius: 6, borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1A2E1A', padding: 12, cornerRadius: 8 } },
          scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' } }, x: { grid: { display: false } } }
        }
      });
    }

    // --- Line registros ---
    const ctxReg = document.getElementById('chartRegistros');
    if (ctxReg) {
      var ctxR = ctxReg.getContext('2d');
      var gR = ctxR.createLinearGradient(0,0,0,280);
      gR.addColorStop(0,'rgba(67,160,71,.25)'); gR.addColorStop(1,'rgba(67,160,71,.02)');
      new Chart(ctxR, {
        type: 'line',
        data: {
          labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
          datasets: [{ label: 'Nuevos registros', data: registrosPorMes,
            borderColor: '#43A047', backgroundColor: gR, borderWidth: 3, fill: true, tension: 0.4,
            pointBackgroundColor: '#43A047', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1A2E1A', padding: 12, cornerRadius: 8, mode: 'index', intersect: false } },
          scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { callback: v => v+' hab.' } }, x: { grid: { display: false } } }
        }
      });
    }

    // --- Donut condición de viviendas ---
    if (this.viviendas && this.viviendas.length > 0) {
      const condicionMap = { 'Buena': 0, 'Regular': 0, 'Mala': 0, 'Alto Riesgo': 0 };
      this.viviendas.forEach(v => {
        const cond = v.situacion_vivienda?.condiciones_salubridad || v.condicion_general || 'Regular';
        if (condicionMap[cond] !== undefined) condicionMap[cond]++;
        else condicionMap['Regular']++;
      });

      const ctxCond = document.getElementById('chartCondicionViviendas');
      if (ctxCond) {
        new Chart(ctxCond.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['Buena', 'Regular', 'Mala', 'Alto Riesgo'],
            datasets: [{
              data: [condicionMap['Buena'], condicionMap['Regular'], condicionMap['Mala'], condicionMap['Alto Riesgo']],
              backgroundColor: ['#43A047', '#FFA726', '#EF5350', '#C62828'],
              borderWidth: 3, borderColor: '#fff', hoverOffset: 8
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '52%',
            plugins: {
              legend: { position: 'bottom', labels: { padding: 10, font: { family: 'Poppins', size: 10 }, usePointStyle: true } },
              datalabels: {
                color: '#fff',
                font: { weight: 'bold', size: 11 },
                formatter: (value, ctx) => {
                  let sum = 0;
                  let dataArr = ctx.chart.data.datasets[0].data;
                  dataArr.forEach(data => { sum += data; });
                  if(sum === 0) return null;
                  let percentage = (value * 100 / sum).toFixed(2) + "%";
                  return value > 0 ? percentage : null;
                }
              },
              tooltip: { backgroundColor: '#1A2E1A', padding: 12, cornerRadius: 8 }
            }
          }
        });
      }

      // --- Barras tipo de gas ---
      const gasMap = {};
      this.viviendas.forEach(v => {
        const gas = v.servicios?.gas_tipo || v.gas_domestico || 'No posee';
        gasMap[gas] = (gasMap[gas] || 0) + 1;
      });
      const gasLabels = Object.keys(gasMap);
      const gasData = gasLabels.map(k => gasMap[k]);

      const ctxGas = document.getElementById('chartGasViviendas');
      if (ctxGas) {
        new Chart(ctxGas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: gasLabels,
            datasets: [{
              label: 'Viviendas',
              data: gasData,
              backgroundColor: ['rgba(46,125,50,.85)', 'rgba(21,101,192,.85)', 'rgba(198,40,40,.85)', 'rgba(249,168,37,.85)'],
              borderRadius: 6, borderSkipped: false
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1A2E1A', padding: 12, cornerRadius: 8 } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' } }, x: { grid: { display: false } } }
          }
        });
      }
    }
  }
}

// Inicializar al cargar (usando el evento del SPA Router o DOMContentLoaded directo)
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardCtrl = new DashboardController();
});
document.addEventListener('spa-navigated', () => {
  if (window.location.pathname.includes('dashboard.html')) {
    window.dashboardCtrl = new DashboardController();
  }
});

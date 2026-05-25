/**
 * Módulo de Dashboard (SICAG v5.0)
 * Archivo: js/dashboard.js
 */

class DashboardController {
  constructor() {
    this.habitantes = [];
    this.proyectos = [];
    this.init();
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
      // Cargamos todos los habitantes y proyectos
      this.habitantes = await window.api.getHabitantes();
      this.proyectos = await window.api.getProyectos();
    } catch (err) {
      throw err;
    }
  }

  actualizarKPIs() {
    // Si tenemos elementos para actualizar (este prototipo asume que los KPIs están fijos,
    // pero demostramos cómo actualizarlos con datos reales)
    
    // Contar Familias (aproximado usando cedulas unicas para el demo)
    const totalHabitantes = this.habitantes.length;
    
    // En este punto, solo notificamos en consola para el demo
    console.log(`[Dashboard] Datos cargados: ${totalHabitantes} habitantes, ${this.proyectos?.length || 0} proyectos.`);
    
    // Animación de los botones de reload
    document.querySelectorAll('.kpi-reload').forEach(btn => {
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        const icon = this.querySelector('i');
        icon.classList.add('fa-spin');
        
        // Simular recarga
        await new Promise(r => setTimeout(r, 1000));
        
        icon.classList.remove('fa-spin');
        if (window.Components) Components.showToast('Datos actualizados', 'success');
      });
    });
  }

  inicializarGraficos() {
    if (typeof Chart === 'undefined') return;

    var palVerde = ['#2E7D32','#388E3C','#43A047','#4CAF50','#66BB6A','#81C784','#A5D6A7','#C8E6C9','#E8F5E9'];

    // --- Donut Consejos ---
    const ctxConsejos = document.getElementById('chartConsejos');
    if (ctxConsejos) {
      // Extraemos etiquetas de los datos si quisiéramos, pero para el demo usamos la data dura
      // que coincide con el diseño visual del usuario
      new Chart(ctxConsejos.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Jobito I','Jobito II','Brisas del Yurubí','A. E. Blanco','Mercedes I','Mercedes II','Santa Cruz','Fortaleza Corozo','Vencedores Corozo'],
          datasets: [{ data: [52,45,41,38,36,35,38,32,30], backgroundColor: palVerde, borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '52%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 10, font: { family: 'Poppins', size: 10 }, usePointStyle: true, pointStyleWidth: 8 } },
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
          datasets: [{ label: 'Personas', data: [62,48,39,14,8,12,231],
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
          datasets: [{ label: 'Nuevos registros', data: [45,38,52,41,36,28,22,18,25,20,12,10],
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

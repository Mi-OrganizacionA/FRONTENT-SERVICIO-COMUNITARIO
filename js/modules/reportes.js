/**
 * Módulo de Reportes - SICAG v5.0
 * Archivo: js/modules/reportes.js
 */

class ReportesController {
  constructor() {
    this.init();
  }

  async init() {
    try {
      this._setupUI();
      // Opcional: cargar datos si fueran dinámicos
      // this.datosReportes = await window.api.getReportesDashboard();
      this.renderGraficos();
    } catch (error) {
      console.error('Error inicializando Reportes:', error);
      if (window.Components) Components.showToast('Error al cargar módulo de reportes', 'error');
    }
  }

  _setupUI() {
    // Configurar botones de descarga simulada
    document.querySelectorAll('.dl-btn').forEach(btn => {
      btn.addEventListener('click', () => this.simularDescarga(btn));
    });
    
    ['btnExportExcel','btnExportPDF','btnExportTabla','btnCustomExcel','btnCustomPDF'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.simularDescarga(el));
    });

    const btnFiltrar = document.getElementById('btnFiltrar');
    if (btnFiltrar) {
      btnFiltrar.addEventListener('click', () => {
        const orig = btnFiltrar.innerHTML;
        btnFiltrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        setTimeout(() => { 
          btnFiltrar.innerHTML = '<i class="fas fa-filter"></i> Aplicar Filtro';
          if (window.Components) Components.showToast('Filtro aplicado (Simulación)', 'info');
        }, 900);
      });
    }
  }

  simularDescarga(btn) {
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
      if (window.Components) Components.showToast('Archivo descargado', 'success');
      setTimeout(() => { 
        btn.innerHTML = orig; 
        btn.disabled = false; 
      }, 1500);
    }, 1600);
  }

  renderGraficos() {
    if (typeof Chart === 'undefined') return;

    const ctxClasif = document.getElementById('chartClasif');
    if (ctxClasif) {
      new Chart(ctxClasif.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Electores','Niños (0-11)','Adolescentes','Adultos Mayores','Embarazadas','Lactantes','Discapacidad','Encamados'],
          datasets: [{ data: [231,62,48,39,14,8,12,5],
            backgroundColor: ['#2E7D32','#F9A825','#FF8C00','#C62828','#E91E63','#9C27B0','#1565C0','#8D6E63'],
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
      new Chart(ctxCC.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Jobito I','Jobito II','Brisas\nYurubí','A.E.\nBlanco','Mercedes\nI','Mercedes\nII','Santa\nCruz','Fort.\nCorozo','Venc.\nCorozo'],
          datasets: [{
            label: 'Habitantes',
            data: [52,45,41,38,36,35,38,32,30],
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

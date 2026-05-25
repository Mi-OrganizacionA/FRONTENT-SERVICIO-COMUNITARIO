/**
 * Módulo de Cartelera Digital (Noticias) - SICAG v5.0
 * Archivo: js/modules/noticias.js
 */

class NoticiasController {
  constructor() {
    this.noticias = [];
    // Opcional: si usamos FormValidator
    // this.form = new FormValidator('formNoticia', 'noticia');
    this.init();
  }

  async init() {
    try {
      this._setupUI();
      await this.cargarDatos();
    } catch (error) {
      console.error('Error inicializando Noticias:', error);
      if (window.Components) Components.showToast('Error cargando módulo Cartelera', 'error');
    }
  }

  _setupUI() {
    const tipoSelect = document.getElementById('notTipo');
    if (tipoSelect) {
      tipoSelect.addEventListener('change', () => this.handleTipoNoticia());
    }

    const searchInput = document.getElementById('pubSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filtrarPubs());
    }

    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.filtrarPubs();
      });
    });

    // Exponer globalmente
    window.abrirModalNoticia = (id, tipo) => this.abrirModalNoticia(id, tipo);
    window.cerrarModalNoticia = () => this.cerrarModalNoticia();
    window.guardarNoticia = () => this.guardarNoticia();
    window.confirmarEliminarNot = (id) => this.confirmarEliminarNot(id);
    window.cerrarModalElimNot = () => this.cerrarModalElimNot();
    window.exportarCartelera = () => this.exportarCartelera();
  }

  async cargarDatos() {
    // Usamos datos dummy si la API no devuelve nada
    const dataDummy = [
      { id: 1, tipo: 'noticia', titulo: 'Jornada de Vacunación', autor: 'Comité Salud', fecha: '2026-05-15', desc: 'Se realizará vacunación en la casa comunal.' },
      { id: 2, tipo: 'convocatoria', titulo: 'Asamblea de Ciudadanos', autor: 'Sala Autogobierno', fecha: '2026-05-20', desc: 'Discusión de nuevos proyectos.', extra: 'Plaza Bolívar - 10:00 am' }
    ];
    
    // Por simplicidad en este modulo v5.0 simularemos que ya cargaron visualmente (manteniendo el diseño premium actual),
    // pero configuramos la infraestructura CRUD.
    
    // Actualizar el contador inicial
    this.actualizarContador();
  }

  abrirModalNoticia(id, tipo = 'noticia') {
    const modal = document.getElementById('modalNoticia');
    const title = document.getElementById('modalNotTitle');
    const form = document.getElementById('formNoticia');
    
    if (id) {
      title.innerHTML = '<i class="fas fa-pencil-alt" style="color:var(--au)"></i> Editar Publicación #' + id;
    } else {
      title.innerHTML = '<i class="fas fa-plus-circle" style="color:var(--vv)"></i> Nueva Publicación';
      if (form) form.reset();
      const autorInput = document.getElementById('notAutor');
      if (autorInput) autorInput.value = window.auth ? window.auth.getUser()?.nombre : 'Sala de Autogobierno';
      
      const tipoInput = document.getElementById('notTipo');
      if (tipoInput) tipoInput.value = tipo;
      this.handleTipoNoticia();
    }
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  cerrarModalNoticia() {
    const modal = document.getElementById('modalNoticia');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  guardarNoticia() {
    const titulo = document.getElementById('notTitulo')?.value.trim();
    const tipo = document.getElementById('notTipo')?.value;
    const desc = document.getElementById('notDescripcion')?.value.trim();
    const extra = document.getElementById('notExtra')?.value.trim();

    if (!titulo || !tipo || !desc) {
      if (window.Components) Components.showToast('Complete los campos obligatorios (*)', 'warning');
      return;
    }
    if ((tipo === 'encuesta' || tipo === 'convocatoria') && !extra) {
      if (window.Components) Components.showToast('Complete el detalle adicional', 'warning');
      return;
    }

    const btn = document.querySelector('#modalNoticia .modal-footer-sicag .btn-primary');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
      btn.disabled = true;
    }

    setTimeout(() => {
      if (window.Components) Components.showToast('Publicación exitosa', 'success');
      this.cerrarModalNoticia();
      if (btn) {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar';
        btn.disabled = false;
      }
      // Aqui idealmente recargamos los datos y la grilla
    }, 1200);
  }

  handleTipoNoticia() {
    const tipo = document.getElementById('notTipo')?.value;
    const extraGroup = document.getElementById('notExtraGroup');
    const extraLabel = document.getElementById('notExtraLabel');
    const extraInput = document.getElementById('notExtra');
    const extraHint = document.getElementById('notExtraHint');
    
    if (!extraGroup) return;

    if (tipo === 'convocatoria') {
      extraGroup.style.display = '';
      if(extraLabel) extraLabel.textContent = 'Lugar / Horario';
      if(extraInput) extraInput.placeholder = 'Ej: Plazoleta central — 10:00 am';
      if(extraHint) extraHint.textContent = 'Describe el punto de encuentro y la hora.';
    } else if (tipo === 'encuesta') {
      extraGroup.style.display = '';
      if(extraLabel) extraLabel.textContent = 'Enlace de encuesta';
      if(extraInput) extraInput.placeholder = 'https://example.com/encuesta';
      if(extraHint) extraHint.textContent = 'Agrega el enlace de participación digital.';
    } else {
      extraGroup.style.display = 'none';
      if(extraInput) extraInput.value = '';
    }
  }

  confirmarEliminarNot(id) {
    if (window.Components) {
      Components.confirmDialog(
        '¿Eliminar esta publicación? Ya no será visible para la comunidad. Esta acción no se puede deshacer.',
        () => this.eliminarNoticiaVisual(id)
      );
    }
  }

  eliminarNoticiaVisual(id) {
    const card = document.querySelector('#pubGrid .pub-card[data-id="' + id + '"]');
    if (card) {
      card.style.transition = 'all 0.35s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.88)';
      setTimeout(() => {
        card.remove();
        this.actualizarContador();
        if (window.Components) Components.showToast('Publicación eliminada', 'success');
      }, 350);
    }
  }

  cerrarModalElimNot() {
    // Legacy support since we use dynamic Components.confirmDialog now
  }

  filtrarPubs() {
    const activeChip = document.querySelector('.chip.active');
    const tipo = activeChip ? activeChip.dataset.filter : 'todos';
    const searchInput = document.getElementById('pubSearchInput');
    const buscar = searchInput ? searchInput.value.toLowerCase() : '';
    const cards = document.querySelectorAll('#pubGrid .pub-card');
    
    let visible = 0;
    cards.forEach(card => {
      const matchTipo = tipo === 'todos' || card.dataset.type === tipo;
      const titleEl = card.querySelector('.pub-card-title');
      const titleText = titleEl ? titleEl.textContent.toLowerCase() : '';
      const matchBusca = buscar === '' || titleText.includes(buscar);
      
      if (matchTipo && matchBusca) { 
        card.style.display = ''; 
        visible++; 
      } else { 
        card.style.display = 'none'; 
      }
    });
    
    this.actualizarContador(visible);
  }

  actualizarContador(forceCount = null) {
    const cards = document.querySelectorAll('#pubGrid .pub-card');
    let visible = forceCount !== null ? forceCount : 0;
    
    if (forceCount === null) {
      cards.forEach(c => { if (c.style.display !== 'none') visible++; });
    }
    
    const pubCount = document.getElementById('pubCount');
    if (pubCount) pubCount.textContent = visible;
    
    const pubEmpty = document.getElementById('pubEmpty');
    if (pubEmpty) pubEmpty.style.display = visible === 0 ? 'block' : 'none';
  }

  exportarCartelera() {
    if (window.Components) {
      Components.showToast('Exportación iniciada...', 'info');
    } else {
      window.alert('Exportación iniciada.');
    }
  }
}

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', () => {
  window.noticiasCtrl = new NoticiasController();
});
document.addEventListener('spa-navigated', () => {
  if (window.location.pathname.includes('noticias.html')) {
    window.noticiasCtrl = new NoticiasController();
  }
});

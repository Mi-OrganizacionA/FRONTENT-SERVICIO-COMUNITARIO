/**
 * Módulo de Cartelera Digital (Noticias) - SICAG v2.5
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
    const autorInput = document.getElementById('notAutor');
    const user = window.auth?.getUser();
    if (autorInput && user?.nombre) {
      autorInput.value = user.nombre;
      autorInput.readOnly = true;
    }

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
    try {
      this.noticias = await window.api.getNoticias();
      if (!this.noticias || !Array.isArray(this.noticias)) this.noticias = [];
    } catch (e) {
      console.error('Error cargando noticias:', e);
      this.noticias = [];
    }
    this.renderNoticias();
    this._renderDestacadas();
    this.actualizarKPICards();
    this.actualizarContador();
  }

  actualizarKPICards() {
    const total = this.noticias.length;
    const nNoticias = this.noticias.filter(n => n.tipo_publicacion === 'noticia').length;
    const nConv = this.noticias.filter(n => n.tipo_publicacion === 'convocatoria').length;
    const nAvisos = this.noticias.filter(n => ['aviso', 'encuesta'].includes(n.tipo_publicacion)).length;

    const elTotal = document.getElementById('kpiNoticiasTotal');
    const elNot = document.getElementById('kpiNoticiasActivas');
    const elConv = document.getElementById('kpiNoticiasConv');
    const elAvi = document.getElementById('kpiNoticiasAvisos');

    if (elTotal) elTotal.textContent = total;
    if (elNot) elNot.textContent = nNoticias;
    if (elConv) elConv.textContent = nConv;
    if (elAvi) elAvi.textContent = nAvisos;
  }

  _renderDestacadas() {
    const container = document.getElementById('featuredPubContainer');
    if (!container) return;
    const destacadas = this.noticias.filter(n => n.destacada && n.activo !== false);
    if (!destacadas.length) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }
    container.style.display = 'block';
    container.innerHTML = `
      <div class="feat-banner-strip">
        <i class="fas fa-star"></i>
        <strong>Destacadas:</strong>
        ${destacadas.map(n => `<span class="feat-item-tag">${n.titulo}</span>`).join('')}
      </div>`;
  }

  renderNoticias() {
    const grid = document.getElementById('pubGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const iconMap = {
      'noticia': 'fa-newspaper',
      'convocatoria': 'fa-bullhorn',
      'encuesta': 'fa-poll',
      'aviso': 'fa-triangle-exclamation'
    };

    // Ordenar: las publicaciones destacadas aparecen primero
    const ordenadas = [...this.noticias].sort((a, b) => {
      const aDestacada = a.destacada === true || a.destacada === 1 ? 1 : 0;
      const bDestacada = b.destacada === true || b.destacada === 1 ? 1 : 0;
      return bDestacada - aDestacada;
    });

    ordenadas.forEach(n => {
      const tipo = (n.tipo_publicacion || 'noticia').toLowerCase();
      const cssClass = tipo === 'aviso' ? 'aviso-cd' : tipo;
      const icono = iconMap[tipo] || 'fa-file-alt';
      const fecha = n.fecha_publicacion ? new Date(n.fecha_publicacion).toLocaleDateString() : 'Sin fecha';
      const esDestacada = n.destacada === true || n.destacada === 1;

      // Botón de enlace de encuesta (solo si tipo es encuesta y tiene enlace)
      const enlaceEncuesta = (tipo === 'encuesta' && n.enlace_encuesta)
        ? `<a href="${n.enlace_encuesta}" target="_blank" rel="noopener noreferrer"
             class="btn-sicag btn-sm"
             style="padding:4px 10px;font-size:0.75rem;background:var(--az);color:#fff;border-radius:50px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;margin-top:.4rem;">
             <i class="fas fa-external-link-alt"></i> Abrir Encuesta
           </a>`
        : '';

      const card = document.createElement('div');
      card.className = 'pub-card';
      card.dataset.id = n.id || n.id_publicacion;
      card.dataset.type = tipo;

      const user = window.auth?.getUser() || {};
      const isAdmin = user.rol === 'admin' || user.rol === 'admin_principal';
      const isAuthor = n.id_autor == user.id;
      const puedeEditar = isAdmin || isAuthor;

      const star = n.destacada ? '<i class="fas fa-star pub-star" title="Destacada"></i>' : '';
      card.innerHTML = `
        <div class="pub-card-bar bar-${tipo === 'aviso' ? 'aviso' : tipo}"></div>
        <div class="pub-card-body">
          <div class="pub-card-top">
            <span class="pub-badge badge-${cssClass}"><i class="fas ${icono}"></i> ${tipo.toUpperCase()}</span>
            <div class="pub-top-right">
              ${esDestacada ? '<span style="font-size:.72rem;font-weight:700;color:var(--au);"><i class="fas fa-star"></i> Destacada</span>' : ''}
              <span class="pub-status-dot"><i class="fas fa-check-circle"></i> Activa</span>
            </div>
          </div>
          <h4 class="pub-card-title">${n.titulo || ''}</h4>
          <p class="pub-card-desc">${n.contenido || ''}</p>
          ${enlaceEncuesta}
          <div class="pub-card-footer" style="margin-top:.5rem">
            <div class="pub-meta-info">
              <span class="pub-meta-row"><i class="fas fa-calendar"></i> ${fecha}</span>
              ${n.autor ? `<span class="pub-meta-row"><i class="fas fa-user"></i> ${n.autor}</span>` : ''}
            </div>
            ${puedeEditar ? `
            <div class="pub-card-btns">
              <button class="btn-sicag btn-sm" style="padding:4px 8px;font-size:0.75rem;background:transparent;color:var(--au)" onclick="abrirModalNoticia(${card.dataset.id}, '${tipo}')" title="Editar"><i class="fas fa-edit"></i></button>
              <button class="btn-sicag btn-sm" style="padding:4px 8px;font-size:0.75rem;background:transparent;color:var(--ru)" onclick="confirmarEliminarNot(${card.dataset.id})" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </div>
            ` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  abrirModalNoticia(id, tipo = 'noticia') {
    const modal = document.getElementById('modalNoticia');
    const title = document.getElementById('modalNotTitle');
    const form = document.getElementById('formNoticia');
    const idInput = document.getElementById('notId');
    
    if (id) {
      title.innerHTML = '<i class="fas fa-pencil-alt" style="color:var(--au)"></i> Editar Publicación #' + id;
      if (idInput) idInput.value = id;
      const n = this.noticias.find(x => x.id == id || x.id_publicacion == id);
      if (n) {
        const titulo = document.getElementById('notTitulo');
        const tipoInput = document.getElementById('notTipo');
        const desc = document.getElementById('notDescripcion');
        const fecha = document.getElementById('notFecha');
        const autor = document.getElementById('notAutor');
        
        if (titulo) titulo.value = n.titulo || '';
        if (tipoInput) tipoInput.value = (n.tipo_publicacion || 'noticia').toLowerCase();
        if (desc) desc.value = n.contenido || '';
        if (fecha && n.fecha_publicacion) fecha.value = n.fecha_publicacion.split('T')[0];
        if (autor) autor.value = n.autor || 'Sala de Autogobierno';
        const extra = document.getElementById('notExtra');
        const cierre = document.getElementById('notCierre');
        const destacada = document.getElementById('notDestacada');
        if (extra) extra.value = n.enlace_extra || '';
        if (cierre && n.fecha_cierre) cierre.value = n.fecha_cierre.split('T')[0];
        if (destacada) destacada.checked = !!n.destacada;
        this.handleTipoNoticia();
        this._renderDestacadas();
      }
    } else {
      title.innerHTML = '<i class="fas fa-plus-circle" style="color:var(--vv)"></i> Nueva Publicación';
      if (form) form.reset();
      if (idInput) idInput.value = '';

      // Autor automático: se autocompleta con el nombre del usuario autenticado (no editable)
      const autorInput = document.getElementById('notAutor');
      if (autorInput) {
        const nombreUsuario = window.auth?.getUser()?.nombre || 'Sala de Autogobierno';
        autorInput.value = nombreUsuario;
        autorInput.readOnly = true;
        autorInput.style.backgroundColor = 'var(--gray1)';
        autorInput.style.cursor = 'not-allowed';
      }

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

  async guardarNoticia() {
    const titulo = document.getElementById('notTitulo')?.value.trim();
    const tipo = document.getElementById('notTipo')?.value;
    const desc = document.getElementById('notDescripcion')?.value.trim();
    const extra = document.getElementById('notExtra')?.value.trim();
    const idInput = document.getElementById('notId')?.value;

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

    const data = {
      titulo: titulo,
      tipo_publicacion: tipo,
      contenido: desc,
      fecha_publicacion: document.getElementById('notFecha')?.value || new Date().toISOString(),
      enlace_extra: extra || null,
      fecha_cierre: document.getElementById('notCierre')?.value || null,
      destacada: document.getElementById('notDestacada')?.checked ? true : false
    };

    try {
      if (idInput) {
        await window.api.actualizarNoticia(idInput, data);
        if (window.Components) Components.showToast('Publicación actualizada', 'success');
      } else {
        await window.api.crearNoticia(data);
        if (window.Components) Components.showToast('Publicación exitosa', 'success');
      }
      this.cerrarModalNoticia();
      await this.cargarDatos();
    } catch (e) {
      console.error(e);
      if (window.Components) Components.showToast('Error al guardar publicación', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar';
        btn.disabled = false;
      }
    }
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

  async eliminarNoticiaVisual(id) {
    try {
      await window.api.eliminarNoticia(id);
      if (window.Components) Components.showToast('Publicación eliminada', 'success');
      await this.cargarDatos();
    } catch (e) {
      console.error(e);
      if (window.Components) Components.showToast('Error al eliminar publicación', 'error');
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

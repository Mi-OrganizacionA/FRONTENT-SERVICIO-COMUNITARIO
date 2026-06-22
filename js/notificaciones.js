/**
 * notificaciones.js â€” Controlador de Bandeja de Validaciones v3.0
 * Soporta vista tabla (Admin) y vista solicitudes propias (Vocero)
 */
class NotificacionesController {
  constructor() {
    this.todas = [];   // Todas las notificaciones cargadas
    this.filtradas = [];   // Tras aplicar filtros
    this.selected = new Set(); // IDs seleccionados
    this.userRole = null;
    this.userId = null;
    this.pendingBulkAction = null; // 'approve' | 'reject'
    this.detailId = null;
    this.paginaActual = 1;
    this.porPagina = 10;

    // Verificar sesiÃ³n antes de arrancar
    const u = window.auth ? window.auth.getUser() : null;
    if (!u) return;
    this.userRole = u.rol;
    this.userId = u.id;

    this.init();
  }

  async init() {
    this.adaptarVistaRol();
    await this.cargarDatos();
    this.bindUIEvents();
  }

  /* â”€â”€â”€ Adaptar la UI segÃºn el rol â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  adaptarVistaRol() {
    const isVocero = this.userRole === 'vocero';

    // Header adaptado
    const phTitle = document.getElementById('phTitle');
    const phModule = document.getElementById('phModule');
    const phMainTitle = document.getElementById('phMainTitle');
    const phSub = document.getElementById('phSub');
    const phIcon = document.getElementById('phIcon');
    const tableTitle = document.getElementById('tableTitle');
    const thCheck = document.getElementById('thCheck');
    const checkAll = document.getElementById('checkAll');

    if (isVocero) {
      if (phTitle) phTitle.textContent = 'Mis Solicitudes';
      if (phModule) phModule.innerHTML = '<i class="fas fa-id-badge"></i> Mi Cuenta';
      if (phMainTitle) phMainTitle.textContent = 'Mis Solicitudes';
      if (phSub) phSub.textContent = 'AquÃ­ puedes ver el estado de las solicitudes que has enviado al administrador.';
      if (phIcon) phIcon.className = 'fas fa-paper-plane';
      if (tableTitle) tableTitle.textContent = 'Mis solicitudes enviadas';
      // Mostrar checkboxes en vista vocero para selección múltiple
      if (thCheck) thCheck.style.display = '';
      if (checkAll) checkAll.style.display = '';
      // Ocultar filtro de tipo
      const ft = document.getElementById('filterTipo');
      if (ft) ft.style.display = 'none';

      // Adaptar botones de la barra masiva para Vocero
      const approveBtn = document.getElementById('btnBulkApprove');
      const rejectBtn = document.getElementById('btnBulkReject');
      if (approveBtn) approveBtn.style.display = 'none'; // Vocero no puede aprobar
      if (rejectBtn) {
        rejectBtn.innerHTML = '<i class="fas fa-ban"></i> Cancelar Seleccionadas';
      }
    }
  }

  /* â”€â”€â”€ Carga de datos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  async cargarDatos() {
    try {
      const isVocero = this.userRole === 'vocero';
      let data;

      if (isVocero && this.userId) {
        const response = await window.api._fetch(`${window.api.baseURL}/validaciones/mis-solicitudes?userId=${this.userId}`, window.api._getHeaders());
        data = await response.json().catch(() => []);
      } else {
        data = await window.api.getNotificaciones();
      }

      const arrayData = Array.isArray(data) ? data : (data.pendientes || []);

      // Normalizar estado_tramite a estado ('pendiente', 'aceptado', 'rechazado')
      this.todas = arrayData.map(n => {
        let raw = (n.estado_tramite || n.estado || 'pendiente').toLowerCase();
        if (raw === 'aprobado') raw = 'aceptado';
        return { ...n, estado: raw };
      });

      this.aplicarFiltros();
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
      this.renderTabla([]);
      Components.showToast('Error al cargar solicitudes: ' + e.message, 'error');
    }
  }


  aplicarFiltros() {
    const tipo = (document.getElementById('filterTipo')?.value || '').toLowerCase();
    const estado = (document.getElementById('filterEstado')?.value || '').toLowerCase();
    const busca = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
    const isVocero = this.userRole === 'vocero';

    let lista = [...this.todas];

    // Vocero: solo sus propias solicitudes
    if (isVocero && this.userId) {
      lista = lista.filter(n => String(n.id_vocero) === String(this.userId));
    }

    // Filtro tipo tabla
    if (tipo) lista = lista.filter(n => (n.tabla_afectada || '').toLowerCase().includes(tipo));

    // Filtro estado
    if (estado) lista = lista.filter(n => (n.estado || 'pendiente').toLowerCase() === estado);

    // Filtro bÃºsqueda libre
    if (busca) {
      lista = lista.filter(n => {
        const desc = this.getDescripcion(n).toLowerCase();
        const tabla = (n.tabla_afectada || '').toLowerCase();
        return desc.includes(busca) || tabla.includes(busca);
      });
    }

    // Ordenar por fecha descendente
    lista.sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
    this.filtradas = lista;
    this.paginaActual = 1; // Resetear al primer filtrado

    this.renderStats();
    this.renderTabla(lista);
  }


  renderStats() {
    const cont = document.getElementById('notificationStats');
    if (!cont) return;

    const isVocero = this.userRole === 'vocero';
    const base = isVocero
      ? this.todas.filter(n => String(n.id_vocero) === String(this.userId))
      : this.todas;

    const pendientes = base.filter(n => !n.estado || n.estado === 'pendiente').length;
    const aprobados = base.filter(n => n.estado === 'aceptado').length;
    const rechazados = base.filter(n => n.estado === 'rechazado').length;

    const stats = isVocero ? [
      { label: 'Mis Solicitudes', value: base.length, sub: 'Total enviadas', color: 'azul', icon: 'paper-plane', trend: 'up' },
      { label: 'Pendientes', value: pendientes, sub: 'En revisiÃ³n', color: 'amarillo', icon: 'clock', trend: pendientes > 0 ? 'down' : 'up' },
      { label: 'Aprobadas', value: aprobados, sub: 'Aceptadas', color: 'verde', icon: 'check-circle', trend: 'up' },
      { label: 'Rechazadas', value: rechazados, sub: 'No aprobadas', color: 'rojo', icon: 'times-circle', trend: rechazados > 0 ? 'down' : 'up' }
    ] : [
      { label: 'Pendientes', value: pendientes, sub: 'Requieren acciÃ³n', color: 'amarillo', icon: 'clock', trend: pendientes > 0 ? 'down' : 'up' },
      { label: 'Total', value: base.length, sub: 'En bandeja', color: 'azul', icon: 'inbox', trend: 'up' },
      { label: 'Aprobadas hoy', value: aprobados, sub: 'Procesadas', color: 'verde', icon: 'check-double', trend: 'up' },
      { label: 'Rechazadas', value: rechazados, sub: 'No aprobadas', color: 'rojo', icon: 'ban', trend: rechazados > 0 ? 'down' : 'up' }
    ];

    cont.innerHTML = stats.map(s => `
      <div class="kpi-card border-${s.color}">
        <div class="kpi-icon ${s.color}"><i class="fas fa-${s.icon}"></i></div>
        <div class="kpi-info">
          <h3>${s.label}</h3>
          <div class="kpi-value">${s.value}</div>
          <div class="kpi-trend ${s.trend}">${s.sub}</div>
        </div>
      </div>
    `).join('');
  }

  /* â”€â”€â”€ Render Tabla â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  renderTabla(lista) {
    const tbody = document.getElementById('validacionesTbody');
    const countBadge = document.getElementById('countBadge');
    const tableSection = document.getElementById('tableSection');
    const emptyState = document.getElementById('emptyState');
    const isVocero = this.userRole === 'vocero';

    if (countBadge) {
      countBadge.textContent = `${lista.length} solicitud${lista.length !== 1 ? 'es' : ''}`;
      countBadge.className = 'badge-sicag ' + (lista.length > 0 ? 'badge-pendiente' : 'badge-activo');
    }

    if (!tbody) return;

    if (this.todas.length === 0) {
      if (tableSection) tableSection.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      const emptyTitle = document.getElementById('emptyTitle');
      const emptyMsg = document.getElementById('emptyMsg');
      if (emptyTitle) emptyTitle.textContent = isVocero ? 'No tienes solicitudes enviadas' : 'No hay solicitudes pendientes';
      if (emptyMsg) emptyMsg.textContent = isVocero
        ? 'Cuando envíes noticias, proyectos u otros datos, aparecerán aquí para que veas su estado.'
        : 'Todo está en orden. Cuando los voceros envíen nuevas solicitudes, aparecerán aquí.';
      return;
    }

    if (lista.length === 0) {
      if (tableSection) tableSection.style.display = 'block';
      if (emptyState) emptyState.style.display = 'none';
      if (tbody) tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:3rem 1rem; color:var(--muted);">
            <i class="fas fa-search" style="font-size:2rem; display:block; margin-bottom:.75rem; opacity:.4;"></i>
            <strong style="font-size:.95rem; color:var(--txt);">
              ${isVocero ? 'No tienes solicitudes con este filtro' : 'No hay solicitudes con este filtro'}
            </strong>
            <p style="font-size:.82rem; margin-top:.35rem; opacity:.7;">Prueba cambiando el estado o la búsqueda.</p>
          </td>
        </tr>`;
      if (document.getElementById('paginadorValidaciones')) document.getElementById('paginadorValidaciones').innerHTML = '';
      return;
    }

    if (tableSection) tableSection.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // Calcular slice de la página actual
    const inicio = (this.paginaActual - 1) * this.porPagina;
    const paginaData = lista.slice(inicio, inicio + this.porPagina);

    tbody.innerHTML = paginaData.map((n, idx) => {
      const isSelected = this.selected.has(n.id);
      const estado = (n.estado || 'pendiente').toLowerCase();
      const desc = this.getDescripcion(n);
      const tipoBadge = this.getTipoBadge(n.tabla_afectada);
      const estadoPill = this.getEstadoPill(estado);
      const fecha = this.formatDate(n.fecha_solicitud);
      const solicitante = n.nombre_vocero || `Vocero #${n.id_vocero || 'Desconocido'}`;

      return `
        <tr class="${isSelected ? 'selected' : ''}" data-id="${n.id}" role="row">
          <td class="td-check">
            <input type="checkbox" class="v-checkbox row-check" data-id="${n.id}"
              ${isSelected ? 'checked' : ''} title="Seleccionar" aria-label="Seleccionar solicitud ${n.id}">
          </td>
          <td>${tipoBadge} <span style="font-size:.75rem;color:var(--muted);display:block;margin-top:2px;">${this.escapeHtml(n.tipo_accion || 'CREATE')}</span></td>
          <td>
            <div class="v-solicitante">${this.escapeHtml(solicitante)}</div>
            <div class="v-solicitante-sub">${n.consejo_comunal ? this.escapeHtml(n.consejo_comunal) : ''}</div>
          </td>
          <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${this.escapeHtml(desc)}">${this.escapeHtml(desc)}</td>
          <td style="white-space:nowrap; font-size:.8rem;">${fecha}</td>
          <td>${estadoPill}</td>
          <td class="td-accion">
            <div class="v-inline-actions">
              <button class="v-btn-sm v-btn-ver" onclick="window.notif.abrirDetalle(${n.id})" title="Ver detalles">
                <i class="fas fa-eye"></i> Ver
              </button>
              ${!isVocero && estado === 'pendiente' ? `
                <button class="v-btn-sm v-btn-aprobar" onclick="window.notif.aprobarUno(${n.id})" title="Aprobar">
                  <i class="fas fa-check"></i>
                </button>
                <button class="v-btn-sm v-btn-rechazar" onclick="window.notif.rechazarUno(${n.id})" title="Rechazar">
                  <i class="fas fa-times"></i>
                </button>
              ` : ''}
              ${isVocero && estado === 'pendiente' ? `
                <button class="v-btn-sm v-btn-rechazar" onclick="window.notif.cancelarSolicitud(${n.id})" title="Cancelar solicitud">
                  <i class="fas fa-ban"></i> Cancelar
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.renderPaginacion(lista.length);
    this.bindCheckboxEvents();
  }

  /* ─── Paginación ────────────────────────────────────────────────────────── */
  renderPaginacion(total) {
    const el = document.getElementById('paginadorValidaciones');
    if (!el) return;
    const totalPags = Math.ceil(total / this.porPagina);
    if (totalPags <= 1) { el.innerHTML = ''; return; }

    // Calcular páginas visibles: siempre primera, última y ±2 alrededor de la actual
    const visible = new Set([1, totalPags]);
    for (let i = Math.max(1, this.paginaActual - 2); i <= Math.min(totalPags, this.paginaActual + 2); i++) {
      visible.add(i);
    }
    const sorted = [...visible].sort((a, b) => a - b);

    let html = '<div class="paginador-wrap">';
    // Botón anterior
    if (this.paginaActual > 1) {
      html += `<button class="paginador-btn" onclick="window.notif.irPagina(${this.paginaActual - 1})"><i class="fas fa-chevron-left"></i></button>`;
    }
    let prev = 0;
    for (const p of sorted) {
      if (prev && p - prev > 1) html += '<span class="paginador-dots">...</span>';
      html += `<button class="paginador-btn${p === this.paginaActual ? ' active' : ''}" onclick="window.notif.irPagina(${p})">${p}</button>`;
      prev = p;
    }
    // Botón siguiente
    if (this.paginaActual < totalPags) {
      html += `<button class="paginador-btn" onclick="window.notif.irPagina(${this.paginaActual + 1})"><i class="fas fa-chevron-right"></i></button>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  irPagina(n) {
    this.paginaActual = n;
    this.renderTabla(this.filtradas);
  }

  /* â”€â”€â”€ Bind Eventos de Tabla â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  bindCheckboxEvents() {
    const checkAll = document.getElementById('checkAll');
    if (checkAll) {
      checkAll.onclick = (e) => {
        const checks = document.querySelectorAll('.row-check');
        checks.forEach(cb => {
          cb.checked = e.target.checked;
          const id = parseInt(cb.dataset.id, 10);
          if (e.target.checked) this.selected.add(id);
          else this.selected.delete(id);
          cb.closest('tr').classList.toggle('selected', e.target.checked);
        });
        this.actualizarBulkBar();
      };
    }

    document.querySelectorAll('.row-check').forEach(cb => {
      cb.onclick = (e) => {
        e.stopPropagation();
        const id = parseInt(cb.dataset.id, 10);
        if (cb.checked) this.selected.add(id);
        else this.selected.delete(id);
        cb.closest('tr').classList.toggle('selected', cb.checked);
        this.actualizarBulkBar();
        // Actualizar checkAll
        const checks = document.querySelectorAll('.row-check');
        const allChk = document.getElementById('checkAll');
        if (allChk) allChk.checked = [...checks].every(c => c.checked);
      };
    });

    // Click en fila â†’ abrir detalle
    document.querySelectorAll('#validacionesTbody tr').forEach(tr => {
      tr.addEventListener('click', (e) => {
        // No abrir si fue clic en un botÃ³n o checkbox
        if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) return;
        const id = parseInt(tr.dataset.id, 10);
        if (id) this.abrirDetalle(id);
      });
    });
  }

  /* â”€â”€â”€ Barra Masiva â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  actualizarBulkBar() {
    const bar = document.getElementById('bulkActionsBar');
    const countEl = document.getElementById('bulkCount');
    if (!bar) return;
    const n = this.selected.size;
    if (countEl) countEl.textContent = n;
    bar.classList.toggle('visible', n > 0);
  }

  /* â”€â”€â”€ Modal Detalle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  abrirDetalle(id) {
    this.detailId = id;
    const n = this.todas.find(x => x.id === id);
    if (!n) return;

    const body = document.getElementById('modalDetBody');
    const footer = document.getElementById('modalDetFooter');
    const title = document.getElementById('modalDetTitle');
    if (!body || !footer) return;

    const registro = n.datos_temporales || {};
    const estado = (n.estado || 'pendiente').toLowerCase();
    const isVocero = this.userRole === 'vocero';
    const solicitante = n.nombre_vocero || `Vocero #${n.id_vocero}`;

    if (title) title.innerHTML = `<i class="fas fa-file-lines"></i> ${this.capitalize(n.tabla_afectada?.replace(/_/g, ' '))} â€” ${this.capitalize(n.tipo_accion || '')}`;

    // Construir filas de datos temporales
    let datosHtml = '';
    for (const [k, v] of Object.entries(registro)) {
      if (['id', 'createdAt', 'updatedAt'].includes(k)) continue;

      let displayValue = '—';
      if (v != null) {
        if (typeof v === 'object') {
          try {
            if (Array.isArray(v) && k === 'familiares') {
              displayValue = v.map((fam, i) => {
                let nombre = fam.nombres || fam.datos_nuevos_habitante?.nombres || 'Sin nombre';
                let ci = fam.cedula || (fam.datos_nuevos_habitante ? fam.datos_nuevos_habitante.nacionalidad + '-' + fam.datos_nuevos_habitante.cedula : 'Sin cédula');
                let par = fam.parentesco || 'Familiar';
                return `- ${par}: ${nombre} (${ci})`;
              }).join('\n');
            } else if (Array.isArray(v) && k === 'opciones') {
              displayValue = v.map(o => `- ${this.capitalize(o.categoria)}: ${o.valor} ${o.cantidad && o.cantidad > 1 ? '(' + o.cantidad + ')' : ''}`).join('\n');
            } else {
              displayValue = JSON.stringify(v, null, 2);
            }
          } catch (e) {
            displayValue = String(v);
          }
        } else {
          displayValue = String(v);
        }
      }

      datosHtml += `
        <div class="det-meta-item" ${typeof v === 'object' && v != null ? 'style="grid-column: 1 / -1;"' : ''}>
          <div class="det-meta-key">${this.capitalize(k.replace(/_/g, ' '))}</div>
          <div class="det-meta-value" style="${typeof v === 'object' ? 'white-space: pre-wrap; word-break: break-all;' : ''}">${this.escapeHtml(displayValue)}</div>
        </div>`;
    }

    body.innerHTML = `
      <!-- Info rÃ¡pida -->
      <div class="det-meta-grid">
        <div class="det-meta-item">
          <div class="det-meta-key">ID Solicitud</div>
          <div class="det-meta-value">#${n.id}</div>
        </div>
        <div class="det-meta-item">
          <div class="det-meta-key">Solicitante</div>
          <div class="det-meta-value">${this.escapeHtml(solicitante)}</div>
        </div>
        <div class="det-meta-item">
          <div class="det-meta-key">Tabla Afectada</div>
          <div class="det-meta-value">${this.escapeHtml(n.tabla_afectada || 'â€”')}</div>
        </div>
        <div class="det-meta-item">
          <div class="det-meta-key">Tipo AcciÃ³n</div>
          <div class="det-meta-value">${this.escapeHtml(n.tipo_accion || 'CREATE')}</div>
        </div>
        <div class="det-meta-item">
          <div class="det-meta-key">Fecha</div>
          <div class="det-meta-value">${this.formatDate(n.fecha_solicitud)}</div>
        </div>
        <div class="det-meta-item">
          <div class="det-meta-key">Estado</div>
          <div class="det-meta-value">${this.getEstadoPill(estado)}</div>
        </div>
      </div>

      <!-- Datos proporcionados -->
      <div class="det-data-group">
        <h4><i class="fas fa-database"></i> Datos de la Solicitud</h4>
        ${n.tabla_afectada === 'recuperacion_clave' ? `
          <div style="background: rgba(46, 125, 50, 0.1); border: 2px dashed #2E7D32; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1rem;">
            <p style="margin: 0; font-size: 0.9rem; color: #1B5E20; font-weight: 600;">CÃ“DIGO DE VERIFICACIÃ“N GENERADO</p>
            <h2 style="margin: 0.5rem 0 0 0; font-size: 2.5rem; color: #2E7D32; letter-spacing: 5px;">${registro.codigo}</h2>
          </div>
        ` : ''}
        <div class="det-data-grid">
          ${datosHtml || '<span style="color:var(--muted); font-size:.85rem;">Sin datos adicionales.</span>'}
        </div>
      </div>

      ${n.comentarios ? `
        <div class="det-data-group" style="background:rgba(21,101,192,.05);border-color:rgba(21,101,192,.15);">
          <h4 style="color:var(--az);"><i class="fas fa-comment-dots"></i> Comentarios</h4>
          <p style="font-size:.9rem;color:var(--txt);">${this.escapeHtml(n.comentarios)}</p>
        </div>
      ` : ''}
    `;

    // Footer: botones de acciÃ³n (solo admin y si estÃ¡ pendiente)
    footer.innerHTML = `
      <button class="btn-sicag" style="background:var(--bg);color:var(--sub);border:1px solid var(--border);" id="btnCloseDetalle2">
        <i class="fas fa-xmark"></i> Cerrar
      </button>
      ${!isVocero && estado === 'pendiente' ? `
        <button class="btn-sicag btn-danger" onclick="window.notif.rechazarUno(${n.id}); window.notif.cerrarDetalle();">
          <i class="fas fa-times"></i> Rechazar
        </button>
        <button class="btn-sicag btn-primary" onclick="window.notif.aprobarUno(${n.id}); window.notif.cerrarDetalle();">
          <i class="fas fa-check"></i> Aprobar Solicitud
        </button>
      ` : ''}
    `;

    document.getElementById('btnCloseDetalle2')?.addEventListener('click', () => this.cerrarDetalle());
    document.getElementById('modalDetalle').classList.add('show');
  }

  cerrarDetalle() {
    const m = document.getElementById('modalDetalle');
    if (m) m.classList.remove('show');
    this.detailId = null;
  }

  /* â”€â”€â”€ Acciones individuales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  async aprobarUno(id) {
    try {
      await window.api.aprobarNotificacion(id, 'Aprobado por el administrador.');
      Components.showToast('âœ… Solicitud aprobada correctamente.', 'success');
      this.selected.delete(id);
      await this.cargarDatos();
    } catch (e) {
      Components.showToast('Error al aprobar: ' + e.message, 'error');
    }
  }

  async rechazarUno(id) {
    Components.confirmDialog('¿Está seguro de rechazar esta solicitud?', async () => {
      try {
        const n = this.todas.find(x => x.id === id);
        if (n && n.tabla_afectada === 'proyectos' && n.datos_temporales?.imagen_portada) {
          const { eliminarImagenFirebase } = await import('./js/config/firebase-config.js');
          await eliminarImagenFirebase(n.datos_temporales.imagen_portada);
        }
        await window.api.rechazarNotificacion(id, 'Rechazado por el administrador.');
        Components.showToast('Solicitud rechazada.', 'info');
        this.selected.delete(id);
        await this.cargarDatos();
      } catch (e) {
        Components.showToast('Error al rechazar: ' + e.message, 'error');
      }
    });
  }

  async cancelarSolicitud(id) {
    Components.confirmDialog(
      '¿Deseas cancelar esta solicitud? Esta acción no se puede deshacer.',
      async () => {
        try {
          const n = this.todas.find(x => x.id === id);
          if (n && n.tabla_afectada === 'proyectos' && n.datos_temporales?.imagen_portada) {
            const { eliminarImagenFirebase } = await import('./js/config/firebase-config.js');
            await eliminarImagenFirebase(n.datos_temporales.imagen_portada);
          }
          await window.api.rechazarNotificacion(id, 'Cancelado por el solicitante.');
          Components.showToast('Solicitud cancelada.', 'info');
          await this.cargarDatos();
        } catch (e) {
          Components.showToast('Error: ' + e.message, 'error');
        }
      }
    );
  }

  /* â”€â”€â”€ Acciones masivas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  confirmarAccionMasiva(accion) {
    const n = this.selected.size;
    if (n === 0) return;

    this.pendingBulkAction = accion;
    const isApprove = accion === 'approve';

    const icon = document.getElementById('confirmIcon');
    const title = document.getElementById('modalConfTitle');
    const msg = document.getElementById('modalConfMsg');
    const btnOk = document.getElementById('btnConfirmOk');
    const btnLabel = document.getElementById('confirmBtnLabel');

    if (icon) icon.textContent = isApprove ? 'âœ…' : 'âŒ';
    if (title) title.textContent = isApprove ? 'Aprobar en Lote' : 'Rechazar en Lote';
    if (msg) msg.textContent = `EstÃ¡s a punto de ${isApprove ? 'aprobar' : 'rechazar'} ${n} solicitud${n !== 1 ? 'es' : ''} seleccionada${n !== 1 ? 's' : ''}. Esta acciÃ³n afectarÃ¡ directamente la base de datos.`;
    if (btnOk) {
      btnOk.className = `btn-sicag ${isApprove ? 'btn-primary' : 'btn-danger'}`;
    }
    if (btnLabel) btnLabel.textContent = isApprove ? `Aprobar ${n}` : `Rechazar ${n}`;

    document.getElementById('modalConfirm').classList.add('show');
  }

  async ejecutarAccionMasiva() {
    const accion = this.pendingBulkAction;
    if (!accion || this.selected.size === 0) return;

    document.getElementById('modalConfirm').classList.remove('show');

    const ids = [...this.selected];
    const isApprove = accion === 'approve';

    const isVocero = this.userRole === 'vocero';

    let ok = 0, err = 0;
    for (const id of ids) {
      try {
        const n = this.todas.find(x => x.id === id);
        if (isApprove && !isVocero) {
          await window.api.aprobarNotificacion(id, 'Aprobado en lote por el administrador.');
        } else {
          if (n && n.tabla_afectada === 'proyectos' && n.datos_temporales?.imagen_portada) {
            const { eliminarImagenFirebase } = await import('./js/config/firebase-config.js');
            await eliminarImagenFirebase(n.datos_temporales.imagen_portada);
          }
          const motivo = isVocero ? 'Cancelado en lote por el solicitante.' : 'Rechazado en lote por el administrador.';
          await window.api.rechazarNotificacion(id, motivo);
        }
        ok++;
      } catch (e) {
        err++;
      }
    }

    this.selected.clear();
    this.actualizarBulkBar();
    await this.cargarDatos();

    if (err === 0) {
      Components.showToast(`âœ… ${ok} solicitud${ok !== 1 ? 'es' : ''} ${isApprove ? 'aprobada' : 'rechazada'}${ok !== 1 ? 's' : ''} correctamente.`, 'success');
    } else {
      Components.showToast(`${ok} procesada${ok !== 1 ? 's' : ''}, ${err} con error.`, 'warning');
    }
  }

  /* â”€â”€â”€ Bind eventos globales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  bindUIEvents() {
    // BotÃ³n Actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', async () => {
      await this.cargarDatos();
      Components.showToast('Bandeja actualizada.', 'success');
    });

    // Cerrar modal detalle
    document.getElementById('btnCloseDetalle')?.addEventListener('click', () => this.cerrarDetalle());
    document.getElementById('modalDetalle')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.cerrarDetalle();
    });

    // Cerrar modal confirmaciÃ³n
    document.getElementById('btnConfirmCancel')?.addEventListener('click', () => {
      document.getElementById('modalConfirm').classList.remove('show');
    });
    document.getElementById('btnConfirmOk')?.addEventListener('click', () => this.ejecutarAccionMasiva());

    // Botones de la barra masiva
    document.getElementById('btnBulkApprove')?.addEventListener('click', () => {
      this.confirmarAccionMasiva('approve');
    });
    document.getElementById('btnBulkReject')?.addEventListener('click', () => {
      this.confirmarAccionMasiva('reject');
    });
    document.getElementById('btnBulkClear')?.addEventListener('click', () => {
      this.selected.clear();
      document.querySelectorAll('.row-check').forEach(cb => cb.checked = false);
      document.querySelectorAll('#validacionesTbody tr').forEach(tr => tr.classList.remove('selected'));
      const checkAll = document.getElementById('checkAll');
      if (checkAll) checkAll.checked = false;
      this.actualizarBulkBar();
    });

    // Filtros
    ['filterTipo', 'filterEstado', 'filterSearch'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.aplicarFiltros());
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cerrarDetalle();
        document.getElementById('modalConfirm')?.classList.remove('show');
      }
    });
  }

  /* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  getDescripcion(n) {
    const d = n.datos_temporales || {};
    if (n.tabla_afectada === 'recuperacion_clave') return `RecuperaciÃ³n de clave: ${d.correo_usuario}`;
    if (n.tabla_afectada === 'contacto') return `Contacto de: ${d.nombre}`;
    if (n.tabla_afectada === 'estudios_demograficos') {
      const cedula = d.encuestado_cedula || d.cedula_jefe || '';
      const comunidad = d.nombre_comunidad || d.sector || '';
      return `Censo de vivienda${cedula ? ': C.I. ' + cedula : ''}${comunidad ? ' — ' + comunidad : ''}`;
    }
    if (d.nombres) return `Habitante: ${d.nombres} ${d.apellidos || ''}`.trim();
    if (d.titulo) return `Noticia: ${d.titulo}`;
    if (d.nombre_proyecto) return `Proyecto: ${d.nombre_proyecto}`;
    if (d.nombre) return `OrganizaciÃ³n: ${d.nombre}`;
    if (d.nuevo_correo) return `Cambio de correo â†’ ${d.nuevo_correo}`;
    if (d.cultivo) return `Cultivo: ${d.cultivo}`;
    return `Tabla: ${n.tabla_afectada || 'â€”'}`;
  }

  getTipoBadge(tabla) {
    const map = {
      'habitantes': ['habitante', 'person'],
      'usuarios': ['usuario', 'user-shield'],
      'noticias': ['noticia', 'newspaper'],
      'proyectos': ['proyecto', 'seedling'],
      'organizaciones': ['organizaciÃ³n', 'hands-holding-circle'],
      'produccion_agricola': ['producciÃ³n', 'tractor'],
      'recuperacion_clave': ['recuperaciÃ³n', 'key'],
      'contacto': ['contacto', 'envelope'],
      'estudios_demograficos': ['censo vivienda', 'house-chimney-user']
    };
    const t = (tabla || '').toLowerCase();
    for (const [key, [label, icon]] of Object.entries(map)) {
      if (t.includes(key)) {
        return `<span class="v-tipo-badge v-tipo-${key.replace('_', '').replace('produccion_agricola', 'produccion')}">
          <i class="fas fa-${icon}"></i> ${label}
        </span>`;
      }
    }
    return `<span class="v-tipo-badge v-tipo-otro"><i class="fas fa-file"></i> ${this.escapeHtml(tabla || 'â€”')}</span>`;
  }

  getEstadoPill(estado) {
    const map = {
      'pendiente': ['status-pendiente', 'Pendiente', 'clock'],
      'aceptado': ['status-aceptado', 'Aprobado', 'check-circle'],
      'rechazado': ['status-rechazado', 'Rechazado', 'times-circle'],
      'reenvio': ['status-reenvio', 'En revisiÃ³n', 'redo']
    };
    const [cls, label, icon] = map[estado] || map['pendiente'];
    return `<span class="status-pill ${cls}"><i class="fas fa-${icon}"></i> ${label}</span>`;
  }

  capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  formatDate(value) {
    if (!value) return 'Sin fecha';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.notif = new NotificacionesController();
// Compatibilidad hacia atrÃ¡s
window.notificaciones = window.notif;

class NotificacionesController {
  constructor() {
    this.notificaciones = [];
    this.activeId = null;
    this.editMode = false;
    this.init();
  }

  async init() {
    await this.loadNotificaciones();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.render());
    } else {
      this.render();
    }
  }

  async loadNotificaciones() {
    this.notificaciones = await window.api.getNotificaciones();
    if (!this.activeId && this.notificaciones.length > 0) {
      this.activeId = this.notificaciones[0].id;
    }
  }

  async refresh() {
    await this.loadNotificaciones();
    this.render();
  }

  render() {
    this.renderCount();
    this.renderStats();
    this.renderList();
    this.renderDetail();
  }

  renderCount() {
    const count = this.notificaciones.length; // En pendientes todos son pendientes
    const badge = document.getElementById('notificationCount');
    if (!badge) return;
    badge.textContent = `${count} pendiente${count === 1 ? '' : 's'}`;
  }

  renderStats() {
    const stats = this.getSummaryStats();
    const container = document.getElementById('notificationStats');
    if (!container) return;

    container.innerHTML = stats.map(stat => `
      <div class="kpi-card border-${stat.color}">
        <div>
          <div class="kpi-info"><h3>${stat.label}</h3></div>
          <div class="kpi-value">${stat.value}</div>
          <div class="kpi-trend ${stat.trendClass}">${stat.subtitle}</div>
        </div>
      </div>
    `).join('');
  }

  getSummaryStats() {
    const total = this.notificaciones.length;
    return [
      { label: 'Solicitudes en cola', value: total, subtitle: 'Pendientes por revisión', color: 'azul', trendClass: 'up' },
      { label: 'Acción requerida', value: total, subtitle: 'Aprobar o rechazar', color: 'amarillo', trendClass: total > 0 ? 'down' : 'up' }
    ];
  }

  renderList() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (this.notificaciones.length === 0) {
      list.innerHTML = '<div class="notification-empty">No hay solicitudes en revisión.</div>';
      return;
    }

    this.notificaciones.sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
    list.innerHTML = this.notificaciones.map(n => {
      const isActive = n.id === this.activeId;
      const titulo = `Registro en ${this.capitalize(n.tabla_afectada.replace('_', ' '))}`;
      let subtitulo = `Acción: ${n.tipo_accion}`;
      
      // Intentar extraer algún dato identificativo del JSON
      if (n.datos_temporales) {
        if (n.datos_temporales.nombres) subtitulo = `Habitante: ${n.datos_temporales.nombres} ${n.datos_temporales.apellidos}`;
        if (n.datos_temporales.titulo) subtitulo = `Noticia: ${n.datos_temporales.titulo}`;
        if (n.datos_temporales.nombre_proyecto) subtitulo = `Proyecto: ${n.datos_temporales.nombre_proyecto}`;
        if (n.datos_temporales.nombre) subtitulo = `Organización: ${n.datos_temporales.nombre}`;
        if (n.tabla_afectada === 'usuarios' && n.datos_temporales.nuevo_correo) subtitulo = `Solicitud de Cambio de Correo (${n.datos_temporales.nuevo_correo})`;
      }

      return `
        <article class="notification-card ${isActive ? 'active' : ''}" onclick="window.notificaciones.selectNotification(${n.id})">
          <div class="notification-card-title">
            <div>
              <strong>${this.escapeHtml(titulo)}</strong>
              <div class="notification-card-subtitle">${this.escapeHtml(subtitulo)}</div>
            </div>
            <span class="badge-sicag badge-pendiente">Pendiente</span>
          </div>
          <div class="notification-card-meta">
            <span><i class="fas fa-clock"></i> ${this.formatDate(n.fecha_solicitud)}</span>
            <span><i class="fas fa-database"></i> ${this.escapeHtml(n.tabla_afectada)}</span>
          </div>
        </article>
      `;
    }).join('');
  }

  renderDetail() {
    const detail = document.getElementById('notificationDetail');
    const statusBadge = document.getElementById('detailStatus');
    if (!detail) return;

    const notification = this.notificaciones.find(n => n.id === this.activeId);
    if (!notification) {
      detail.innerHTML = '<div class="notification-empty">Selecciona una notificación para ver los detalles.</div>';
      if (statusBadge) statusBadge.textContent = 'Sin selección';
      return;
    }

    if (statusBadge) {
      statusBadge.textContent = 'Pendiente';
      statusBadge.className = `badge-sicag badge-pendiente`;
    }

    const registro = notification.datos_temporales || {};
    let detallesHtml = '';
    
    // Renderizar todas las claves del JSON de forma genérica
    for (const [key, value] of Object.entries(registro)) {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        detallesHtml += this.renderDetailRow(this.capitalize(key.replace(/_/g, ' ')), value);
      }
    }

    detail.innerHTML = `
      <div class="notification-detail-card">
        <div class="notification-detail-header">
          <div>
            <h2>Solicitud de ${notification.tipo_accion}</h2>
            <p>Tabla afectada: <strong>${notification.tabla_afectada}</strong></p>
          </div>
          <span class="status-pill status-pendiente">Pendiente</span>
        </div>

        <div class="notification-detail-top">
          <div class="notification-detail-top-item">
            <strong>ID Vocero</strong>
            <span>${notification.id_vocero}</span>
          </div>
          <div class="notification-detail-top-item">
            <strong>Fecha de solicitud</strong>
            <span>${this.formatDate(notification.fecha_solicitud)}</span>
          </div>
        </div>

        <div class="notification-detail-group">
          <h3>Datos Proporcionados</h3>
          <div class="notification-detail-grid">
            ${detallesHtml}
          </div>
        </div>

        <div class="detail-actions" style="margin-top: 1.5rem;">
          <button class="btn-sicag btn-primary" onclick="window.notificaciones.acceptNotification(${notification.id})"><i class="fas fa-check"></i> Aprobar Solicitud</button>
          <button class="btn-sicag btn-danger" onclick="window.notificaciones.rejectNotification(${notification.id})"><i class="fas fa-times"></i> Rechazar Solicitud</button>
        </div>
      </div>
    `;
  }

  renderHabitanteFields(registro) {
    return `
      <div class="notification-field"><label>Cédula</label><input type="text" name="cedula" value="${this.escapeHtml(registro.cedula || '')}" required></div>
      <div class="notification-field"><label>Nombre</label><input type="text" name="nombre" value="${this.escapeHtml(registro.nombre || '')}" required></div>
      <div class="notification-field"><label>Apellido</label><input type="text" name="apellido" value="${this.escapeHtml(registro.apellido || '')}" required></div>
      <div class="notification-field"><label>Edad</label><input type="number" name="edad" value="${this.escapeHtml(registro.edad || '')}" min="0"></div>
      <div class="notification-field"><label>Género</label><select name="genero">
          <option value="M" ${registro.genero === 'M' ? 'selected' : ''}>M</option>
          <option value="F" ${registro.genero === 'F' ? 'selected' : ''}>F</option>
          <option value="O" ${registro.genero === 'O' ? 'selected' : ''}>Otro</option>
        </select></div>
      <div class="notification-field"><label>Consejo Comunal</label><input type="text" name="consejoComunal" value="${this.escapeHtml(registro.consejoComunal || '')}"></div>
      <div class="notification-field"><label>Clasificación</label><select name="clasificacion">
          <option value="adulto" ${registro.clasificacion === 'adulto' ? 'selected' : ''}>Adulto</option>
          <option value="adulto_mayor" ${registro.clasificacion === 'adulto_mayor' ? 'selected' : ''}>Adulto Mayor</option>
          <option value="niño" ${registro.clasificacion === 'niño' ? 'selected' : ''}>Niño</option>
        </select></div>
      <div class="notification-field"><label>Elector</label><select name="elector">
          <option value="true" ${registro.elector ? 'selected' : ''}>Sí</option>
          <option value="false" ${!registro.elector ? 'selected' : ''}>No</option>
        </select></div>
      <div class="notification-field"><label>Teléfono</label><input type="text" name="telefono" value="${this.escapeHtml(registro.telefono || '')}"></div>
      <div class="notification-field"><label>Dirección</label><textarea name="direccion">${this.escapeHtml(registro.direccion || '')}</textarea></div>
    `;
  }

  editNotification(id) {
    this.editMode = true;
    this.activeId = id;
    this.render();
    const form = document.getElementById('notificationEditForm');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  cancelEdit() {
    this.editMode = false;
    this.render();
  }

  async saveNotification(id) {
    const form = document.getElementById('notificationEditForm');
    if (!form) return;

    const formData = new FormData(form);
    const updatedHabitante = {
      cedula: formData.get('cedula')?.toString().trim(),
      nombre: formData.get('nombre')?.toString().trim(),
      apellido: formData.get('apellido')?.toString().trim(),
      edad: parseInt(formData.get('edad')?.toString() || '0', 10) || 0,
      genero: formData.get('genero')?.toString(),
      consejoComunal: formData.get('consejoComunal')?.toString().trim(),
      clasificacion: formData.get('clasificacion')?.toString(),
      elector: formData.get('elector')?.toString() === 'true',
      telefono: formData.get('telefono')?.toString().trim(),
      direccion: formData.get('direccion')?.toString().trim()
    };

    await window.api.actualizarNotificacion(id, {
      datosHabitante: updatedHabitante,
      mensaje: 'El administrador actualizó los datos antes de aceptar o enviar para corrección.',
      nota: 'Datos revisados y ajustados por administrador.'
    });

    this.editMode = false;
    await this.refresh();
    Components.showToast('Datos guardados. Ya puedes aceptar o reenviar la solicitud.', 'success');
  }

  async acceptNotification(id) {
    try {
      await window.api.aprobarNotificacion(id, 'Aprobado por el administrador general');
      Components.showToast('Solicitud aprobada y registrada en el sistema.', 'success');
      this.activeId = null;
      await this.refresh();
    } catch (e) {
      Components.showToast('Error al aprobar: ' + e.message, 'error');
    }
  }

  async rejectNotification(id) {
    const motivo = prompt('Por favor ingrese el motivo del rechazo:');
    if (!motivo) return;

    try {
      await window.api.rechazarNotificacion(id, motivo);
      Components.showToast('Solicitud rechazada.', 'success');
      this.activeId = null;
      await this.refresh();
    } catch (e) {
      Components.showToast('Error al rechazar: ' + e.message, 'error');
    }
  }

  selectNotification(id) {
    if (this.activeId === id && this.editMode) {
      this.editMode = false;
    }
    this.activeId = id;
    this.render();
  }

  getStatusBadgeClass(status) {
    switch (status) {
      case 'aceptado': return 'badge-activo';
      case 'reenvio': return 'badge-desarrollo';
      case 'rechazado': return 'badge-finalizado';
      default: return 'badge-pendiente';
    }
  }

  capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  renderDetailRow(label, value) {
    return `
      <div class="detail-info-item">
        <span class="detail-info-key">${label}</span>
        <span class="detail-info-value">${this.escapeHtml(value || 'No especificado')}</span>
      </div>
    `;
  }

  formatClasificacion(value) {
    if (!value) return 'No definido';
    const map = { adulto: 'Adulto', adulto_mayor: 'Adulto Mayor', niño: 'Niño' };
    return map[value] || value;
  }

  formatDate(value) {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return this.escapeHtml(value);
    return date.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return value.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.notificaciones = new NotificacionesController();

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
    const count = this.notificaciones.filter(n => n.status === 'pendiente').length;
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
    const pendientes = this.notificaciones.filter(n => n.status === 'pendiente').length;
    const aceptados = this.notificaciones.filter(n => n.status === 'aceptado').length;
    const reenvios = this.notificaciones.filter(n => n.status === 'reenvio').length;

    return [
      { label: 'Solicitudes totales', value: total, subtitle: 'Todas las entradas recientes', color: 'azul', trendClass: 'up' },
      { label: 'Pendientes', value: pendientes, subtitle: 'Requieren tu revisión', color: 'amarillo', trendClass: pendientes > 0 ? 'down' : 'up' },
      { label: 'Devoluciones', value: reenvios, subtitle: 'Solicitudes reenviadas', color: 'rojo', trendClass: reenvios > 0 ? 'down' : 'up' }
    ];
  }

  renderList() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (this.notificaciones.length === 0) {
      list.innerHTML = '<div class="notification-empty">No hay solicitudes en revisión.</div>';
      return;
    }

    this.notificaciones.sort((a, b) => new Date(b.createdAt || b.fechaSolicitud) - new Date(a.createdAt || a.fechaSolicitud));
    list.innerHTML = this.notificaciones.map(n => {
      const registro = n.datosHabitante || {};
      const isActive = n.id === this.activeId;
      return `
        <article class="notification-card ${isActive ? 'active' : ''}" onclick="window.notificaciones.selectNotification(${n.id})">
          <div class="notification-card-title">
            <div>
              <strong>${this.escapeHtml(registro.nombre ? registro.nombre + ' ' + registro.apellido : n.titulo)}</strong>
              <div class="notification-card-subtitle">C.I. V-${this.escapeHtml(registro.cedula || '---')} · Añadido por ${this.escapeHtml(n.vocero || 'Vocero')}</div>
            </div>
            <span class="badge-sicag ${this.getStatusBadgeClass(n.status)}">${this.capitalize(n.status)}</span>
          </div>
          <div class="notification-card-meta">
            <span><i class="fas fa-user-tie"></i> ${this.escapeHtml(n.vocero || 'Vocero')}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(n.consejoComunal || 'Sin consejo')}</span>
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
      statusBadge.textContent = this.capitalize(notification.status);
      statusBadge.className = `badge-sicag ${this.getStatusBadgeClass(notification.status)}`;
    }

    const notas = notification.nota ? this.escapeHtml(notification.nota) : 'Sin observaciones.';
    const puedeEditar = notification.tipo === 'registro_habitante';
    const formDisabled = !this.editMode ? 'disabled' : '';
    const registro = notification.datosHabitante || {};

    detail.innerHTML = `
      <div class="notification-detail-card">
        <div class="notification-detail-header">
          <div>
            <h2>${this.escapeHtml(notification.titulo)}</h2>
            <p>${this.escapeHtml(notification.mensaje)}</p>
          </div>
          <span class="status-pill status-${notification.status}">${this.capitalize(notification.status)}</span>
        </div>

        <div class="notification-detail-top">
          <div class="notification-detail-top-item">
            <strong>Vocero</strong>
            <span>${this.escapeHtml(notification.vocero || 'Desconocido')}</span>
          </div>
          <div class="notification-detail-top-item">
            <strong>Consejo Comunal</strong>
            <span>${this.escapeHtml(notification.consejoComunal || 'Sin dato')}</span>
          </div>
          <div class="notification-detail-top-item">
            <strong>Fecha de solicitud</strong>
            <span>${this.formatDate(notification.fechaSolicitud || notification.createdAt)}</span>
          </div>
          <div class="notification-detail-top-item">
            <strong>Última nota</strong>
            <span>${notas}</span>
          </div>
        </div>

        ${puedeEditar ? `
          <form id="notificationEditForm" class="notification-form">
            <fieldset ${formDisabled}>
              ${this.renderHabitanteFields(registro)}
            </fieldset>
          </form>
        ` : ''}

        ${notification.tipo === 'registro_habitante' ? `
          <div class="notification-detail-group">
            <h3>Resumen del solicitante</h3>
            <div class="notification-detail-grid">
              ${this.renderDetailRow('Cédula', registro.cedula)}
              ${this.renderDetailRow('Nombre completo', `${registro.nombre || ''} ${registro.apellido || ''}`)}
              ${this.renderDetailRow('Edad', registro.edad ? `${registro.edad} años` : 'No definido')}
              ${this.renderDetailRow('Género', registro.genero || 'No definido')}
              ${this.renderDetailRow('Clasificación', this.formatClasificacion(registro.clasificacion))}
              ${this.renderDetailRow('Elector', registro.elector ? 'Sí' : 'No')}
              ${this.renderDetailRow('Teléfono', registro.telefono || 'N/A')}
              ${this.renderDetailRow('Dirección', registro.direccion || 'N/A')}
            </div>
          </div>
        ` : ''}

        <div class="detail-actions">
          ${this.editMode && puedeEditar ? `<button class="btn-sicag btn-primary" onclick="window.notificaciones.saveNotification(${notification.id})"><i class="fas fa-save"></i> Guardar cambios</button>
          <button class="btn-sicag btn-outline-verde" onclick="window.notificaciones.cancelEdit()"><i class="fas fa-times"></i> Cancelar</button>` : ''}

          ${!this.editMode && puedeEditar && notification.status !== 'aceptado' ? `<button class="btn-sicag btn-info" onclick="window.notificaciones.editNotification(${notification.id})"><i class="fas fa-edit"></i> Editar datos</button>` : ''}
          ${notification.status !== 'aceptado' ? `<button class="btn-sicag btn-primary" onclick="window.notificaciones.acceptNotification(${notification.id})"><i class="fas fa-check"></i> Aceptar registro</button>` : ''}
          ${notification.status !== 'rechazado' ? `<button class="btn-sicag btn-danger" onclick="window.notificaciones.rejectNotification(${notification.id})"><i class="fas fa-trash-alt"></i> Borrar registro</button>` : ''}
          ${notification.status !== 'aceptado' ? `<button class="btn-sicag btn-warning" onclick="window.notificaciones.resendNotification(${notification.id})"><i class="fas fa-undo"></i> Reenviar al vocero</button>` : ''}
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
    const notification = this.notificaciones.find(n => n.id === id);
    if (!notification) return;

    if (notification.tipo === 'registro_habitante') {
      await window.api.registrarHabitante(notification.datosHabitante);
    }

    await window.api.actualizarNotificacion(id, {
      status: 'aceptado',
      nota: 'Registro aceptado por administrador.'
    });

    await this.refresh();
    Components.showToast('Registro aceptado y agregado a la base de datos.', 'success');
  }

  async rejectNotification(id) {
    await window.api.actualizarNotificacion(id, {
      status: 'rechazado',
      nota: 'Registro rechazado por el administrador.'
    });

    await this.refresh();
    Components.showToast('Solicitud rechazada y marcada como no permitida.', 'error');
  }

  async resendNotification(id) {
    await window.api.actualizarNotificacion(id, {
      status: 'reenvio',
      nota: 'El administrador devolvió la solicitud al vocero para corrección.'
    });

    await this.refresh();
    Components.showToast('Solicitud enviada al vocero para corrección.', 'info');
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

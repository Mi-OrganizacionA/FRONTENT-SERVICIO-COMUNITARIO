/**
 * js/voceros.js — SICAG v3.1
 * Módulo completo de gestión de voceros (solo accesible para administradores).
 * Soporta: listar, crear, editar y eliminar voceros.
 * Respeta el flujo de validación mediante _interceptarValidacion.
 */
(() => {
  // ─────────────────────────────────────────
  // Estado interno del módulo
  // ─────────────────────────────────────────
  let vocerosData = [];   // Caché local de la lista
  let esAdmin = false;    // Se determina tras cargar el usuario

  // ─────────────────────────────────────────
  // Referencias al DOM
  // ─────────────────────────────────────────
  const el = {
    tableBody:        document.getElementById('tablaVocerosBody'),
    phActions:        document.getElementById('phActions'),
    colAcciones:      document.getElementById('colAcciones'),
    emptyMsg:         document.getElementById('tbEmptyMsg'),

    // Estadísticas
    statTotal:        document.getElementById('statTotal'),
    statActivos:      document.getElementById('statActivos'),
    statInactivos:    document.getElementById('statInactivos'),
    statComunidades:  document.getElementById('statComunidades'),

    // Modal Agregar
    modalAgregar:     document.getElementById('modalAgregar'),
    btnAgregar:       document.getElementById('btnAgregarVocero'),
    closeAgregar:     document.getElementById('closeModalAgregar'),
    formAgregar:      document.getElementById('formAgregar'),
    inputCedula:      document.getElementById('inputCedula'),
    inputNombre:      document.getElementById('inputNombre'),
    inputHabId:       document.getElementById('inputHabitanteId'),
    inputEmail:       document.getElementById('inputEmail'),
    inputTelefono:    document.getElementById('inputTelefono'),
    inputPassword:    document.getElementById('inputPassword'),
    inputPassConfirm: document.getElementById('inputPasswordConfirm'),
    selComunidad:     document.getElementById('selComunidad'),
    confirmPass:      document.getElementById('confirmPass'),

    // Modal Editar
    modalEditar:      document.getElementById('modalEditar'),
    closeEditar:      document.getElementById('closeModalEditar'),
    formEditar:       document.getElementById('formEditar'),
    editId:           document.getElementById('editId'),
    editNombre:       document.getElementById('editNombre'),
    editCedula:       document.getElementById('editCedula'),
    editEmail:        document.getElementById('editEmail'),
    editTelefono:     document.getElementById('editTelefono'),
    editPassword:     document.getElementById('editNuevaPassword'),
    editComunidad:    document.getElementById('editComunidad'),
    editEstado:       document.getElementById('editEstado'),
    editConfirmPass:  document.getElementById('editConfirmPass'),
  };

  // ─────────────────────────────────────────
  // Helpers de API
  // ─────────────────────────────────────────
  const getVoceros = async () => {
    try {
      if (window.api) return await window.api.getVoceros();
      return [];
    } catch (e) {
      console.error('Error obteniendo voceros:', e);
      return [];
    }
  };

  const verificarContraseñaAdmin = async (password) => {
    try {
      const baseURL = window.api?.baseURL || 'https://sicag-api.onrender.com/api';
      const token = window.auth?.getToken() || '';
      const res = await fetch(`${baseURL}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.success === true;
    } catch (e) {
      // Si no hay conexión o el endpoint no está disponible, confiar
      console.warn('No se pudo verificar contraseña admin:', e);
      return true; // En modo offline, permitir con advertencia
    }
  };

  const crearVoceroAPI = async (datos) => {
    // Usamos _interceptarValidacion — el admin crea directo, no pasa validación
    const baseURL = window.api?.baseURL || 'https://sicag-api.onrender.com/api';
    const token = window.auth?.getToken() || '';
    const res = await fetch(`${baseURL}/voceros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify(datos)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Error HTTP ${res.status}`);
    return body;
  };

  const editarVoceroAPI = async (id, datos) => {
    const baseURL = window.api?.baseURL || 'https://sicag-api.onrender.com/api';
    const token = window.auth?.getToken() || '';
    const res = await fetch(`${baseURL}/voceros/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify(datos)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Error HTTP ${res.status}`);
    return body;
  };

  const eliminarVoceroAPI = async (id) => {
    if (window.api) return await window.api.eliminarVocero(id);
    const baseURL = 'https://sicag-api.onrender.com/api';
    const token = window.auth?.getToken() || '';
    const res = await fetch(`${baseURL}/voceros/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return res.json().catch(() => ({ success: true }));
  };

  // ─────────────────────────────────────────
  // Iniciales para avatar
  // ─────────────────────────────────────────
  const iniciales = (nombre = '') => {
    const palabras = nombre.trim().split(' ').filter(Boolean);
    if (palabras.length === 0) return '?';
    if (palabras.length === 1) return palabras[0][0].toUpperCase();
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  };

  // ─────────────────────────────────────────
  // Estadísticas
  // ─────────────────────────────────────────
  const actualizarEstadisticas = (lista) => {
    const total = lista.length;
    const activos = lista.filter(v => v.activo !== false && v.estado !== 'inactivo').length;
    const inactivos = total - activos;
    const comunidades = new Set(lista.map(v => v.consejoComunal || v.comunidad).filter(Boolean)).size;

    if (el.statTotal) el.statTotal.textContent = total;
    if (el.statActivos) el.statActivos.textContent = activos;
    if (el.statInactivos) el.statInactivos.textContent = inactivos;
    if (el.statComunidades) el.statComunidades.textContent = comunidades;
  };

  // ─────────────────────────────────────────
  // Renderizado de tabla
  // ─────────────────────────────────────────
  const renderTabla = async () => {
    if (!el.tableBody) return;
    el.tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted);">
      <i class="fas fa-spinner fa-spin"></i> Cargando voceros...</td></tr>`;

    vocerosData = await getVoceros();
    actualizarEstadisticas(vocerosData);

    el.tableBody.innerHTML = '';

    if (vocerosData.length === 0) {
      el.tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted);">
        <i class="fas fa-users-slash" style="font-size:1.5rem;display:block;margin-bottom:.5rem;"></i>
        No hay voceros registrados aún.</td></tr>`;
      return;
    }

    vocerosData.forEach(vocero => {
      const nombre = vocero.nombre || `${vocero.nombres || ''} ${vocero.apellidos || ''}`.trim() || 'Sin nombre';
      const cedula = vocero.cedula || vocero.nombre_usuario || '—';
      // Leer la comunidad desde la asociación Sequelize (consejo.nombre_comunidad) o campos directos
      const comunidad = vocero.consejo?.nombre_comunidad
        || vocero.consejoComunal
        || vocero.comunidad
        || '—';
      const email = vocero.email || '—';
      const telefono = vocero.telefono || '—';
      const activo = vocero.activo !== false && vocero.estado !== 'inactivo';
      const estado = activo
        ? `<span class="badge-activo"><i class="fas fa-circle"></i> Activo</span>`
        : `<span class="badge-inactivo"><i class="fas fa-circle"></i> Inactivo</span>`;

      const avatarColor = activo
        ? 'background:linear-gradient(135deg,#0D3311,#2E7D32);'
        : 'background:linear-gradient(135deg,#5D4037,#795548);';

      const accionesBtns = esAdmin ? `
        <div class="accion-btns">
          <button type="button" class="btn-sicag btn-secondary btn-sm" data-action="editar" data-id="${vocero.id}"
            title="Editar Vocero"><i class="fas fa-pen-to-square"></i></button>
          <button type="button" class="btn-sicag btn-danger btn-sm" data-action="eliminar" data-id="${vocero.id}"
            title="Eliminar Vocero"><i class="fas fa-trash"></i></button>
        </div>` : '—';

      const row = document.createElement('tr');
      row.dataset.vocero = vocero.id;
      row.dataset.nombre = nombre.toLowerCase();
      row.dataset.cedula = cedula.toLowerCase();
      row.dataset.comunidad = comunidad.toLowerCase();
      row.dataset.estado = activo ? 'activo' : 'inactivo';
      row.dataset.voceroObj = JSON.stringify(vocero);

      row.innerHTML = `
        <td><code>${cedula}</code></td>
        <td class="nombre-cell">
          <span class="vocero-avatar" style="${avatarColor}">${iniciales(nombre)}</span>
          ${nombre}
        </td>
        <td>${comunidad}</td>
        <td style="font-size:.82rem;color:var(--muted);">${email}</td>
        <td style="font-size:.82rem;">${telefono}</td>
        <td>${estado}</td>
        ${esAdmin ? `<td>${accionesBtns}</td>` : '<td style="display:none;"></td>'}
      `;
      el.tableBody.appendChild(row);
    });

    // Delegación de eventos en botones
    el.tableBody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const row = btn.closest('tr');
        const voceroObj = row ? JSON.parse(row.dataset.voceroObj || '{}') : null;
        if (action === 'editar') abrirModalEditar(voceroObj);
        if (action === 'eliminar') handleEliminar(id, voceroObj?.nombre || id);
      });
    });

    // Resaltar fila por URL
    applyUrlHighlight();
  };

  // ─────────────────────────────────────────
  // Modal Agregar
  // ─────────────────────────────────────────
  const abrirModalAgregar = () => {
    if (!el.modalAgregar) return;
    // Reset completo
    if (el.formAgregar) el.formAgregar.reset();
    const card = document.getElementById('habitanteCard');
    if (card) card.classList.remove('visible');
    if (el.inputNombre) el.inputNombre.value = '';
    if (el.inputHabId) el.inputHabId.value = '';

    el.modalAgregar.classList.add('show');
    el.modalAgregar.setAttribute('aria-hidden', 'false');
    if (el.inputCedula) el.inputCedula.focus();
  };

  const cerrarModalAgregar = () => {
    if (!el.modalAgregar) return;
    el.modalAgregar.classList.remove('show');
    el.modalAgregar.setAttribute('aria-hidden', 'true');
    if (el.formAgregar) el.formAgregar.reset();
    const card = document.getElementById('habitanteCard');
    if (card) card.classList.remove('visible');
    if (el.inputNombre) el.inputNombre.value = '';
    if (el.inputHabId) el.inputHabId.value = '';
  };

  // ─────────────────────────────────────────
  // Modal Editar
  // ─────────────────────────────────────────
  const abrirModalEditar = (vocero) => {
    if (!el.modalEditar || !vocero) return;

    const nombre = vocero.nombre || `${vocero.nombres || ''} ${vocero.apellidos || ''}`.trim();
    // Leer la comunidad desde la asociación Sequelize o campos directos
    const comunidad = vocero.consejo?.nombre_comunidad
      || vocero.consejoComunal
      || vocero.comunidad
      || '';
    const activo = vocero.activo !== false && vocero.estado !== 'inactivo';

    if (el.editId) el.editId.value = vocero.id;
    if (el.editNombre) el.editNombre.value = nombre;
    if (el.editCedula) el.editCedula.value = vocero.cedula || '';
    if (el.editEmail) el.editEmail.value = vocero.email || '';
    if (el.editTelefono) el.editTelefono.value = vocero.telefono || '';
    if (el.editPassword) el.editPassword.value = '';
    if (el.editConfirmPass) el.editConfirmPass.value = '';

    // Seleccionar comunidad
    if (el.editComunidad) {
      for (let i = 0; i < el.editComunidad.options.length; i++) {
        if (el.editComunidad.options[i].value === comunidad) {
          el.editComunidad.selectedIndex = i;
          break;
        }
      }
    }
    if (el.editEstado) el.editEstado.value = activo ? 'activo' : 'inactivo';

    el.modalEditar.classList.add('show');
    el.modalEditar.setAttribute('aria-hidden', 'false');
  };

  const cerrarModalEditar = () => {
    if (!el.modalEditar) return;
    el.modalEditar.classList.remove('show');
    el.modalEditar.setAttribute('aria-hidden', 'true');
    if (el.formEditar) el.formEditar.reset();
  };

  // ─────────────────────────────────────────
  // Submit: Crear Vocero
  // ─────────────────────────────────────────
  const handleCrear = async (e) => {
    e.preventDefault();

    const cedula    = el.inputCedula?.value.trim();
    const nombre    = el.inputNombre?.value.trim();
    const email     = el.inputEmail?.value.trim();
    const telefono  = el.inputTelefono?.value.trim();
    const password  = el.inputPassword?.value;
    const passConf  = el.inputPassConfirm?.value;
    const comunidad = el.selComunidad?.value;
    const adminPass = el.confirmPass?.value;

    // Validaciones
    if (!cedula || !habitanteId) {
      Components.showToast('Debes buscar y seleccionar un habitante válido mediante el botón de la lupa.', 'error');
      return el.inputCedula?.focus();
    }
    if (!nombre) {
      Components.showToast('No se encontró el nombre del habitante. Usa el buscador de cédula.', 'error');
      return el.inputCedula?.focus();
    }
    if (!email) {
      Components.showToast('El correo electrónico es obligatorio.', 'error');
      return el.inputEmail?.focus();
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Components.showToast('El correo electrónico no tiene un formato válido.', 'error');
      return el.inputEmail?.focus();
    }
    if (!password || password.length < 8) {
      Components.showToast('La contraseña debe tener al menos 8 caracteres.', 'error');
      return el.inputPassword?.focus();
    }
    if (password !== passConf) {
      Components.showToast('Las contraseñas no coinciden.', 'error');
      return el.inputPassConfirm?.focus();
    }
    if (!comunidad) {
      Components.showToast('Debes seleccionar el Consejo Comunal donde trabajará el vocero.', 'error');
      return el.selComunidad?.focus();
    }
    if (!adminPass) {
      Components.showToast('Debes ingresar tu contraseña de administrador para confirmar.', 'error');
      return el.confirmPass?.focus();
    }

    // Bloquear botón
    const btn = el.formAgregar?.querySelector('button[type="submit"]');
    const originalHTML = btn?.innerHTML || '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...'; }

    try {
      // Verificar contraseña de admin
      const esValida = await verificarContraseñaAdmin(adminPass);
      if (!esValida) {
        Components.showToast('Contraseña de administrador incorrecta.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
        return el.confirmPass?.focus();
      }

      // Crear vocero en el backend
      await crearVoceroAPI({
        cedula,
        nombre,
        email,
        telefono: telefono || null,
        password,
        comunidad,
        rol: 'vocero'
      });

      Components.showToast(`✅ Vocero "${nombre}" registrado correctamente.`, 'success', 4000);
      cerrarModalAgregar();
      renderTabla();
    } catch (err) {
      console.error('Error creando vocero:', err);
      const msg = err.message.includes('409') || err.message.toLowerCase().includes('dupli')
        ? 'Ya existe un usuario con esa cédula o correo.'
        : (err.message || 'Error al crear el vocero. Verifica la conexión.');
      Components.showToast(msg, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
    }
  };

  // ─────────────────────────────────────────
  // Submit: Editar Vocero
  // ─────────────────────────────────────────
  const handleEditar = async (e) => {
    e.preventDefault();

    const id         = el.editId?.value;
    const email      = el.editEmail?.value.trim();
    const telefono   = el.editTelefono?.value.trim();
    const password   = el.editPassword?.value;
    const comunidad  = el.editComunidad?.value;
    const estado     = el.editEstado?.value;
    const adminPass  = el.editConfirmPass?.value;

    if (!id) return;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Components.showToast('El correo electrónico no tiene un formato válido.', 'error');
      return el.editEmail?.focus();
    }
    if (password && password.length < 8) {
      Components.showToast('La nueva contraseña debe tener al menos 8 caracteres.', 'error');
      return el.editPassword?.focus();
    }
    if (!adminPass) {
      Components.showToast('Debes ingresar tu contraseña de administrador para confirmar cambios.', 'error');
      return el.editConfirmPass?.focus();
    }

    const btn = el.formEditar?.querySelector('button[type="submit"]');
    const originalHTML = btn?.innerHTML || '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; }

    try {
      const esValida = await verificarContraseñaAdmin(adminPass);
      if (!esValida) {
        Components.showToast('Contraseña de administrador incorrecta.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
        return el.editConfirmPass?.focus();
      }

      const cambios = {
        email: email || undefined,
        telefono: telefono || null,
        comunidad: comunidad || undefined,
        activo: estado === 'activo'
      };
      if (password) cambios.password = password;

      await editarVoceroAPI(id, cambios);

      Components.showToast('✅ Vocero actualizado correctamente.', 'success');
      cerrarModalEditar();
      renderTabla();
    } catch (err) {
      console.error('Error editando vocero:', err);
      Components.showToast(err.message || 'Error al actualizar el vocero.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
    }
  };

  // ─────────────────────────────────────────
  // Eliminar Vocero
  // ─────────────────────────────────────────
  const handleEliminar = (id, nombreVocero) => {
    Components.confirmDialog(
      `¿Estás seguro de que deseas revocar el acceso al vocero <strong>${nombreVocero}</strong>? Esta acción eliminará su cuenta del sistema.`,
      async () => {
        try {
          await eliminarVoceroAPI(id);
          Components.showToast(`Vocero "${nombreVocero}" eliminado correctamente.`, 'success');
          renderTabla();
        } catch (err) {
          console.error('Error eliminando vocero:', err);
          Components.showToast(err.message || 'Error al eliminar el vocero.', 'error');
        }
      }
    );
  };

  // ─────────────────────────────────────────
  // Cierre de modales al hacer click fuera
  // ─────────────────────────────────────────
  [el.modalAgregar, el.modalEditar].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal === el.modalAgregar) cerrarModalAgregar();
        if (modal === el.modalEditar) cerrarModalEditar();
      }
    });
  });

  // ─────────────────────────────────────────
  // Tecla Escape
  // ─────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    cerrarModalAgregar();
    cerrarModalEditar();
  });

  // ─────────────────────────────────────────
  // Resaltado desde búsqueda global
  // ─────────────────────────────────────────
  const applyUrlHighlight = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('viewVocero') || urlParams.get('highlightSection');
    if (!viewId) return;
    setTimeout(() => {
      const row = document.querySelector(`tr[data-vocero="${viewId}"]`) ||
                  [...document.querySelectorAll('#tablaVocerosBody tr')].find(r =>
                    r.textContent.toLowerCase().includes(viewId.toLowerCase()));
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.transition = 'background-color 0.5s ease';
        row.style.backgroundColor = 'rgba(255, 193, 7, 0.35)';
        setTimeout(() => row.style.backgroundColor = '', 3000);
      }
    }, 600);
  };

  // ─────────────────────────────────────────
  // Inicialización
  // ─────────────────────────────────────────
  const init = () => {
    // Determinar si es admin
    const user = window.auth?.getUser?.() || JSON.parse(sessionStorage.getItem('sicag_user') || '{}');
    esAdmin = user?.rol?.toLowerCase() === 'admin' || user?.rol?.toLowerCase() === 'administrador';

    // Mostrar/ocultar controles de admin
    if (esAdmin) {
      if (el.phActions) el.phActions.style.display = 'flex';
      if (el.colAcciones) el.colAcciones.style.display = '';
    }

    // Listeners
    if (el.btnAgregar) el.btnAgregar.addEventListener('click', abrirModalAgregar);
    if (el.closeAgregar) el.closeAgregar.addEventListener('click', cerrarModalAgregar);
    if (el.closeEditar) el.closeEditar.addEventListener('click', cerrarModalEditar);
    if (el.formAgregar) el.formAgregar.addEventListener('submit', handleCrear);
    if (el.formEditar) el.formEditar.addEventListener('submit', handleEditar);

    // Cargar tabla
    renderTabla();
  };

  // Esperar que auth esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Esperar un tick para que auth.js y api.js se inicialicen
    setTimeout(init, 100);
  }
})();

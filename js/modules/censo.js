/**
 * Modulo de Censo Comunitario (SICAG v2.5)
 * Archivo: js/modules/censo.js
 */

class CensoController {
  constructor() {
    this.habitantes = [];
    this.editingId = null;
    this.init();
  }

  async init() {
    try {
      this._setupUI();
      await this.cargarDatos();
    } catch (error) {
      console.error('Error inicializando Censo:', error);
      if (window.Components) Components.showToast('Error al cargar modulo de Censo', 'error');
    }
  }

  _setupUI() {
    const fechaNacInput = document.getElementById('habFechaNac');
    if (fechaNacInput) {
      const hoy = new Date().toISOString().split('T')[0];
      fechaNacInput.setAttribute('max', hoy);
      fechaNacInput.addEventListener('change', () => this.calcularDatosNacimiento(fechaNacInput.value));
    }

    const productorSelect = document.getElementById('habProductor');
    if (productorSelect) {
      productorSelect.addEventListener('change', () => this.toggleRubroProduccion());
    }

    window.censoCtrl = this;
  }

  async guardarHabitante(datos) {
    // Validar cédula duplicada antes de guardar (aplica para vocero y administrador)
    const cedulaNueva = (datos.cedula || '').trim();
    if (cedulaNueva) {
      try {
        const existentes = await window.api.getHabitantes({ cedula: cedulaNueva });
        const duplicado = Array.isArray(existentes) && existentes.some(h =>
          (h.cedula || '').trim().toUpperCase() === cedulaNueva.toUpperCase()
        );
        if (duplicado) {
          // Resaltar el campo de cédula con error visual
          const cedulaInput = document.getElementById('habCedula');
          if (cedulaInput) {
            cedulaInput.style.borderColor = '#C62828';
            cedulaInput.style.boxShadow = '0 0 0 3px rgba(198,40,40,.15)';
          }
          if (window.Components) {
            Components.showToast('Ya existe un habitante registrado con esa cédula.', 'error');
          }
          return; // Bloquear el guardado
        }
      } catch (err) {
        console.warn('No se pudo verificar cédulas duplicadas:', err.message);
        // Si falla la verificación, continuamos para no bloquear el flujo
      }
    }

    // Guardar el habitante si no hay duplicado
    try {
      await window.api.crearHabitante(datos);
      if (window.Components) Components.showToast('Habitante registrado correctamente', 'success');
      await this.cargarDatos();
    } catch (error) {
      console.error('Error guardando habitante:', error);
      if (window.Components) Components.showToast('Error al guardar el habitante', 'error');
    }
  }



  async cargarDatos() {
    try {
      const data = await window.api.getHabitantes();
      this.habitantes = data.map(h => {
         let age = h.edad ?? 0;
         if (!age && h.fecha_nacimiento) {
            const today = new Date();
            const fnac = new Date(h.fecha_nacimiento);
            age = today.getFullYear() - fnac.getFullYear();
            if (today.getMonth() < fnac.getMonth() || (today.getMonth() === fnac.getMonth() && today.getDate() < fnac.getDate())) age--;
         }
         return {
            ...h, // Conservar todos los campos del backend (direccion, ocupacion, etc)
            id: h.id,
            nombre: h.nombres,
            apellido: h.apellidos,
            cedula: h.cedula,
            edad: age,
            genero: h.genero,
            consejoComunal: h.consejo?.nombre_comunidad || 'No asignado',
            telefono: h.telefono,
            clasificacion: age >= 60 ? 'adulto_mayor' : age <= 11 ? 'niño' : 'adulto',
            elector: h.elector ?? age >= 18
         };
      });

      this.actualizarKpis();
      this.renderTabla();
    } catch (error) {
      console.error('Error cargando habitantes:', error);
      const tbody = document.getElementById('censoBody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#C62828;">Error cargando datos. Verifique que haya iniciado sesión.</td></tr>`;
      }
    }
  }

  actualizarKpis() {
     const total = this.habitantes.length;
     const electores = this.habitantes.filter(h => h.elector).length;
     
     const elTotal = document.getElementById('kpiHabitantes');
     const elElec = document.getElementById('kpiElectores');
     
     if (elTotal) elTotal.textContent = total;
     if (elElec) elElec.textContent = electores;
     
     const elCC = document.getElementById('kpiCC') || document.getElementById('kpiConsejos');
     if (elCC) elCC.textContent = 9;
  }

  renderTabla(highlightId = null) {
    const tbody = document.getElementById('censoBody');
    if (!tbody) return;

    // Obtener valores de los filtros
    const ccVal = document.getElementById('filterCC')?.value || '';
    const clasifVal = document.getElementById('filterClasif')?.value || '';
    const genVal = document.getElementById('filterGenero')?.value || '';
    const elecVal = document.getElementById('filterElector')?.value || '';
    const buscarVal = (document.getElementById('filterBuscar')?.value || '').toLowerCase();
    
    // Obtener el texto del CC para compararlo sin acentos
    let ccText = '';
    const selectCC = document.getElementById('filterCC');
    if (selectCC && selectCC.selectedIndex > 0) {
       ccText = selectCC.options[selectCC.selectedIndex].text.replace('C.C. ', '').toLowerCase();
    }

    const removeAccents = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const filtrados = this.habitantes.filter(h => {
      // Filtro Consejo Comunal
      if (ccText) {
         if (!removeAccents(h.consejoComunal).includes(removeAccents(ccText))) return false;
      }
      // Filtro Clasificacion
      if (clasifVal) {
        if (clasifVal === 'nino' && h.clasificacion !== 'niño') return false;
        if (clasifVal !== 'nino' && h.clasificacion !== clasifVal) return false;
      }
      // Filtro Genero
      if (genVal) {
        if (h.genero !== genVal) return false;
      }
      // Filtro Elector
      if (elecVal) {
        const isElec = h.elector ? 'si' : 'no';
        if (isElec !== elecVal) return false;
      }
      // Filtro Búsqueda (Cedula o nombre)
      if (buscarVal) {
        const term = removeAccents(buscarVal).toLowerCase();
        const termNum = term.replace(/\D/g, '');
        const name = removeAccents(`${h.nombres || h.nombre || ''} ${h.apellidos || h.apellido || ''}`).toLowerCase();
        const ci = String(h.cedula || '').toLowerCase();
        const ciNum = ci.replace(/\D/g, '');

        let matchName = name.includes(term);
        let matchCiNum = false;
        if (termNum.length > 0) {
           matchCiNum = ciNum.includes(termNum);
        }

        if (!matchName && !matchCiNum && !ci.includes(term)) return false;
      }
      return true;
    });

    // Actualizar conteo visible
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
      resultCount.innerHTML = `Mostrando <strong>${filtrados.length}</strong> de <strong>${this.habitantes.length}</strong> habitantes`;
    }

    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;">No se encontraron habitantes que coincidan con los filtros</td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map((h, idx) => {
      const isSC = h.cedula && String(h.cedula).startsWith('SC-');
      const cedLabel = isSC ? 'Sin Cédula (Menor)' : `V-${h.cedula}`;
      return `
      <tr data-hab-id="${h.id}" class="${highlightId && String(h.id) === String(highlightId) ? 'row-highlight' : ''}">
        <td><span class="cv-cedula">${cedLabel}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="user-avatar-sm">${(h.nombre||'?').charAt(0).toUpperCase()}${(h.apellido||'').charAt(0).toUpperCase()}</div>
            <strong>${h.nombre} ${h.apellido || ''}</strong>
          </div>
        </td>
        <td>${h.edad} años</td>
        <td>${h.genero || '—'}</td>
        <td>${h.consejoComunal}</td>
        <td><span class="badge ${this._getColorClasificacion(h.clasificacion)}">${this._formatClasificacion(h.clasificacion)}</span></td>
        <td>${h.elector ? '<span class="status-indicator active">Sí</span>' : '<span class="status-indicator inactive">No</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-action view" title="Ver Expediente" onclick="censoCtrl.verExpediente(${h.id})"><i class="fas fa-id-card"></i></button>
            <button class="btn-action edit" title="Editar" onclick="censoCtrl.editarHabitante(${h.id})"><i class="fas fa-pen-to-square"></i></button>
            <button class="btn-action delete" title="Eliminar" onclick="confirmarEliminarHab(${h.id})"><i class="fas fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    if (highlightId) {
      const row = tbody.querySelector(`tr[data-hab-id="${highlightId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => row.classList.remove('row-highlight'), 10000);
      }
    }

    // Renderizar gráficas con la data filtrada
    this.renderChartsHabitantes(filtrados);
  }

  async editarHabitante(id) {
    try {
      const h = await window.api.getHabitanteById(id);
      this.editingId = id;
      this._llenarFormulario(h);
      const title = document.getElementById('modalCensoTitle');
      if (title) title.textContent = 'Editar Habitante #' + id;
      const modalEl = document.getElementById('modalCenso');
      if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
      if (typeof goTo === 'function') goTo(1);
    } catch (e) {
      console.error(e);
      if (window.Components) Components.showToast('No se pudo cargar el habitante.', 'error');
    }
  }

  verExpediente(id) {
    const h = this.habitantes.find(x => String(x.id) === String(id));
    if (!h) return;
    this.renderTabla(id);
    
    const existingModal = document.getElementById('modalExpedienteVisual');
    if (existingModal) existingModal.remove();

    const formatDate = (dateStr) => {
      if (!dateStr) return 'No registrado';
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-VE');
    };

    const getVal = (val) => val ? val : '<span style="color:#aaa;font-style:italic;">No registrado</span>';
    const getBool = (val) => val ? 'Sí' : 'No';

    const modalHtml = `
      <div class="modal fade" id="modalExpedienteVisual" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content" style="border: none; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.25);">
            
            <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color, #1B5E20), var(--primary-dark, #0d3612)); color: white; border-bottom: none; padding: 24px;">
              <h5 class="modal-title" style="font-weight: 700; margin: 0; display: flex; align-items: center; gap: 12px; font-size: 1.25rem;">
                <i class="fas fa-folder-open"></i> Expediente Integral del Habitante
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body" style="padding: 0; background: #f8f9fa;">
              <!-- Header Profile -->
              <div style="padding: 24px; background: white; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 20px;">
                <div style="width: 70px; height: 70px; background: var(--secondary-color, #1565C0); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 28px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                  ${(h.nombre||'?').charAt(0).toUpperCase()}${(h.apellido||'').charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                  <h3 style="margin: 0; color: var(--text-dark, #333); font-weight: 800;">${h.nombre} ${h.apellido || ''}</h3>
                  <div style="display: flex; gap: 15px; margin-top: 5px;">
                    <span style="color: var(--text-muted, #666); font-weight: 600; font-size: 15px;"><i class="fas fa-id-card" style="color:var(--primary-color)"></i> ${h.nacionalidad||'V'}-${h.cedula}</span>
                    <span style="color: var(--text-muted, #666); font-weight: 600; font-size: 15px;"><i class="fas fa-map-marker-alt" style="color:var(--primary-color)"></i> ${h.consejoComunal}</span>
                  </div>
                </div>
                <div>
                  <span class="badge ${this._getColorClasificacion(h.clasificacion)}" style="font-size: 14px; padding: 8px 12px;">${this._formatClasificacion(h.clasificacion)}</span>
                </div>
              </div>

              <!-- Content Grid -->
              <div style="padding: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                
                <!-- Datos Personales y Contacto -->
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
                  <h6 style="color: var(--primary-color, #1B5E20); font-weight: 700; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 16px;"><i class="fas fa-user-circle"></i> Datos Personales y Contacto</h6>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Edad</label><div style="font-weight: 600; color: #333;">${h.edad} años</div></div>
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Género</label><div style="font-weight: 600; color: #333;">${h.genero === 'M' ? 'Masculino' : h.genero === 'F' ? 'Femenino' : h.genero}</div></div>
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Nacimiento</label><div style="font-weight: 600; color: #333;">${formatDate(h.fecha_nacimiento)}</div></div>
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Estado Civil</label><div style="font-weight: 600; color: #333;">${getVal(h.estado_civil)}</div></div>
                    <div style="grid-column: 1 / -1;"><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Teléfono</label><div style="font-weight: 600; color: #333;">${getVal(h.telefono)}</div></div>
                    <div style="grid-column: 1 / -1;"><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Correo Electrónico</label><div style="font-weight: 600; color: #333;">${getVal(h.email)}</div></div>
                    <div style="grid-column: 1 / -1;"><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Dirección</label><div style="font-weight: 600; color: #333;">${getVal(h.direccion)}</div></div>
                    <div style="grid-column: 1 / -1;"><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Tiempo en la Comunidad</label><div style="font-weight: 600; color: #333;">${getVal(h.tiempo_comunidad)}</div></div>
                  </div>
                </div>

                <!-- Perfil Socioeconómico -->
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
                  <h6 style="color: var(--primary-color, #1B5E20); font-weight: 700; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 16px;"><i class="fas fa-briefcase"></i> Perfil Socioeconómico</h6>
                  
                  <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Nivel Educativo</label><div style="font-weight: 600; color: #333;">${getVal(h.nivel_educativo)}</div></div>
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Ocupación</label><div style="font-weight: 600; color: #333;">${getVal(h.ocupacion)}</div></div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px;">
                      <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Trabaja Actualmente</label><div style="font-weight: 600; color: #333;">${getBool(h.trabaja_actualmente)}</div></div>
                      <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Ingreso Familiar</label><div style="font-weight: 600; color: #333;">${getVal(h.clasificacion_ingreso_familiar)}</div></div>
                    </div>
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Ingreso Mensual (Bs)</label><div style="font-weight: 600; color: #333;">${getVal(h.ingreso_mensual_bs)}</div></div>
                  </div>
                </div>

                <!-- Salud y Estatus -->
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
                  <h6 style="color: var(--primary-color, #1B5E20); font-weight: 700; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 16px;"><i class="fas fa-notes-medical"></i> Salud y Asistencia Social</h6>
                  
                  <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                    <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Condición de Salud</label><div style="font-weight: 600; color: ${h.condicion_salud && h.condicion_salud.toLowerCase() !== 'saludable' ? '#C62828' : '#2E7D32'};">${getVal(h.condicion_salud)}</div></div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px;">
                      <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Incapacitado</label><div style="font-weight: 600; color: #333;">${getBool(h.incapacitado)}</div></div>
                      <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Tipo Incapacidad</label><div style="font-weight: 600; color: #333;">${getVal(h.incapacitado_tipo)}</div></div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px;">
                      <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Pensionado</label><div style="font-weight: 600; color: #333;">${getBool(h.pensionado)}</div></div>
                      <div><label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0;">Institución</label><div style="font-weight: 600; color: #333;">${getVal(h.pensionado_institucion)}</div></div>
                    </div>
                  </div>
                </div>

                <!-- Electoral -->
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
                  <h6 style="color: var(--primary-color, #1B5E20); font-weight: 700; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 16px;"><i class="fas fa-vote-yea"></i> Estatus Electoral</h6>
                  
                  <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                      <label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0; display:block; margin-bottom:6px;">Registro Electoral (CNE)</label>
                      ${h.inscrito_cne ? '<span class="status-indicator active" style="font-size:14px; padding:6px 12px;"><i class="fas fa-check-circle"></i> Inscrito en el CNE</span>' : '<span class="status-indicator inactive" style="font-size:14px; padding:6px 12px;"><i class="fas fa-times-circle"></i> No Inscrito</span>'}
                    </div>
                    <div>
                      <label style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: 700; margin:0; display:block; margin-bottom:6px;">Elector Comunal / Universal</label>
                      ${h.elector ? '<span class="status-indicator active" style="font-size:14px; padding:6px 12px;"><i class="fas fa-check-circle"></i> Habilitado</span>' : '<span class="status-indicator inactive" style="font-size:14px; padding:6px 12px;"><i class="fas fa-times-circle"></i> No Habilitado</span>'}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div class="modal-footer" style="background: white; border-top: 1px solid #eee; padding: 16px 24px; display:flex; justify-content: flex-end;">
              <button type="button" class="btn-sicag btn-outline-gris" data-bs-dismiss="modal" style="border: 2px solid #ddd; background: white; color: #444; padding: 10px 20px; border-radius: 8px; font-weight: 600; transition: all 0.2s;">
                <i class="fas fa-times"></i> Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modalExpedienteVisual');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Limpiar el DOM cuando se cierre el modal
    modalEl.addEventListener('hidden.bs.modal', function () {
      modalEl.remove();
    });
  }

  _llenarFormulario(h) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    };
    
    setVal('habNacionalidad', h.nacionalidad || 'V');
    
    // Si la cédula es generada automáticamente (empieza con SC-)
    const chkSinCedula = document.getElementById('habSinCedula');
    if (h.cedula && String(h.cedula).startsWith('SC-')) {
      if (chkSinCedula) chkSinCedula.checked = true;
      setVal('habCedula', 'SC-AUTO');
      const cedulaInput = document.getElementById('habCedula');
      if (cedulaInput) {
        cedulaInput.disabled = true;
        cedulaInput.dataset.invalidCedula = 'false';
      }
    } else {
      if (chkSinCedula) chkSinCedula.checked = false;
      setVal('habCedula', h.cedula);
      const cedulaInput = document.getElementById('habCedula');
      if (cedulaInput) cedulaInput.disabled = false;
    }

    setVal('habNombre', `${h.nombres || ''} ${h.apellidos || ''}`.trim());
    setVal('habFechaNac', h.fecha_nacimiento ? h.fecha_nacimiento.split('T')[0] : '');
    setVal('habGenero', h.genero);
    setVal('habEstadoCivil', h.estado_civil);
    setVal('habTelefono', h.telefono);
    setVal('habEmail', h.email);
    setVal('habDireccion', h.direccion);
    setVal('habTiempoComunidad', h.tiempo_comunidad);
    setVal('habCC', h.consejo_comunal_id);
    setVal('habNivelEducativo', h.nivel_educativo);
    setVal('habOcupacion', h.ocupacion);
    setVal('habTrabaja', h.trabaja_actualmente !== null && h.trabaja_actualmente !== undefined ? String(h.trabaja_actualmente) : '');
    setVal('habIngresoMensual', h.ingreso_mensual_bs);
    setVal('habClasificacionIngreso', h.clasificacion_ingreso_familiar);
    
    setVal('condicionSalud', h.condicion_salud || 'saludable');
    
    setVal('habIncapacitado', h.incapacitado !== null && h.incapacitado !== undefined ? String(h.incapacitado) : 'false');
    setVal('habIncapTipo', h.incapacitado_tipo);
    if (document.getElementById('habIncapacitado')) document.getElementById('habIncapacitado').dispatchEvent(new Event('change'));
    
    setVal('habPensionado', h.pensionado !== null && h.pensionado !== undefined ? String(h.pensionado) : 'false');
    setVal('habPensInst', h.pensionado_institucion);
    if (document.getElementById('habPensionado')) document.getElementById('habPensionado').dispatchEvent(new Event('change'));
    
    setVal('habInscritoCNE', h.inscrito_cne !== null && h.inscrito_cne !== undefined ? String(h.inscrito_cne) : 'false');

    this.calcularDatosNacimiento(h.fecha_nacimiento ? h.fecha_nacimiento.split('T')[0] : '');
  }

  resetFormulario() {
    this.editingId = null;
    const form = document.getElementById('formCenso');
    if (form) form.reset();
  }

  calcularDatosNacimiento(fechaStr) {
    const birthDate = new Date(fechaStr);
    const today = new Date();
    
    if (!fechaStr || isNaN(birthDate.getTime())) {
      const edad = document.getElementById('habEdad');
      const t4 = document.getElementById('t4Status');
      const elec = document.getElementById('electoralStatus');
      if (edad) edad.value = '';
      if (t4) t4.value = '';
      if (elec) elec.value = '';
      return;
    }

    if (birthDate > today) {
      if (window.Components) window.Components.showToast('La fecha de nacimiento no puede estar en el futuro', 'error');
      const fechaNacInput = document.getElementById('habFechaNac');
      if (fechaNacInput) fechaNacInput.value = '';
      return;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    
    const edadEl = document.getElementById('habEdad');
    if (edadEl) edadEl.value = age >= 0 ? age : '';

    const t4Value = age >= 0 && age <= 10 ? 'Niño' : age >= 60 ? 'Adulto Mayor' : 'Adulto';
    const electoralValue = age < 15 ? 'Inactivo electoralmente' : age < 18 ? 'Elector Comunal' : 'Elector Universal';

    const t4El = document.getElementById('t4Status');
    const elecEl = document.getElementById('electoralStatus');
    if (t4El) t4El.value = age >= 0 ? t4Value : '';
    if (elecEl) elecEl.value = age >= 0 ? electoralValue : '';
  }

  toggleRubroProduccion() {
    const productor = document.getElementById('habProductor')?.value;
    const rubroGroup = document.getElementById('rubroProduccionGroup');
    const rubroInput = document.getElementById('rubroProduccion');
    if (!rubroGroup) return;

    if (productor === 'si') {
      rubroGroup.style.display = 'block';
    } else {
      rubroGroup.style.display = 'none';
      if (rubroInput) rubroInput.value = '';
    }
  }

  _getColorClasificacion(clasif) {
    const map = { 'adulto_mayor': 'badge-sicag badge-finalizado', 'niño': 'badge-sicag badge-desarrollo', 'adulto': 'badge-sicag badge-activo' };
    return map[clasif] || 'badge-sicag badge-pendiente';
  }

  _formatClasificacion(clasif) {
    const map = { 'adulto_mayor': 'Adulto Mayor', 'niño': 'Niño/a', 'adulto': 'Adulto' };
    return map[clasif] || clasif;
  }

  renderChartsHabitantes(data) {
    if (typeof Chart === 'undefined') return;

    const buildChart = (id, type, labels, dataArr, colors) => {
      const ctx = document.getElementById(id);
      if (!ctx) return;
      if (window[`_chart_inst_${id}`]) { window[`_chart_inst_${id}`].destroy(); }
      if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
      }
      window[`_chart_inst_${id}`] = new Chart(ctx, {
        type: type,
        data: {
          labels: labels,
          datasets: [{ label: 'Total', data: dataArr, backgroundColor: colors, borderWidth: 1 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: type !== 'bar', position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.label || '';
                  if (label) { label += ': '; }
                  if (context.parsed !== null) { label += context.parsed; }
                  if (type === 'pie' || type === 'doughnut') {
                    let sum = 0;
                    let dataArr = context.chart.data.datasets[0].data;
                    dataArr.forEach(data => { sum += data; });
                    if (sum > 0) {
                      let percentage = (context.parsed * 100 / sum).toFixed(2) + "%";
                      label += ' (' + percentage + ')';
                    }
                  }
                  return label;
                }
              }
            },
            datalabels: {
              color: '#fff',
              font: { weight: 'bold', size: 11 },
              formatter: (value, ctx) => {
                if (type !== 'pie' && type !== 'doughnut') return null;
                let sum = 0;
                let dArr = ctx.chart.data.datasets[0].data;
                dArr.forEach(data => { sum += data; });
                if(sum === 0) return null;
                let percentage = (value * 100 / sum).toFixed(2) + "%";
                return value > 0 ? percentage : null;
              }
            }
          }
        }
      });
    };

    const colors = ['#2E7D32', '#1565C0', '#f39c12', '#c62828', '#8e44ad', '#16a085'];

    // 1. Género
    const gen = { 'Masculino': 0, 'Femenino': 0, 'Otro': 0 };
    data.forEach(d => { 
      if (d.genero) {
        let g = d.genero === 'M' ? 'Masculino' : d.genero === 'F' ? 'Femenino' : 'Otro';
        gen[g] = (gen[g]||0)+1; 
      }
    });
    buildChart('chartGenero', 'pie', Object.keys(gen), Object.values(gen), colors);

    // 2. Etarios
    const edades = { 'Niños (0-12)':0, 'Adolescentes (13-17)':0, 'Adultos (18-59)':0, 'Adultos Mayores (60+)':0 };
    data.forEach(d => {
      if (d.edad <= 12) edades['Niños (0-12)']++;
      else if (d.edad <= 17) edades['Adolescentes (13-17)']++;
      else if (d.edad <= 59) edades['Adultos (18-59)']++;
      else edades['Adultos Mayores (60+)']++;
    });
    buildChart('chartEdades', 'pie', Object.keys(edades), Object.values(edades), colors);

    // 3. Cédula
    const ced = { 'Con Cédula':0, 'Niños sin Cédula (SC)':0 };
    data.forEach(d => {
      if (String(d.cedula).startsWith('SC-')) ced['Niños sin Cédula (SC)']++;
      else ced['Con Cédula']++;
    });
    buildChart('chartCedula', 'pie', Object.keys(ced), Object.values(ced), colors);

    // 4. Salud
    const sal = { 'Saludable':0, 'Enfermedad Crónica':0, 'Discapacidad':0, 'Embarazo':0 };
    data.forEach(d => {
      if (d.condicion_salud) {
        if (d.condicion_salud.toLowerCase().includes('crónica') || d.condicion_salud.toLowerCase().includes('cronica')) sal['Enfermedad Crónica']++;
        else if (d.condicion_salud.toLowerCase().includes('discapacidad')) sal['Discapacidad']++;
        else if (d.condicion_salud.toLowerCase().includes('embarazo')) sal['Embarazo']++;
        else sal['Saludable']++;
      } else {
        sal['Saludable']++;
      }
    });
    buildChart('chartSalud', 'bar', Object.keys(sal), Object.values(sal), colors);

    // 5. Trabajo
    const trab = { 'Trabaja':0, 'No Trabaja':0 };
    data.forEach(d => {
      if (d.edad >= 18) {
        if (d.trabaja_actualmente && d.trabaja_actualmente !== false) trab['Trabaja']++;
        else trab['No Trabaja']++;
      }
    });
    buildChart('chartTrabajo', 'pie', Object.keys(trab), Object.values(trab), colors);

    // 6. CNE
    const cne = { 'Inscrito':0, 'No Inscrito':0 };
    data.forEach(d => {
      if (d.edad >= 18) {
        if (d.inscrito_cne && d.inscrito_cne !== false) cne['Inscrito']++;
        else cne['No Inscrito']++;
      }
    });
    buildChart('chartCne', 'pie', Object.keys(cne), Object.values(cne), colors);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.censoCtrl = new CensoController();
});
document.addEventListener('spa-navigated', () => {
  if (window.location.pathname.includes('censo.html')) {
    window.censoCtrl = new CensoController();
  }
});

window.abrirModalExportarCenso = function() {
  const modal = document.getElementById('modalFiltrosAvanzados');
  if (modal) modal.style.display = 'flex';
};

document.addEventListener('DOMContentLoaded', _initModalCensoExport);
document.addEventListener('spa-navigated', () => {
  if (window.location.pathname.includes('censo.html')) {
    _initModalCensoExport();
  }
});

function _initModalCensoExport() {
  const modal = document.getElementById('modalFiltrosAvanzados');
  const btnClose = document.getElementById('btnCloseFilters');
  const btnExcel = document.getElementById('btnCustomExcel');
  const btnPDF = document.getElementById('btnCustomPDF');
  const btnLimpiar = document.getElementById('btnLimpiarFiltros');
  const chkNac = document.getElementById('chkNacimiento');

  if (!modal) return;

  if (btnClose) btnClose.onclick = () => modal.style.display = 'none';
  window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  if (chkNac) {
    chkNac.onchange = (e) => {
      const active = e.target.checked;
      document.getElementById('filtroNacMin').disabled = !active;
      document.getElementById('filtroNacMax').disabled = !active;
      document.getElementById('filtroEdadMin').disabled = active;
      document.getElementById('filtroEdadMax').disabled = active;
    };
  }

  if (btnLimpiar) {
    btnLimpiar.onclick = () => {
      ['filtroDesde','filtroHasta','filtroConsejoExport','filtroNacMin','filtroNacMax','filtroEdadMin','filtroEdadMax','filtroGeneroExport','filtroSalud','filtroCne','filtroTrabajo'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = '';
      });
      if(chkNac) { chkNac.checked = false; chkNac.dispatchEvent(new Event('change')); }
      document.querySelectorAll('.chk-extra').forEach(c => c.checked = false);
      if(document.getElementById('customReportType')) document.getElementById('customReportType').value = 'total-personas';
    };
  }

  if (btnExcel) btnExcel.onclick = () => _generarReporteAvanzadoCenso('excel', btnExcel);
  if (btnPDF) btnPDF.onclick = () => _generarReporteAvanzadoCenso('pdf', btnPDF);
}

function _generarReporteAvanzadoCenso(formato, btn) {
  const orig = btn.innerHTML;

  if (window.Components && typeof Components.actionDialog === 'function') {
    Components.actionDialog({
      titulo: 'Opciones de Documento',
      mensaje: '¿Deseas abrir el reporte aquí mismo en el navegador o descargarlo directamente a tu equipo?',
      icono: formato === 'excel' ? 'fa-file-excel' : 'fa-file-pdf',
      colorIcono: formato === 'excel' ? '#107c41' : '#1565C0',
      btnPrimaryText: 'Descargar Archivo',
      btnPrimaryIcon: 'fa-download',
      btnPrimaryColor: formato === 'excel' ? '#107c41' : '#1565C0',
      btnSecondaryText: 'Solo Ver',
      btnSecondaryIcon: 'fa-eye',
      onPrimary: () => { _ejecutarRequestExportacionAvanzada(formato, btn, orig, 'download'); },
      onSecondary: () => { _ejecutarRequestExportacionAvanzada(formato, btn, orig, 'view'); }
    });
  } else {
    const accion = confirm('Pulsa Aceptar para VER el reporte, o Cancelar para DESCARGARLO.') ? 'view' : 'download';
    _ejecutarRequestExportacionAvanzada(formato, btn, orig, accion);
  }
}

function _ejecutarRequestExportacionAvanzada(formato, btn, orig, action) {
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
  btn.disabled = true;

  let params = new URLSearchParams();

  const getVal = (id) => { const el = document.getElementById(id); return el && !el.disabled ? el.value : ''; };

  const desde = getVal('filtroDesde');
  const hasta = getVal('filtroHasta');
  // Usar los nombres de parámetros correctos que espera el backend
  if (desde) params.append('desde', desde);
  if (hasta) params.append('hasta', hasta);

  const cc = getVal('filtroConsejoExport');
  if (cc) params.append('consejo_id', cc);

  const usarNac = document.getElementById('chkNacimiento')?.checked;
  if (usarNac) {
    const fnMin = getVal('filtroNacMin');
    const fnMax = getVal('filtroNacMax');
    // Parámetros correctos del backend: nac_min / nac_max
    if (fnMin) params.append('nac_min', fnMin);
    if (fnMax) params.append('nac_max', fnMax);
  } else {
    const edMin = getVal('filtroEdadMin');
    const edMax = getVal('filtroEdadMax');
    if (edMin) params.append('edad_min', edMin);
    if (edMax) params.append('edad_max', edMax);
  }

  const gen = getVal('filtroGeneroExport');
  if (gen) params.append('genero', gen);

  const salud = getVal('filtroSalud');
  if (salud) params.append('salud', salud);

  // Parámetros correctos del backend: cne / trabajo
  const cne = getVal('filtroCne');
  if (cne) params.append('cne', cne);

  const trabajo = getVal('filtroTrabajo');
  if (trabajo) params.append('trabajo', trabajo);

  const extras = Array.from(document.querySelectorAll('.chk-extra:checked')).map(c => c.value);
  if (extras.length > 0) params.append('extras', extras.join(','));

  const tipo = document.getElementById('customReportType')?.value || 'total-personas';

  const baseUrl = window.api ? window.api.baseURL : 'http://localhost:3000/api';
  const token = window.auth?.getToken() || '';
  
  const downloadUrl = `${baseUrl}/censo-reportes/exportar?tipo=${tipo}&format=${formato}&action=${action}&token=${token}&${params.toString()}`;
  
  window.open(downloadUrl, '_blank');

  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
    if (window.Components) Components.showToast('Reporte generado exitosamente.', 'success');
    setTimeout(() => { 
      btn.innerHTML = orig; 
      btn.disabled = false; 
    }, 2000);
  }, 1500);
}

window.exportarGrafica = async function(btn, canvasId, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const origHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) throw new Error("La librería jsPDF no está cargada.");

    // PDF en vertical (portrait) para que quepa la tabla abajo
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Poner fondo blanco a la imagen del canvas (por defecto es transparente)
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    const ctx = newCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const imageBase64 = newCanvas.toDataURL('image/png', 1.0);

    // Encabezado SICAG
    doc.setFontSize(22);
    doc.setTextColor(46, 125, 50); // Verde SICAG
    doc.text('SICAG', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(title || 'Gráfica Estadística', 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 105, 36, { align: 'center' });

    // Imagen de la Gráfica
    const pdfWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Ancho máximo para la imagen
    let finalWidth = pdfWidth - (margin * 2);
    let finalHeight = (canvas.height * finalWidth) / canvas.width;

    // Limitar la altura de la gráfica para que quepa la tabla bien
    if (finalHeight > 100) {
      finalHeight = 100;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }

    const xOffset = (pdfWidth - finalWidth) / 2;
    doc.addImage(imageBase64, 'PNG', xOffset, 45, finalWidth, finalHeight);

    // Extraer datos para la tabla
    const chartInstance = Chart.getChart(canvasId);
    let tableHead = [['Categoría', 'Cantidad']];
    let tableBody = [];
    let total = 0;

    if (chartInstance && chartInstance.data) {
      const labels = chartInstance.data.labels || [];
      const data = chartInstance.data.datasets[0].data || [];
      for(let i = 0; i < labels.length; i++){
        tableBody.push([labels[i], data[i]]);
        total += Number(data[i]) || 0;
      }
      tableBody.push([{ content: 'Total', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: total, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
    }

    // Dibujar la tabla debajo de la gráfica
    if (doc.autoTable) {
      doc.autoTable({
        startY: 45 + finalHeight + 10,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [46, 125, 50] },
        styles: { fontSize: 11, halign: 'center' },
        margin: { left: margin, right: margin }
      });
    }
    
    const safeTitle = (title || canvasId).toLowerCase().replace(/\s+/g, '_');
    doc.save(`grafica_${safeTitle}.pdf`);

    if (window.Components) Components.showToast('PDF generado correctamente.', 'success');
  } catch (err) {
    console.error('Error al generar PDF:', err);
    if (window.Components) Components.showToast('Error al generar PDF en el navegador.', 'error');
    else alert('Error al generar PDF en el navegador.');
  } finally {
    btn.innerHTML = origHtml;
    btn.disabled = false;
  }
};

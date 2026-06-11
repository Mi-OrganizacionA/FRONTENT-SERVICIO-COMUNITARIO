/**
 * Módulo centralizado de API (SICAG v2.5)
 * Gestiona todas las llamadas a datos (simulado con seed.json local en desarrollo)
 */
class APIManager {
  constructor() {
    const host = window.location.hostname;
    this.isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    this.baseURL = window.API_BASE_URL || (this.isLocal ? 'http://localhost:3000/api' : 'https://sicag-api.onrender.com/api');
    this.mockData = null;
    this.isDevelopment = Boolean(window.API_FORCE_MOCK || false);
    this.initMockData();
    // Intentar sincronizar pendientes al reconectar
    window.addEventListener('online', () => this.flushPendingPasos());
    // Intentar flush inicial de pendientes
    try { this.flushPendingPasos(); } catch(e) { /* ignore */ }
  }

  // Cargar datos de ejemplo
  async initMockData() {
    try {
      const localData = localStorage.getItem('sicag_mockData');
      if (localData) {
        this.mockData = JSON.parse(localData);
        return;
      }
      
      const response = await fetch('data/seed.json');
      if (response.ok) {
        this.mockData = await response.json();
        this.saveMockData();
      } else {
        console.warn('No se pudo cargar seed.json (¿Estás abriendo el archivo localmente sin servidor?)');
        this.mockData = { habitantes: [], proyectos: [], noticias: [], config: {} };
      }
    } catch (error) {
      console.error('Error cargando datos de prueba:', error);
      this.mockData = { habitantes: [], proyectos: [], noticias: [], config: {} };
    }
  }

  saveMockData() {
    if (this.mockData) {
      localStorage.setItem('sicag_mockData', JSON.stringify(this.mockData));
    }
  }

  // Esperar a que initMockData termine si se llama rápido
  async waitForMockData() {
    if (this.mockData !== null) return;
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (this.mockData !== null) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  _enableMockMode(error) {
    if (!this.isDevelopment) {
      console.warn('API no disponible, activando modo local de simulación:', error?.message || error);
      this.isDevelopment = true;
    }
  }

  // Pending queue helpers (for pasos de censo guardados offline)
  _getPendingQueue() {
    try {
      const raw = localStorage.getItem('sicag_censo_queue');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  _savePendingQueue(queue) {
    try {
      localStorage.setItem('sicag_censo_queue', JSON.stringify(queue));
      // Dispatch event with current count
      window.dispatchEvent(new CustomEvent('censo:pendingCount', { detail: { count: queue.length } }));
    } catch (e) { console.error('No se pudo guardar la cola de pasos', e); }
  }

  _enqueuePendingPaso(paso, idEstudio, datos) {
    const queue = this._getPendingQueue();
    queue.push({ paso, id_estudio: idEstudio, datos, ts: Date.now() });
    this._savePendingQueue(queue);
  }

  async flushPendingPasos() {
    const queue = this._getPendingQueue();
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
      try {
        const resp = await this._fetch(`${this.baseURL}/estudios-demograficos/paso`, {
          method: 'POST',
          ...this._getHeaders(),
          body: JSON.stringify(item)
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
      } catch (e) {
        console.warn('No se pudo sincronizar paso en la cola:', e);
        remaining.push(item);
      }
    }
    this._savePendingQueue(remaining);
  }

  // ─────────────────────────────────────────
  // AUTHENTICATION & SECURITY
  // ─────────────────────────────────────────
  async cambiarPassword(passwordActual, nuevaPassword) {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r({ success: true, message: 'Simulado' }), 500));
    }
    const response = await fetch(`${this.baseURL}/auth/password`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify({ passwordActual, nuevaPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al cambiar la contraseña');
    return data;
  }

  async requestCode(email) {
    if (this.isDevelopment) {
      console.log('Simulando envío de correo a:', email);
      return { success: true, message: 'Código simulado' };
    }
    const response = await fetch(`${this.baseURL}/auth/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }

  async resetPassword(email, code, newPassword) {
    if (this.isDevelopment) {
      console.log('Simulando reset de contraseña para:', email);
      return { success: true, message: 'Contraseña cambiada simulada' };
    }
    const response = await fetch(`${this.baseURL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }

  // ─────────────────────────────────────────
  // CONFIGURACIÓN DEL SISTEMA Y RECOVERY PASS
  // ─────────────────────────────────────────

  async getSystemConfig() {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return this.mockData.config || {};
    }
    try {
      const response = await this._fetch(`${this.baseURL}/system/config`, this._getHeaders());
      const data = await response.json().catch(() => ({}));
      return data.config || {};
    } catch (error) {
      if (this.isDevelopment) {
        return this.mockData.config || {};
      }
      throw error;
    }
  }

  async saveSystemConfig(configKey, value) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      if (!this.mockData.config) this.mockData.config = {};
      this.mockData.config[configKey] = value;
      this.saveMockData();
      return { success: true };
    }
    const response = await fetch(`${this.baseURL}/system/config`, {
      method: 'POST',
      ...this._getHeaders(),
      body: JSON.stringify({ nombre: configKey, estado: value })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  async downloadBackup() {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r(true), 1500));
    }
    const token = localStorage.getItem('token');
    const a = document.createElement('a');
    a.href = `${this.baseURL}/system/backup?token=${token}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async cleanLogs(monthsOld) {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r({ mensaje: 'Registros purgados simuladamente' }), 1200));
    }
    const response = await fetch(`${this.baseURL}/auditoria/clean`, {
      method: 'DELETE',
      ...this._getHeaders(),
      body: JSON.stringify({ monthsOld })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error purgando logs');
    return data;
  }

  // ─────────────────────────────────────────
  // HABITANTES
  // ─────────────────────────────────────────
  async getHabitantes(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return this._filterHabitantes(this.mockData.habitantes, filtros);
    }
    const params = new URLSearchParams(filtros);
    try {
      const response = await this._fetch(`${this.baseURL}/habitantes?${params}`, this._getHeaders());
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error fetching habitantes');
      }
      const data = await response.json();
      return data.habitantes || data;
    } catch (error) {
      if (this.isDevelopment) {
        return this._filterHabitantes(this.mockData.habitantes, filtros);
      }
      throw error;
    }
  }

  async getHabitanteById(id) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const h = this.mockData.habitantes.find(x => String(x.id) === String(id));
      if (!h) throw new Error('Habitante no encontrado');
      return h;
    }
    try {
      const response = await this._fetch(`${this.baseURL}/habitantes/${id}`, this._getHeaders());
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Habitante no encontrado');
      }
      return response.json();
    } catch (error) {
      if (this.isDevelopment) {
        const h = this.mockData.habitantes.find(x => String(x.id) === String(id));
        if (!h) throw new Error('Habitante no encontrado');
        return h;
      }
      throw error;
    }
  }

  async buscarHabitantesPublico(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      const response = await this._fetch(`${this.baseURL}/habitantes/publico/buscar?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      if (this.isDevelopment) {
        const normalizedQuery = query.trim().toLowerCase();
        return (this.mockData.habitantes || [])
          .filter(h => String(h.cedula).includes(normalizedQuery) || h.nombre?.toLowerCase().includes(normalizedQuery))
          .slice(0, 10);
      }
      return [];
    }
  }

  async crearHabitante(datos) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const usuario = window.auth?.getUser();
      const nuevoId = this.mockData.habitantes.length > 0 ? Math.max(...this.mockData.habitantes.map(h => h.id)) + 1 : 1;
      const registro = { id: nuevoId, ...datos, fechaRegistro: new Date().toISOString() };

      if (usuario?.rol === 'vocero') {
        const notificacion = await this.crearNotificacion({
          tipo: 'registro_habitante',
          titulo: 'Solicitud de registro de habitante',
          mensaje: `El vocero ${usuario.nombre} solicitó validación del nuevo habitante.`,
          status: 'pendiente',
          vocero: usuario.nombre,
          consejoComunal: usuario.consejoComunal,
          fechaSolicitud: new Date().toISOString(),
          datosHabitante: registro,
          nota: ''
        });
        return notificacion;
      }

      this.mockData.habitantes.push(registro);
      this.saveMockData();
      return registro;
    }
    
    // En producción:
    const response = await this._fetch(`${this.baseURL}/habitantes`, {
      method: 'POST',
      ...this._getHeaders(),
      body: JSON.stringify(datos)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Error al crear habitante');
    return data;
  }

  async registrarHabitante(datos) {
    return this.crearHabitante(datos); // Alias para crearHabitante
  }

  async actualizarHabitante(id, cambios) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const index = this.mockData.habitantes.findIndex(h => h.id === id);
      if (index !== -1) {
        this.mockData.habitantes[index] = { ...this.mockData.habitantes[index], ...cambios };
        this.saveMockData();
        return this.mockData.habitantes[index];
      }
      throw new Error('Habitante no encontrado');
    }
    const response = await fetch(`${this.baseURL}/habitantes/${id}`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify(cambios)
    });
    if (!response.ok) throw new Error('Error al actualizar habitante');
    return response.json();
  }

  async getNotificaciones() {
    if (!this.isDevelopment) {
      const response = await fetch(`${this.baseURL}/validaciones/pendientes`, this._getHeaders());
      if (!response.ok) throw new Error('Error al obtener notificaciones');
      return response.json();
    }
    return [];
  }

  async aprobarNotificacion(id, comentarios) {
    if (!this.isDevelopment) {
      const response = await fetch(`${this.baseURL}/validaciones/${id}/aprobar`, {
        method: 'PUT',
        ...this._getHeaders(),
        body: JSON.stringify({ comentarios })
      });
      if (!response.ok) throw new Error('Error al aprobar notificación');
      return response.json();
    }
    return { success: true };
  }

  async rechazarNotificacion(id, motivo) {
    if (!this.isDevelopment) {
      const response = await fetch(`${this.baseURL}/validaciones/${id}/rechazar`, {
        method: 'PUT',
        ...this._getHeaders(),
        body: JSON.stringify({ motivo })
      });
      if (!response.ok) throw new Error('Error al rechazar notificación');
      return response.json();
    }
    return { success: true };
  }

  async eliminarHabitante(id) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      this.mockData.habitantes = this.mockData.habitantes.filter(h => h.id !== id);
      this.saveMockData();
      return { success: true };
    }
    const response = await fetch(`${this.baseURL}/habitantes/${id}`, {
      method: 'DELETE',
      ...this._getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar habitante');
    return response.json();
  }

  // ─────────────────────────────────────────
  // PROYECTOS
  // ─────────────────────────────────────────
  async getProyectos(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return this._filterProyectos(this.mockData.proyectos, filtros);
    }
    const params = new URLSearchParams(filtros);
    try {
      const response = await this._fetch(`${this.baseURL}/proyectos?${params}`, this._getHeaders());
      if (!response.ok) throw new Error('Error fetching proyectos');
      return response.json();
    } catch (error) {
      if (this.isDevelopment) {
        return this._filterProyectos(this.mockData.proyectos, filtros);
      }
      throw error;
    }
  }

  async getProyectosPublicos(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return this._filterProyectos(this.mockData.proyectos, filtros);
    }
    try {
      const params = new URLSearchParams(filtros);
      const response = await this._fetch(`${this.baseURL}/proyectos/publico?${params}`, this._getHeaders());
      if (!response.ok) throw new Error('Error fetching proyectos publicos');
      return await response.json();
    } catch (error) {
      if (this.isDevelopment) {
        return this._filterProyectos(this.mockData?.proyectos || [], filtros);
      }
      console.warn('API pública falló, usando datos locales como respaldo:', error.message);
      return this._filterProyectos(this.mockData?.proyectos || [], filtros);
    }
  }

  async crearProyecto(datos) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const nuevoId = this.mockData.proyectos.length > 0 ? Math.max(...this.mockData.proyectos.map(p => p.id)) + 1 : 1;
      const registro = { id: nuevoId, ...datos, fecha_registro: new Date().toISOString() };
      this.mockData.proyectos.push(registro);
      this.saveMockData();
      return registro;
    }
    const response = await fetch(`${this.baseURL}/proyectos`, {
      method: 'POST',
      ...this._getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al crear proyecto');
    return response.json();
  }

  async actualizarProyecto(id, cambios) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const index = this.mockData.proyectos.findIndex(p => p.id === id);
      if (index !== -1) {
        this.mockData.proyectos[index] = { ...this.mockData.proyectos[index], ...cambios };
        this.saveMockData();
        return this.mockData.proyectos[index];
      }
      throw new Error('Proyecto no encontrado');
    }
    const response = await fetch(`${this.baseURL}/proyectos/${id}`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify(cambios)
    });
    if (!response.ok) throw new Error('Error al actualizar proyecto');
    return response.json();
  }

  async eliminarProyecto(id) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      this.mockData.proyectos = this.mockData.proyectos.filter(p => p.id !== id);
      this.saveMockData();
      return { success: true };
    }
    const response = await fetch(`${this.baseURL}/proyectos/${id}`, {
      method: 'DELETE',
      ...this._getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar proyecto');
    return response.json();
  }

  // ─────────────────────────────────────────
  // PRODUCCIÓN AGRÍCOLA
  // ─────────────────────────────────────────
  async getProduccion(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await fetch(`${this.baseURL}/produccion_agricola?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching produccion agricola');
    return response.json();
  }

  async crearProduccion(datos) {
    if (this.isDevelopment) return datos;
    const response = await fetch(`${this.baseURL}/produccion_agricola`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
    if (!response.ok) throw new Error('Error creando produccion agricola');
    return response.json();
  }

  async actualizarProduccion(id, cambios) {
    if (this.isDevelopment) return cambios;
    const response = await fetch(`${this.baseURL}/produccion_agricola/${id}`, { method: 'PUT', ...this._getHeaders(), body: JSON.stringify(cambios) });
    if (!response.ok) throw new Error('Error actualizando produccion agricola');
    return response.json();
  }

  async eliminarProduccion(id) {
    if (this.isDevelopment) return { success: true };
    const response = await fetch(`${this.baseURL}/produccion_agricola/${id}`, { method: 'DELETE', ...this._getHeaders() });
    if (!response.ok) throw new Error('Error eliminando produccion agricola');
    return response.json();
  }

  // ─────────────────────────────────────────
  // ORGANIZACIONES SOCIALES
  // ─────────────────────────────────────────
  async getOrganizaciones(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await fetch(`${this.baseURL}/organizaciones?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching organizaciones');
    return response.json();
  }

  async crearOrganizacion(datos) {
    if (this.isDevelopment) return datos;
    const response = await fetch(`${this.baseURL}/organizaciones`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
    if (!response.ok) throw new Error('Error creando organizacion');
    return response.json();
  }

  async actualizarOrganizacion(id, cambios) {
    if (this.isDevelopment) return cambios;
    const response = await fetch(`${this.baseURL}/organizaciones/${id}`, { method: 'PUT', ...this._getHeaders(), body: JSON.stringify(cambios) });
    if (!response.ok) throw new Error('Error actualizando organizacion');
    return response.json();
  }

  async eliminarOrganizacion(id) {
    if (this.isDevelopment) return { success: true };
    const response = await fetch(`${this.baseURL}/organizaciones/${id}`, { method: 'DELETE', ...this._getHeaders() });
    if (!response.ok) throw new Error('Error eliminando organizacion');
    return response.json();
  }

  // ─────────────────────────────────────────
  // VIVIENDAS
  // ─────────────────────────────────────────
  async getViviendas(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await fetch(`${this.baseURL}/viviendas?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching viviendas');
    return response.json();
  }

  async crearVivienda(datos) {
    if (this.isDevelopment) return datos;
    const response = await fetch(`${this.baseURL}/viviendas`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
    if (!response.ok) throw new Error('Error creando vivienda');
    return response.json();
  }

  async actualizarVivienda(id, cambios) {
    if (this.isDevelopment) return cambios;
    const response = await fetch(`${this.baseURL}/viviendas/${id}`, { method: 'PUT', ...this._getHeaders(), body: JSON.stringify(cambios) });
    if (!response.ok) throw new Error('Error actualizando vivienda');
    return response.json();
  }

  async eliminarVivienda(id) {
    if (this.isDevelopment) return { success: true };
    const response = await fetch(`${this.baseURL}/viviendas/${id}`, { method: 'DELETE', ...this._getHeaders() });
    if (!response.ok) throw new Error('Error eliminando vivienda');
    return response.json();
  }

  // ─────────────────────────────────────────
  // VOCEROS
  // ─────────────────────────────────────────
  async getVoceros(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await fetch(`${this.baseURL}/voceros?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching voceros');
    return response.json();
  }

  async crearVocero(datos) {
    if (this.isDevelopment) return datos;
    const response = await fetch(`${this.baseURL}/voceros`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
    if (!response.ok) throw new Error('Error creando vocero');
    return response.json();
  }

  async eliminarVocero(id) {
    if (this.isDevelopment) return { success: true };
    const response = await fetch(`${this.baseURL}/voceros/${id}`, { method: 'DELETE', ...this._getHeaders() });
    if (!response.ok) throw new Error('Error eliminando vocero');
    return response.json();
  }

  // ─────────────────────────────────────────
  // NOTICIAS (CARTELERA DIGITAL)
  // ─────────────────────────────────────────
  async getNoticias(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) return this.mockData?.noticias || [];
    const params = new URLSearchParams(filtros);
    try {
      const response = await this._fetch(`${this.baseURL}/cartelera/publico/activas`, this._getHeaders());
      if (!response.ok) throw new Error('Error fetching noticias');
      return response.json();
    } catch (error) {
      if (this.isDevelopment) {
        return this.mockData?.noticias || [];
      }
      console.warn('No se pudo cargar noticias desde la API; usando datos locales:', error.message);
      return this.mockData?.noticias || [];
    }
  }

  async crearNoticia(datos) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const nuevoId = (this.mockData.noticias && this.mockData.noticias.length > 0) ? Math.max(...this.mockData.noticias.map(n => n.id)) + 1 : 1;
      const registro = { id: nuevoId, ...datos, fecha_publicacion: new Date().toISOString() };
      if(!this.mockData.noticias) this.mockData.noticias = [];
      this.mockData.noticias.push(registro);
      this.saveMockData();
      return registro;
    }
    const response = await fetch(`${this.baseURL}/cartelera`, {
      method: 'POST',
      ...this._getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al crear noticia');
    return response.json();
  }

  async actualizarNoticia(id, cambios) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const index = this.mockData.noticias.findIndex(n => n.id === id);
      if (index !== -1) {
        this.mockData.noticias[index] = { ...this.mockData.noticias[index], ...cambios };
        this.saveMockData();
        return this.mockData.noticias[index];
      }
      throw new Error('Noticia no encontrada');
    }
    const response = await fetch(`${this.baseURL}/cartelera/${id}`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify(cambios)
    });
    if (!response.ok) throw new Error('Error al actualizar noticia');
    return response.json();
  }

  async eliminarNoticia(id) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      this.mockData.noticias = this.mockData.noticias.filter(n => n.id !== id);
      this.saveMockData();
      return { success: true };
    }
    const response = await fetch(`${this.baseURL}/cartelera/${id}`, {
      method: 'DELETE',
      ...this._getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar noticia');
    return response.json();
  }

  // ─────────────────────────────────────────
  // DASHBOARD Y ESTADÍSTICAS
  // ─────────────────────────────────────────
  async getDashboardStats() {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return { 
        habitantes: this.mockData?.habitantes?.length || 0, 
        viviendas: 0, 
        proyectos: this.mockData?.proyectos?.length || 0, 
        consejos: 8 
      };
    }
    
    // Obtenemos los totales haciendo llamadas a los endpoints
    try {
      const [habRes, vivRes, proyRes] = await Promise.all([
        this._fetch(`${this.baseURL}/habitantes`, this._getHeaders()),
        this._fetch(`${this.baseURL}/viviendas`, this._getHeaders()),
        this._fetch(`${this.baseURL}/proyectos`, this._getHeaders())
      ]);
      
      const habitantes = habRes.ok ? await habRes.json() : [];
      const viviendas = vivRes.ok ? await vivRes.json() : [];
      const proyectos = proyRes.ok ? await proyRes.json() : [];
      
      return {
        habitantes: habitantes.total !== undefined ? habitantes.total : habitantes.length || 0,
        viviendas: viviendas.total !== undefined ? viviendas.total : viviendas.length || 0,
        proyectos: proyectos.total !== undefined ? proyectos.total : proyectos.length || 0,
        consejos: 8
      };
    } catch (e) {
      if (this.isDevelopment) {
        return { habitantes: this.mockData?.habitantes?.length || 0, viviendas: 0, proyectos: this.mockData?.proyectos?.length || 0, consejos: 8 };
      }
      console.error("Error obteniendo stats del dashboard", e);
      return { habitantes: 0, viviendas: 0, proyectos: 0, consejos: 0 };
    }
  }

  async getDashboardResumen() {
    try {
      const response = await this._fetch(`${this.baseURL}/censo-reportes/resumen`, this._getHeaders());
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      if (this.isDevelopment) {
        return [];
      }
      console.error(e);
      return [];
    }
  }

  // ─────────────────────────────────────────
  // BÚSQUEDA GLOBAL
  // ─────────────────────────────────────────
  async globalSearch(query) {
    if (!query || query.length < 2) return [];
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('NO_TOKEN');

      const lowerQ = query.toLowerCase();
      
      // Consultamos de forma concurrente los diferentes endpoints existentes
      const [habitantes, proyectos, organizaciones, noticias, voceros] = await Promise.all([
        this.getHabitantes().catch(() => []),
        this.getProyectos().catch(() => []),
        this.getOrganizaciones().catch(() => []),
        this.getNoticias().catch(() => []),
        this.getVoceros().catch(() => [])
      ]);

      let results = [];

      // Buscar en Habitantes
      habitantes.forEach(h => {
        if (h.nombre.toLowerCase().includes(lowerQ) || h.cedula.includes(lowerQ)) {
          results.push({
            tipo: 'habitante',
            titulo: h.nombre,
            subtitulo: `Habitante - C.I: ${h.cedula}`,
            url: `censo.html?highlightSection=${encodeURIComponent(h.nombre)}`
          });
        }
      });

      // Buscar en Proyectos
      proyectos.forEach(p => {
        if (p.titulo.toLowerCase().includes(lowerQ)) {
          results.push({
            tipo: 'proyecto',
            titulo: p.titulo,
            subtitulo: `Proyecto Agroecológico - ${p.estado}`,
            url: `proyectos.html?highlightSection=${encodeURIComponent(p.titulo)}`
          });
        }
      });

      // Buscar en Organizaciones
      organizaciones.forEach(o => {
        if (o.nombre.toLowerCase().includes(lowerQ)) {
          results.push({
            tipo: 'organizacion',
            titulo: o.nombre,
            subtitulo: `Organización - ${o.tipo}`,
            url: `organizaciones.html?highlightSection=${encodeURIComponent(o.nombre)}`
          });
        }
      });

      // Buscar en Noticias / Cartelera
      noticias.forEach(n => {
        if (n.titulo.toLowerCase().includes(lowerQ)) {
          results.push({
            tipo: 'noticia',
            titulo: n.titulo,
            subtitulo: `Publicación`,
            url: `noticias.html?highlightSection=${encodeURIComponent(n.titulo)}`
          });
        }
      });

      // Buscar en Voceros
      voceros.forEach(v => {
        if (v.nombre.toLowerCase().includes(lowerQ) || v.cedula.includes(lowerQ)) {
          results.push({
            tipo: 'vocero',
            titulo: v.nombre,
            subtitulo: `Vocero - ${v.comite}`,
            url: `voceros.html?highlightSection=${encodeURIComponent(v.nombre)}`
          });
        }
      });

      return results.slice(0, 15); // Limitar a 15 resultados
    } catch (e) {
      if (e.message === 'NO_TOKEN' || e.message === 'TOKEN_EXPIRED') {
        throw e;
      }
      console.error("Error en búsqueda global", e);
      return [];
    }
  }

  // ─────────────────────────────────────────
  // MÉTODOS AUXILIARES
  // ─────────────────────────────────────────
  _getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
  }

  async _fetch(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (response.status === 401) {
        const err = await response.clone().json().catch(() => ({}));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.auth) {
          window.auth.token = null;
          window.auth.user = null;
        }
        const isPublicPage = /index\.html$|consulta_habitantes\.html$|login\.html$/.test(window.location.pathname) ||
          window.location.pathname.endsWith('/');
        if (!isPublicPage) {
          alert(err.error || 'Su sesión ha expirado. Por favor inicie sesión nuevamente.');
          window.location.href = 'login.html';
        }
        throw new Error(err.code || 'TOKEN_EXPIRED');
      }
      return response;
    } catch (error) {
      this._enableMockMode(error);
      throw error;
    }
  }

  _filterHabitantes(habitantes, filtros) {
    let resultado = habitantes;
    if (filtros.consejoComunal) {
      resultado = resultado.filter(h => h.consejoComunal === filtros.consejoComunal);
    }
    return resultado;
  }

  async guardarPasoCenso(paso, idEstudio, datos) {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r({ success: true, id_estudio: idEstudio || Math.floor(Math.random() * 90000000) }), 500));
    }

    try {
      const response = await this._fetch(`${this.baseURL}/estudios-demograficos/paso`, {
        method: 'POST',
        ...this._getHeaders(),
        body: JSON.stringify({ paso, id_estudio: idEstudio, datos })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Error en paso ${paso}`);
      return data;
    } catch (error) {
      // Si falla por red, encolamos el paso para sincronizar luego
      try {
        this._enqueuePendingPaso(paso, idEstudio, datos);
        return { success: true, id_estudio: idEstudio || Math.floor(Math.random() * 90000000), queued: true };
      } catch (e) {
        this._enableMockMode(error);
        if (this.isDevelopment) {
          return { success: true, id_estudio: idEstudio || Math.floor(Math.random() * 90000000) };
        }
        throw error;
      }
    }
  }

  async finalizarEstudio(idEstudio) {
    if (this.isDevelopment) return { success: true };
    try {
      const response = await this._fetch(`${this.baseURL}/estudios-demograficos/${idEstudio}/finalizar`, {
        method: 'PUT',
        ...this._getHeaders()
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Error finalizando estudio');
      return data;
    } catch (error) {
      this._enableMockMode(error);
      if (this.isDevelopment) return { success: true };
      throw error;
    }
  }

  _filterProyectos(proyectos, filtros) {
    let resultado = proyectos;
    if (filtros.consejoComunal) {
      resultado = resultado.filter(p => p.consejoComunal === filtros.consejoComunal);
    }
    return resultado;
  }
}

// Instancia global
window.api = new APIManager();

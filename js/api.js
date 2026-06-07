/**
 * Módulo centralizado de API (SICAG v5.0)
 * Gestiona todas las llamadas a datos (simulado con seed.json local en desarrollo)
 */
class APIManager {
  constructor() {
    this.baseURL = 'http://localhost:3000/api'; // URL del backend real en Node.js
    this.mockData = null;
    this.isDevelopment = false; // Desactivado para conectar a producción
    this.initMockData();
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

  // Helper para headers
  _getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
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
    const response = await fetch(`${this.baseURL}/system/config`, this._getHeaders());
    const data = await response.json();
    return data.config || {};
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
    // En producción:
    const params = new URLSearchParams(filtros);
    const response = await fetch(`${this.baseURL}/habitantes?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching habitantes');
    return response.json();
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
    const response = await fetch(`${this.baseURL}/habitantes`, {
      method: 'POST',
      ...this._getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al crear habitante');
    return response.json();
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
      const response = await fetch(`${this.baseURL}/bandeja_validaciones/pendientes`, this._getHeaders());
      if (!response.ok) throw new Error('Error al obtener notificaciones');
      return response.json();
    }
    return [];
  }

  async aprobarNotificacion(id, comentarios) {
    if (!this.isDevelopment) {
      const response = await fetch(`${this.baseURL}/bandeja_validaciones/${id}/aprobar`, {
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
      const response = await fetch(`${this.baseURL}/bandeja_validaciones/${id}/rechazar`, {
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
    const response = await fetch(`${this.baseURL}/proyectos?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching proyectos');
    return response.json();
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
    const response = await fetch(`${this.baseURL}/noticias?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching noticias');
    return response.json();
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
    const response = await fetch(`${this.baseURL}/noticias`, {
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
    const response = await fetch(`${this.baseURL}/noticias/${id}`, {
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
    const response = await fetch(`${this.baseURL}/noticias/${id}`, {
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
        fetch(`${this.baseURL}/habitantes`, this._getHeaders()),
        fetch(`${this.baseURL}/viviendas`, this._getHeaders()),
        fetch(`${this.baseURL}/proyectos`, this._getHeaders())
      ]);
      
      const habitantes = habRes.ok ? await habRes.json() : [];
      const viviendas = vivRes.ok ? await vivRes.json() : [];
      const proyectos = proyRes.ok ? await proyRes.json() : [];
      
      return {
        habitantes: habitantes.length || 0,
        viviendas: viviendas.length || 0,
        proyectos: proyectos.length || 0,
        consejos: 8 // Valor base
      };
    } catch (e) {
      console.error("Error obteniendo stats del dashboard", e);
      return { habitantes: 0, viviendas: 0, proyectos: 0, consejos: 0 };
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
    const response = await fetch(`${this.baseURL}/estudios-demograficos/paso`, {
      method: 'POST',
      ...this._getHeaders(),
      body: JSON.stringify({ paso, id_estudio: idEstudio, datos })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Error en paso ${paso}`);
    return data;
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

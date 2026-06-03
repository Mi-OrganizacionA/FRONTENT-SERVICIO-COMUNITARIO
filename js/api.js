/**
 * Módulo centralizado de API (SICAG v5.0)
 * Gestiona todas las llamadas a datos (simulado con seed.json local en desarrollo)
 */
class APIManager {
  constructor() {
    this.baseURL = 'http://localhost:3000/api'; // URL para futuro backend real
    this.mockData = null;
    this.isDevelopment = true; // Forzamos true para prototipo sin node env
    this.initMockData();
  }

  // Cargar datos de ejemplo
  async initMockData() {
    try {
      // Cargamos el json local (fetch debe funcionar si servimos con LiveServer u otro server estático)
      const response = await fetch('data/seed.json');
      if (response.ok) {
        this.mockData = await response.json();
      } else {
        console.warn('No se pudo cargar seed.json (¿Estás abriendo el archivo localmente sin servidor?)');
        this.mockData = { habitantes: [], proyectos: [], noticias: [] };
      }
    } catch (error) {
      console.error('Error cargando datos de prueba:', error);
      this.mockData = { habitantes: [], proyectos: [], noticias: [] };
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
      return registro;
    }
  }

  async registrarHabitante(datos) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      const nuevoId = this.mockData.habitantes.length > 0 ? Math.max(...this.mockData.habitantes.map(h => h.id)) + 1 : 1;
      const registro = { id: nuevoId, ...datos, fechaRegistro: new Date().toISOString() };
      this.mockData.habitantes.push(registro);
      return registro;
    }
  }

  async getNotificaciones() {
    if (!this.isDevelopment) return [];
    const raw = localStorage.getItem('sicag_notificaciones');
    if (!raw) {
      const iniciales = [
        {
          id: 1,
          tipo: 'registro_habitante',
          titulo: 'Solicitud de registro de habitante',
          mensaje: 'El vocero Jobito I envió un nuevo registro de habitante para revisión.',
          status: 'pendiente',
          vocero: 'Vocero Jobito I',
          consejoComunal: 'Jobito I',
          fechaSolicitud: '2026-06-02T10:45:00Z',
          datosHabitante: {
            cedula: '99887766',
            nombre: 'Lucía',
            apellido: 'Rubio',
            edad: 34,
            genero: 'F',
            consejoComunal: 'Jobito I',
            clasificacion: 'adulto',
            elector: true,
            direccion: 'Av. Los Pinos 12',
            telefono: '+58412345678'
          },
          nota: ''
        }
      ];
      localStorage.setItem('sicag_notificaciones', JSON.stringify(iniciales));
      return iniciales;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('Error parseando notificaciones:', error);
      return [];
    }
  }

  async saveNotificaciones(notificaciones) {
    if (!this.isDevelopment) return;
    localStorage.setItem('sicag_notificaciones', JSON.stringify(notificaciones));
  }

  async crearNotificacion(notificacion) {
    const existentes = await this.getNotificaciones();
    const nuevoId = existentes.length > 0 ? Math.max(...existentes.map(n => n.id)) + 1 : 1;
    const nueva = { id: nuevoId, ...notificacion, createdAt: new Date().toISOString() };
    existentes.unshift(nueva);
    await this.saveNotificaciones(existentes);
    return nueva;
  }

  async actualizarNotificacion(id, cambios) {
    const existentes = await this.getNotificaciones();
    const index = existentes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Notificación no encontrada');
    existentes[index] = { ...existentes[index], ...cambios, updatedAt: new Date().toISOString() };
    await this.saveNotificaciones(existentes);
    return existentes[index];
  }

  async eliminarHabitante(id) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      this.mockData.habitantes = this.mockData.habitantes.filter(h => h.id !== id);
      return { success: true };
    }
  }

  // ─────────────────────────────────────────
  // PROYECTOS
  // ─────────────────────────────────────────
  async getProyectos(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return this._filterProyectos(this.mockData.proyectos, filtros);
    }
  }

  // ─────────────────────────────────────────
  // MÉTODOS AUXILIARES
  // ─────────────────────────────────────────
  _getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  _filterHabitantes(habitantes, filtros) {
    let resultado = habitantes;
    if (filtros.consejoComunal) {
      resultado = resultado.filter(h => h.consejoComunal === filtros.consejoComunal);
    }
    return resultado;
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

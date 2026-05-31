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
      const nuevoId = this.mockData.habitantes.length > 0 ? Math.max(...this.mockData.habitantes.map(h => h.id)) + 1 : 1;
      const nuevo = { id: nuevoId, ...datos, fechaRegistro: new Date().toISOString() };
      this.mockData.habitantes.push(nuevo);
      return nuevo;
    }
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

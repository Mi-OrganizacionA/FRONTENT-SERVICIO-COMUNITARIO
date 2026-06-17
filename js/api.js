/**
 * MÃ³dulo centralizado de API (SICAG v3.0)
 *
 * Mejoras de seguridad y robustez:
 * - Token leÃ­do desde window.auth.getToken() (memoria), nunca desde localStorage.
 * - Refresh automÃ¡tico de JWT al recibir 401 (PROBLEMA 2).
 * - Errores tipados con clase ApiError diferenciando 401/403/409/422/500 (PROBLEMA 6).
 * - Cola offline con deduplicaciÃ³n y lÃ­mite de tamaÃ±o (PROBLEMA 3).
 * - Mutex isSubmitting/isSyncing para prevenir race conditions (PROBLEMA 7).
 */

/**
 * Error tipado de la API con cÃ³digo HTTP y cÃ³digo de negocio.
 * Permite al frontend diferencial el tipo de error y reaccionar apropiadamente.
 */
class ApiError extends Error {
  constructor(mensaje, status, codigo, detalles = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;     // CÃ³digo HTTP (401, 409, 422, 500, etc.)
    this.codigo = codigo;     // CÃ³digo de negocio ('CEDULA_DUPLICADA', 'TOKEN_EXPIRED', etc.)
    this.detalles = detalles; // Array de detalles por campo (para errores 422)
  }
}

window.ApiError = ApiError;

class APIManager {
  constructor() {
    const host = window.location.hostname;
    this.isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || window.location.protocol === 'file:';
    this.baseURL = window.API_BASE_URL || (this.isLocal ? 'http://localhost:3000/api' : 'https://sicag-api.onrender.com/api');
    this.mockData = null;
    this.isDevelopment = Boolean(window.API_FORCE_MOCK || false);
    // Mutex para prevenir race conditions (PROBLEMA 7)
    this.isSyncing = false;
    this.isSubmitting = false;
    this.initMockData();
    // Sincronizar AMBAS colas al reconectar (censo + universal)
    window.addEventListener('online', () => {
      this._mostrarBannerOnline();
      this.flushPendingPasos();
      this.flushColaUniversal();
    });
    window.addEventListener('offline', () => this._mostrarBannerOffline());
    // Flush inicial de pendientes al cargar
    try { this.flushPendingPasos(); } catch(e) { /* ignore */ }
    try { this.flushColaUniversal(); } catch(e) { /* ignore */ }
    // Mostrar estado de conexiÃ³n actual
    if (!navigator.onLine) this._mostrarBannerOffline();
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
        console.warn('No se pudo cargar seed.json (Â¿EstÃ¡s abriendo el archivo localmente sin servidor?)');
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

  // Esperar a que initMockData termine si se llama rÃ¡pido
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
      console.warn('API no disponible, activando modo local de simulaciÃ³n:', error?.message || error);
      this.isDevelopment = true;
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // COLA OFFLINE â€” CENSO DEMOGRÃFICO (pasos de estudio)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** LÃ­mite mÃ¡ximo de Ã­tems en la cola offline para evitar saturar localStorage */
  get MAX_QUEUE_SIZE() { return 100; }

  _getPendingQueue() {
    try {
      const raw = localStorage.getItem('sicag_censo_queue');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  _savePendingQueue(queue) {
    try {
      const serializado = JSON.stringify(queue);
      if (serializado.length > 4 * 1024 * 1024) {
        console.error('[Cola Censo] Supera 4MB, algunos Ã­tems no se guardarÃ¡n.');
        window.dispatchEvent(new CustomEvent('censo:queueOverflow', { detail: { count: queue.length } }));
        return;
      }
      localStorage.setItem('sicag_censo_queue', serializado);
      window.dispatchEvent(new CustomEvent('censo:pendingCount', { detail: { count: queue.length } }));
    } catch (e) {
      console.error('[Cola Censo] No se pudo guardar:', e);
      window.dispatchEvent(new CustomEvent('censo:queueError', { detail: { error: e.message } }));
    }
  }

  /**
   * Encola un paso de censo para sincronizaciÃ³n futura.
   * Incluye deduplicaciÃ³n por paso + id_estudio.
   */
  _enqueuePendingPaso(paso, idEstudio, datos) {
    const queue = this._getPendingQueue();

    if (queue.length >= this.MAX_QUEUE_SIZE) {
      console.error('[Cola Censo] LÃ­mite alcanzado.');
      throw new Error('La cola de sincronizaciÃ³n estÃ¡ llena. ConÃ©ctate a internet para sincronizar.');
    }

    const indiceExistente = queue.findIndex(
      item => item.paso === paso && String(item.id_estudio) === String(idEstudio)
    );
    const nuevoItem = { paso, id_estudio: idEstudio, datos, ts: Date.now(), intentos: 0 };

    if (indiceExistente >= 0) {
      queue[indiceExistente] = nuevoItem;
      console.info(`[Cola Censo] Paso ${paso} actualizado (reemplazÃ³ duplicado).`);
    } else {
      queue.push(nuevoItem);
      console.info(`[Cola Censo] Paso ${paso} encolado. Total: ${queue.length}`);
    }
    this._savePendingQueue(queue);
  }

  /**
   * Sincroniza todos los pasos pendientes del censo.
   */
  async flushPendingPasos() {
    if (this.isSyncing) return;
    const queue = this._getPendingQueue();
    if (!queue.length) return;

    this.isSyncing = true;
    console.info(`[Cola Censo] Sincronizando ${queue.length} pasos...`);
    const remaining = [];
    let sincronizados = 0;

    try {
      for (const item of queue) {
        try {
          const resp = await this._fetch(`${this.baseURL}/estudios-demograficos/paso`, {
            method: 'POST',
            ...this._getHeaders(),
            body: JSON.stringify(item)
          });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          sincronizados++;
        } catch (e) {
          console.warn(`[Cola Censo] No se pudo sincronizar paso ${item.paso}:`, e.message);
          remaining.push({ ...item, intentos: (item.intentos || 0) + 1 });
        }
      }
    } finally {
      this._savePendingQueue(remaining);
      this.isSyncing = false;
      console.info(`[Cola Censo] Completado. OK: ${sincronizados}, Pendientes: ${remaining.length}`);
      window.dispatchEvent(new CustomEvent('censo:syncCompleted', {
        detail: { sincronizados, pendientes: remaining.length }
      }));
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // COLA OFFLINE UNIVERSAL â€” Todos los mÃ³dulos (habitantes, proyectos, etc.)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Obtiene la cola offline universal desde localStorage.
   * Esta cola aplica a TODOS los mÃ³dulos: habitantes, proyectos, producciÃ³n,
   * organizaciones, voceros, noticias y cualquier otro que registre datos.
   */
  _getColaUniversal() {
    try {
      const raw = localStorage.getItem('sicag_offline_queue');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  /**
   * Guarda la cola universal en localStorage.
   */
  _guardarColaUniversal(cola) {
    try {
      const serializado = JSON.stringify(cola);
      if (serializado.length > 3 * 1024 * 1024) {
        console.error('[Cola Universal] Supera 3MB. No se guardarÃ¡n mÃ¡s Ã­tems.');
        return;
      }
      localStorage.setItem('sicag_offline_queue', serializado);
      // Notificar conteo total combinado (censo + universal)
      const totalCenso = this._getPendingQueue().length;
      const totalUniversal = cola.length;
      window.dispatchEvent(new CustomEvent('offline:pendingCount', {
        detail: { total: totalCenso + totalUniversal, universal: totalUniversal, censo: totalCenso }
      }));
    } catch (e) {
      console.error('[Cola Universal] No se pudo guardar:', e);
    }
  }

  /**
   * Encola una operaciÃ³n fallida (cualquier mÃ³dulo) para sincronizaciÃ³n futura.
   *
   * @param {string} modulo   - Nombre del mÃ³dulo ('habitantes', 'proyectos', etc.)
   * @param {string} accion   - AcciÃ³n HTTP: 'POST', 'PUT', 'DELETE'
   * @param {string} endpoint - URL del endpoint relativo al baseURL
   * @param {object} datos    - Datos de la operaciÃ³n
   * @param {string|null} id  - ID del recurso (para PUT/DELETE)
   */
  _encolarOperacion(modulo, accion, endpoint, datos, id = null) {
    const cola = this._getColaUniversal();

    if (cola.length >= this.MAX_QUEUE_SIZE) {
      console.error('[Cola Universal] LÃ­mite alcanzado. No se puede encolar mÃ¡s operaciones.');
      throw new Error('La cola de sincronizaciÃ³n estÃ¡ llena. ConÃ©ctate a internet para sincronizar.');
    }

    // DeduplicaciÃ³n: mismo mÃ³dulo + acciÃ³n + id â†’ reemplazar
    const clave = `${modulo}|${accion}|${id || 'nuevo'}`;
    const indiceExistente = cola.findIndex(item => item.clave === clave);

    const nuevoItem = {
      clave,
      modulo,
      accion,
      endpoint,
      datos,
      id,
      ts: Date.now(),
      intentos: 0
    };

    if (indiceExistente >= 0) {
      cola[indiceExistente] = nuevoItem;
      console.info(`[Cola Universal] OperaciÃ³n ${accion} en ${modulo} actualizada (deduplicada).`);
    } else {
      cola.push(nuevoItem);
      console.info(`[Cola Universal] ${accion} en ${modulo} encolada. Total: ${cola.length}`);
    }

    this._guardarColaUniversal(cola);
  }

  /**
   * Sincroniza todas las operaciones pendientes de la cola universal.
   * Se ejecuta automÃ¡ticamente cuando el navegador detecta conexiÃ³n.
   */
  async flushColaUniversal() {
    if (this.isSyncing) {
      console.info('[Cola Universal] SincronizaciÃ³n ya en progreso.');
      return;
    }

    const cola = this._getColaUniversal();
    if (!cola.length) return;

    this.isSyncing = true;
    console.info(`[Cola Universal] Sincronizando ${cola.length} operaciones pendientes...`);

    const pendientes = [];
    let sincronizados = 0;

    try {
      for (const item of cola) {
        try {
          const url = `${this.baseURL}${item.endpoint}`;
          const opciones = {
            method: item.accion,
            ...this._getHeaders()
          };
          // Solo adjuntar body si no es DELETE
          if (item.accion !== 'DELETE' && item.datos) {
            opciones.body = JSON.stringify(item.datos);
          }

          const resp = await this._fetch(url, opciones);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          sincronizados++;
          console.info(`[Cola Universal] âœ… ${item.accion} ${item.modulo} sincronizado.`);
        } catch (e) {
          console.warn(`[Cola Universal] âŒ No se pudo sincronizar ${item.accion} ${item.modulo}:`, e.message);
          pendientes.push({ ...item, intentos: (item.intentos || 0) + 1 });
        }
      }
    } finally {
      this._guardarColaUniversal(pendientes);
      this.isSyncing = false;
      console.info(`[Cola Universal] Completado. OK: ${sincronizados}, Pendientes: ${pendientes.length}`);
      window.dispatchEvent(new CustomEvent('offline:syncCompleted', {
        detail: { sincronizados, pendientes: pendientes.length }
      }));
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // BANNER VISUAL ONLINE / OFFLINE
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Muestra un banner en la parte superior indicando que el dispositivo estÃ¡ offline.
   */
  _mostrarBannerOffline() {
    this._eliminarBannerEstado();
    const banner = document.createElement('div');
    banner.id = 'sicag-offline-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    banner.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:99999',
      'background:linear-gradient(90deg,#E65100,#F57C00)',
      'color:#fff', 'font-family:Poppins,sans-serif',
      'font-size:0.82rem', 'font-weight:600',
      'padding:0.55rem 1rem',
      'display:flex', 'align-items:center', 'justify-content:center', 'gap:0.5rem',
      'box-shadow:0 -2px 12px rgba(0,0,0,0.25)',
      'animation:slideUpBanner 0.3s ease'
    ].join(';');
    banner.innerHTML = `
      <span style="font-size:1rem">ðŸ“¡</span>
      <span>Sin conexiÃ³n a internet â€” Guardando localmente</span>
    `;
    // Insertar style de animaciÃ³n si no existe
    if (!document.getElementById('sicag-banner-style')) {
      const style = document.createElement('style');
      style.id = 'sicag-banner-style';
      style.textContent = '@keyframes slideUpBanner{from{transform:translateY(100%)}to{transform:translateY(0)}}';
      document.head.appendChild(style);
    }
    document.body.appendChild(banner);

    // Auto-ocultar despuÃ©s de 2 segundos
    setTimeout(() => {
      banner.style.animation = 'slideUpBanner 0.3s ease reverse forwards';
      setTimeout(() => this._eliminarBannerEstado(), 300);
    }, 2000);
  }

  /**
   * Muestra un banner verde temporal indicando que se recuperÃ³ la conexiÃ³n.
   */
  _mostrarBannerOnline() {
    this._eliminarBannerEstado();
    const banner = document.createElement('div');
    banner.id = 'sicag-offline-banner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:99999',
      'background:linear-gradient(90deg,#2E7D32,#43A047)',
      'color:#fff', 'font-family:Poppins,sans-serif',
      'font-size:0.82rem', 'font-weight:600',
      'padding:0.55rem 1rem',
      'display:flex', 'align-items:center', 'justify-content:center', 'gap:0.5rem',
      'box-shadow:0 -2px 12px rgba(0,0,0,0.25)',
      'animation:slideUpBanner 0.3s ease'
    ].join(';');
    banner.innerHTML = `
      <span style="font-size:1rem">âœ…</span>
      <span>ConexiÃ³n restaurada â€” Sincronizando...</span>
    `;
    document.body.appendChild(banner);
    // Auto-ocultar despuÃ©s de 4 segundos
    setTimeout(() => this._eliminarBannerEstado(), 4000);
  }

  /**
   * Elimina el banner de estado de red si existe.
   */
  _eliminarBannerEstado() {
    const banner = document.getElementById('sicag-offline-banner');
    if (banner) banner.remove();
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // AUTHENTICATION & SECURITY
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async changePassword(passwordActual, nuevaPassword) {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r({ success: true, message: 'Simulado' }), 500));
    }
    const response = await this._fetch(`${this.baseURL}/auth/password`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify({ passwordActual, nuevaPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al cambiar la contraseÃ±a');
    return data;
  }

  async changeEmail(nuevoEmail, passwordActual) {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r({ success: true, message: 'Simulado' }), 500));
    }
    const response = await this._fetch(`${this.baseURL}/auth/email`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify({ email: nuevoEmail, passwordActual })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al cambiar el correo');
    return data;
  }

  async getPerfil() {
    if (this.isDevelopment) {
      return { success: true, message: 'Simulado' };
    }
    const response = await this._fetch(`${this.baseURL}/auth/perfil`, this._getHeaders());
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al obtener el perfil');
    return data;
  }

  async updateProfile(datos) {
    if (this.isDevelopment) {
      return { success: true, message: 'Simulado' };
    }
    const response = await this._fetch(`${this.baseURL}/auth/perfil`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify(datos)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al actualizar el perfil');
    return data;
  }

  async requestCode(email) {
    if (this.isDevelopment) {
      console.log('Simulando envÃ­o de correo a:', email);
      return { success: true, message: 'CÃ³digo simulado' };
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
      console.log('Simulando reset de contraseÃ±a para:', email);
      return { success: true, message: 'ContraseÃ±a cambiada simulada' };
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
  async verifyPassword(password) {
    if (this.isDevelopment) return { success: true };
    const response = await this._fetch(`${this.baseURL}/auth/verify-password`, {
      method: 'POST',
      headers: { ...this._getHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
  
  async changeEmail(nuevoCorreo) {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r({ success: true }), 1000));
    }
    const response = await this._fetch(`${this.baseURL}/auth/email`, {
      method: 'PUT',
      headers: { ...this._getHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoCorreo })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // CONFIGURACIÃ“N DEL SISTEMA Y RECOVERY PASS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    // Usar token desde memoria (no desde localStorage)
    const token = window.auth?.getToken();
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // NOTIFICACIONES INTERNAS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getNotificaciones() {
    if (this.isDevelopment) return [];
    try {
      const response = await this._fetch(`${this.baseURL}/notificaciones`, this._getHeaders());
      const data = await response.json().catch(() => []);
      return Array.isArray(data) ? data : (data.pendientes || []);
    } catch (error) {
      if (this.isDevelopment) return [];
      throw error;
    }
  }

  async aprobarNotificacion(id, comentario = '') {
    if (this.isDevelopment) return { success: true };
    const response = await this._fetch(`${this.baseURL}/notificaciones/${id}`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify({ status: 'aceptado', nota: comentario })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Error al aprobar la notificaciÃ³n');
    return data;
  }

  async rechazarNotificacion(id, motivo = '') {
    if (this.isDevelopment) return { success: true };
    const response = await this._fetch(`${this.baseURL}/notificaciones/${id}`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify({ status: 'rechazado', nota: motivo })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Error al rechazar la notificaciÃ³n');
    return data;
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // HABITANTES
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getHabitantes(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return this._aplicarFiltroCC(this._filterHabitantes(this.mockData.habitantes, filtros));
    }
    const params = new URLSearchParams(filtros);
    try {
      const response = await this._fetch(`${this.baseURL}/habitantes?${params}`, this._getHeaders());
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error fetching habitantes');
      }
      const data = await response.json();
      return this._aplicarFiltroCC(data.habitantes || data);
    } catch (error) {
      if (this.isDevelopment) {
        return this._aplicarFiltroCC(this._filterHabitantes(this.mockData.habitantes, filtros));
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

  async buscarHabitanteRapido(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      await this.waitForMockData();
      if (this.isDevelopment) {
        const qNum = query.replace(/\D/g, '');
        return (this.mockData.habitantes || [])
          .filter(h => String(h.cedula).includes(qNum) || String(h.cedula).includes(query))
          .slice(0, 10);
      }
      const response = await this._fetch(`${this.baseURL}/habitantes/buscar/rapido?q=${encodeURIComponent(query.trim())}`, this._getHeaders());
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      if (this.isDevelopment) {
        const qNum = query.replace(/\D/g, '');
        return (this.mockData.habitantes || [])
          .filter(h => String(h.cedula).includes(qNum) || String(h.cedula).includes(query))
          .slice(0, 10);
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
    return await this._interceptarValidacion('habitantes', 'CREATE', datos, async () => {
      await this.waitForMockData();
      if (this.isDevelopment) {
        const usuario = window.auth?.getUser();
        const nuevoId = this.mockData.habitantes.length > 0 ? Math.max(...this.mockData.habitantes.map(h => h.id)) + 1 : 1;
        const registro = { id: nuevoId, ...datos, fechaRegistro: new Date().toISOString() };
        this.mockData.habitantes.push(registro);
        this.saveMockData();
        return registro;
      }
      
      const response = await this._fetch(`${this.baseURL}/habitantes`, {
        method: 'POST',
        ...this._getHeaders(),
        body: JSON.stringify(datos)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Error al crear habitante');
      return data;
    });
  }

  async registrarHabitante(datos) {
    return this.crearHabitante(datos); // Alias para crearHabitante
  }

  async actualizarHabitante(id, cambios) {
    return await this._interceptarValidacion('habitantes', 'UPDATE', { id, ...cambios }, async () => {
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
    });
  }

  async getNotificaciones() {
    if (!this.isDevelopment) {
      const user = window.auth ? window.auth.getUser() : null;
      const endpoint = (user && user.rol === 'vocero') ? '/validaciones/mis-solicitudes' : '/validaciones/pendientes';
      const response = await this._fetch(`${this.baseURL}${endpoint}`, this._getHeaders());
      if (!response.ok) throw new Error('Error al obtener notificaciones');
      return response.json();
    }
    return [];
  }

  async crearNotificacion(datos) {
    if (!this.isDevelopment) {
      const response = await fetch(`${this.baseURL}/validaciones`, {
        method: 'POST',
        ...this._getHeaders(),
        body: JSON.stringify(datos)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Error al crear solicitud');
      return data;
    }
    return { success: true, simulado: true, data: datos };
  }

  /**
   * Interceptor de validaciones:
   * Revisa si el usuario actual es un vocero y si debe pasar por la bandeja de validaciones
   * o si la "AprobaciÃ³n AutomÃ¡tica Global" estÃ¡ activa.
   *
   * MODO OFFLINE: Si no hay conexiÃ³n, encola la operaciÃ³n en la cola universal
   * para sincronizarla automÃ¡ticamente cuando vuelva internet.
   */
  async _interceptarValidacion(tabla, accion, datos, callbackOriginal) {
    const user = window.auth ? window.auth.getUser() : null;
    const isVocero = user && user.rol && user.rol.toLowerCase() === 'vocero';
    
    // Leer configuraciones (sincronizadas desde backend por getSystemConfig)
    const autoGlobal = localStorage.getItem('sicag_auto_global') === 'true';
    const autoModulo = localStorage.getItem(`sicag_auto_${tabla}`) === 'true';

    // Si es vocero y la aprobaciÃ³n automÃ¡tica NO estÃ¡ activa, va a la bandeja
    // EXCEPCIÃ“N: Cartelera/Noticias siempre va directo para que todos lo vean de inmediato
    if (isVocero && !autoGlobal && !autoModulo ) {
      console.log(`[API] Interceptado: Enviando ${accion} de ${tabla} a validaciones.`);
      const res = await this.crearNotificacion({
        tabla_afectada: tabla,
        tipo_accion: accion,
        id_vocero: user.id,
        datos_temporales: datos
      });

      // NotificaciÃ³n clara para que el Vocero sepa que no se ejecutÃ³ inmediatamente
      if (window.Components) {
        let accionText = accion === 'CREATE' ? 'CreaciÃ³n' : (accion === 'UPDATE' ? 'EdiciÃ³n' : 'EliminaciÃ³n');
        Components.showToast(`Solicitud de ${accionText} enviada a validaciÃ³n.`, 'info');
        
        // Bloquear temporalmente los mensajes de Ã©xito/error genÃ©ricos que tengan las vistas
        // para que no se sobreescriba el mensaje informativo anterior.
        const originalToast = Components.showToast;
        Components.showToast = function(msg, type) {
           if (type === 'success' || type === 'error') return; // ignoramos el Ã©xito/error falso
           originalToast.apply(this, arguments);
        };
        setTimeout(() => { Components.showToast = originalToast; }, 500);
      }

      return res;
    }

    // De lo contrario (es admin, o autoGlobal estÃ¡ activo), ejecutar directo
    console.log(`[API] EjecuciÃ³n directa permitida para ${accion} en ${tabla}.`);
    try {
      return await callbackOriginal();
    } catch (errorRed) {
      // Si el error es de red (sin conexiÃ³n), encolamos la operaciÃ³n en la cola universal
      const esErrorDeRed = !navigator.onLine ||
        errorRed?.message?.toLowerCase().includes('failed to fetch') ||
        errorRed?.message?.toLowerCase().includes('network') ||
        errorRed?.code === 0;

      if (esErrorDeRed) {
        // Mapear tabla â†’ endpoint de la API REST del backend
        const endpointMap = {
          'proyectos':           '/proyectos',
          'habitantes':          '/habitantes',
          'produccion_agricola': '/produccion_agricola',
          'organizaciones':      '/organizaciones',
          'voceros':             '/voceros',
          'noticias':            '/cartelera',
          'viviendas':           '/viviendas',
          'estudios_demograficos': '/estudios-demograficos',
        };
        const metodosMap = { CREATE: 'POST', UPDATE: 'PUT', DELETE: 'DELETE' };

        const endpoint      = endpointMap[tabla] || `/${tabla}`;
        const metodo        = metodosMap[accion] || 'POST';
        const id            = datos?.id || null;
        const endpointFinal = (metodo !== 'POST' && id) ? `${endpoint}/${id}` : endpoint;

        try {
          this._encolarOperacion(tabla, metodo, endpointFinal, datos, id);
          console.info(`[Cola Universal] ${accion} en ${tabla} guardada offline para sincronizar luego.`);

          // Notificar al usuario que se guardÃ³ offline
          if (window.Components?.showToast) {
            const accionText = accion === 'CREATE' ? 'Registro' : (accion === 'UPDATE' ? 'ActualizaciÃ³n' : 'EliminaciÃ³n');
            Components.showToast(
              `ðŸ“´ Sin conexiÃ³n â€” ${accionText} guardada localmente. Se sincronizarÃ¡ al reconectar.`,
              'warning'
            );
          }
          return { success: true, offline: true, encolado: true };
        } catch (colaError) {
          throw colaError; // Cola llena u otro error crÃ­tico
        }
      }

      // Si no es error de red, propagar el error original
      throw errorRed;
    }
  }

  async aprobarNotificacion(id, comentarios) {
    if (!this.isDevelopment) {
      const response = await fetch(`${this.baseURL}/validaciones/${id}/aprobar`, {
        method: 'PUT',
        ...this._getHeaders(),
        body: JSON.stringify({ comentarios })
      });
      if (!response.ok) throw new Error('Error al aprobar notificaciÃ³n');
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
      if (!response.ok) throw new Error('Error al rechazar notificaciÃ³n');
      return response.json();
    }
    return { success: true };
  }

  async eliminarHabitante(id) {
    return await this._interceptarValidacion('habitantes', 'DELETE', { id }, async () => {
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
    });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // PROYECTOS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getProyectos(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) {
      return this._aplicarFiltroCC(this._filterProyectos(this.mockData.proyectos, filtros));
    }
    const params = new URLSearchParams(filtros);
    try {
      const response = await this._fetch(`${this.baseURL}/proyectos?${params}`, this._getHeaders());
      if (!response.ok) throw new Error('Error fetching proyectos');
      const data = await response.json();
      return this._aplicarFiltroCC(data);
    } catch (error) {
      if (this.isDevelopment) {
        return this._aplicarFiltroCC(this._filterProyectos(this.mockData.proyectos, filtros));
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
      console.warn('API pÃºblica fallÃ³, usando datos locales como respaldo:', error.message);
      return this._filterProyectos(this.mockData?.proyectos || [], filtros);
    }
  }

  async crearProyecto(datos) {
    return await this._interceptarValidacion('proyectos', 'CREATE', datos, async () => {
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
    });
  }

  async actualizarProyecto(id, cambios) {
    return await this._interceptarValidacion('proyectos', 'UPDATE', { id, ...cambios }, async () => {
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
    });
  }

  async eliminarProyecto(id) {
    return await this._interceptarValidacion('proyectos', 'DELETE', { id }, async () => {
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
    });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // PRODUCCIÃ“N AGRÃCOLA
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getProduccion(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await this._fetch(`${this.baseURL}/produccion_agricola?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching produccion agricola');
    const data = await response.json();
    return this._aplicarFiltroCC(data);
  }

  async crearProduccion(datos) {
    return await this._interceptarValidacion('produccion_agricola', 'CREATE', datos, async () => {
      if (this.isDevelopment) return datos;
      const response = await fetch(`${this.baseURL}/produccion_agricola`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
      if (!response.ok) throw new Error('Error creando produccion agricola');
      return response.json();
    });
  }

  async actualizarProduccion(id, cambios) {
    return await this._interceptarValidacion('produccion_agricola', 'UPDATE', { id, ...cambios }, async () => {
      if (this.isDevelopment) return cambios;
      const response = await fetch(`${this.baseURL}/produccion_agricola/${id}`, { method: 'PUT', ...this._getHeaders(), body: JSON.stringify(cambios) });
      if (!response.ok) throw new Error('Error actualizando produccion agricola');
      return response.json();
    });
  }

  async eliminarProduccion(id) {
    return await this._interceptarValidacion('produccion_agricola', 'DELETE', { id }, async () => {
      if (this.isDevelopment) return { success: true };
      const response = await fetch(`${this.baseURL}/produccion_agricola/${id}`, { method: 'DELETE', ...this._getHeaders() });
      if (!response.ok) throw new Error('Error eliminando produccion agricola');
      return response.json();
    });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ORGANIZACIONES SOCIALES
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getOrganizaciones(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await this._fetch(`${this.baseURL}/organizaciones?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching organizaciones');
    const data = await response.json();
    return this._aplicarFiltroCC(data);
  }

  async crearOrganizacion(datos) {
    return await this._interceptarValidacion('organizaciones', 'CREATE', datos, async () => {
      if (this.isDevelopment) return datos;
      const response = await fetch(`${this.baseURL}/organizaciones`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error creando organizacion');
      }
      return response.json();
    });
  }

  async actualizarOrganizacion(id, cambios) {
    return await this._interceptarValidacion('organizaciones', 'UPDATE', { id, ...cambios }, async () => {
      if (this.isDevelopment) return cambios;
      const response = await fetch(`${this.baseURL}/organizaciones/${id}`, { method: 'PUT', ...this._getHeaders(), body: JSON.stringify(cambios) });
      if (!response.ok) throw new Error('Error actualizando organizacion');
      return response.json();
    });
  }

  async eliminarOrganizacion(id) {
    return await this._interceptarValidacion('organizaciones', 'DELETE', { id }, async () => {
      if (this.isDevelopment) return { success: true };
      const response = await fetch(`${this.baseURL}/organizaciones/${id}`, { method: 'DELETE', ...this._getHeaders() });
      if (!response.ok) throw new Error('Error eliminando organizacion');
      return response.json();
    });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // VIVIENDAS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getViviendas(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await this._fetch(`${this.baseURL}/viviendas?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching viviendas');
    const data = await response.json();
    return this._aplicarFiltroCC(data);
  }

  async crearVivienda(datos) {
    return await this._interceptarValidacion('viviendas', 'CREATE', datos, async () => {
      if (this.isDevelopment) return datos;
      const response = await fetch(`${this.baseURL}/viviendas`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
      if (!response.ok) throw new Error('Error creando vivienda');
      return response.json();
    });
  }

  async actualizarVivienda(id, cambios) {
    return await this._interceptarValidacion('viviendas', 'UPDATE', { id, ...cambios }, async () => {
      if (this.isDevelopment) return cambios;
      const response = await fetch(`${this.baseURL}/viviendas/${id}`, { method: 'PUT', ...this._getHeaders(), body: JSON.stringify(cambios) });
      if (!response.ok) throw new Error('Error actualizando vivienda');
      return response.json();
    });
  }

  async eliminarVivienda(id) {
    return await this._interceptarValidacion('viviendas', 'DELETE', { id }, async () => {
      if (this.isDevelopment) return { success: true };
      const response = await fetch(`${this.baseURL}/viviendas/${id}`, { method: 'DELETE', ...this._getHeaders() });
      if (!response.ok) throw new Error('Error eliminando vivienda');
      return response.json();
    });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // VOCEROS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getVoceros(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    const response = await this._fetch(`${this.baseURL}/voceros?${params}`, this._getHeaders());
    if (!response.ok) throw new Error('Error fetching voceros');
    const data = await response.json();
    return this._aplicarFiltroCC(data);
  }

  async crearVocero(datos) {
    return await this._interceptarValidacion('voceros', 'CREATE', datos, async () => {
      if (this.isDevelopment) return datos;
      const response = await fetch(`${this.baseURL}/voceros`, { method: 'POST', ...this._getHeaders(), body: JSON.stringify(datos) });
      if (!response.ok) throw new Error('Error creando vocero');
      return response.json();
    });
  }

  async eliminarVocero(id) {
    return await this._interceptarValidacion('voceros', 'DELETE', { id }, async () => {
      if (this.isDevelopment) return { success: true };
      const response = await fetch(`${this.baseURL}/voceros/${id}`, { method: 'DELETE', ...this._getHeaders() });
      if (!response.ok) throw new Error('Error eliminando vocero');
      return response.json();
    });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // NOTICIAS (CARTELERA DIGITAL)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getNoticias(filtros = {}) {
    await this.waitForMockData();
    if (this.isDevelopment) return this.mockData?.noticias || [];
    const params = new URLSearchParams(filtros);
    try {
      const response = await this._fetch(`${this.baseURL}/cartelera/publico/activas`, this._getHeaders());
      if (!response.ok) throw new Error('Error fetching noticias');
      const data = await response.json();
      return data;
    } catch (error) {
      if (this.isDevelopment) {
        return this.mockData?.noticias || [];
      }
      console.warn('No se pudo cargar noticias desde la API; usando datos locales:', error.message);
      return this.mockData?.noticias || [];
    }
  }

  async crearNoticia(datos) {
    return await this._interceptarValidacion('noticias', 'CREATE', datos, async () => {
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
    });
  }

  async actualizarNoticia(id, cambios) {
    return await this._interceptarValidacion('noticias', 'UPDATE', { id, ...cambios }, async () => {
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
    });
  }

  async eliminarNoticia(id) {
    return await this._interceptarValidacion('noticias', 'DELETE', { id }, async () => {
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
    });
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // DASHBOARD Y ESTADÃSTICAS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // BÃšSQUEDA GLOBAL
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async globalSearch(query) {
    if (!query || query.length < 2) return [];
    try {
      // Leer token desde memoria (no desde localStorage)
      const token = window.auth?.getToken();
      if (!token && !this.isDevelopment) throw new Error('NO_TOKEN');

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
            subtitulo: `Proyecto AgroecolÃ³gico - ${p.estado}`,
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
            subtitulo: `OrganizaciÃ³n - ${o.tipo}`,
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
            subtitulo: `PublicaciÃ³n`,
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
      console.error("Error en bÃºsqueda global", e);
      return [];
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // MÃ‰TODOS AUXILIARES
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Construye los headers de autenticaciÃ³n leyendo el token DESDE MEMORIA.
   * Nunca se accede a localStorage para el token (PROBLEMA 1 + 2).
   */
  _getHeaders() {
    // Token leÃ­do exclusivamente desde la instancia en memoria de AuthManager
    const token = window.auth?.getToken();
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      // credentials: 'include' es necesario para que el navegador envÃ­e la httpOnly cookie
      credentials: 'include'
    };
  }

  /**
   * Wrapper de fetch con:
   * - Refresh automÃ¡tico de token al recibir 401 (PROBLEMA 2)
   * - Errores tipados con ApiError diferenciando status HTTP (PROBLEMA 6)
   */
  async _fetch(url, options = {}) {
    try {
      const response = await fetch(url, { credentials: 'include', ...options });

      // Si el token expirÃ³, intentar refresh automÃ¡tico (PROBLEMA 2)
      if (response.status === 401) {
        const errData = await response.clone().json().catch(() => ({}));

        // Intentar renovar el token con el refreshToken (httpOnly cookie)
        if (window.auth) {
          console.info('[API] Token expirado, intentando refresh automÃ¡tico...');
          const nuevoToken = await window.auth.intentarRefresh();

          if (nuevoToken) {
            // Refresh exitoso: reintentar el request original con el nuevo token
            console.info('[API] Refresh exitoso, reintentando request original.');
            const opcionesActualizadas = {
              ...options,
              headers: {
                ...(options.headers || {}),
                'Authorization': `Bearer ${nuevoToken}`
              },
              credentials: 'include'
            };
            return await fetch(url, opcionesActualizadas);
          } else {
            // Refresh fallÃ³ â†’ sesiÃ³n expirada definitivamente
            console.warn('[API] Refresh fallido. Cerrando sesiÃ³n.');
            window.auth.token = null;
            window.auth.user = null;
            sessionStorage.removeItem('sicag_user');

            const esPublica = /index\.html$|consulta_habitantes\.html$|login\.html$|censo_viviendas\.html$/.test(window.location.pathname) ||
              window.location.pathname.endsWith('/');
            if (!esPublica) {
              alert(errData.error || 'Su sesiÃ³n ha expirado. Por favor inicie sesiÃ³n nuevamente.');
              window.location.href = 'login.html';
            }
            throw new ApiError('SesiÃ³n expirada', 401, 'TOKEN_EXPIRED');
          }
        }
      }

      return response;
    } catch (error) {
      // Si ya es un ApiError, propagarlo directamente
      if (error instanceof ApiError) throw error;
      this._enableMockMode(error);
      throw error;
    }
  }

  /**
   * Procesa una respuesta HTTP y lanza ApiError tipado si no fue exitosa.
   * Diferencia entre 401, 403, 409 (duplicado), 422 (validaciÃ³n) y 500 (PROBLEMA 6).
   */
  async _procesarRespuesta(response) {
    if (response.ok) return response;

    const cuerpo = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new ApiError(cuerpo.error || 'No autenticado', 401, 'NO_AUTENTICADO');
      case 403:
        throw new ApiError(cuerpo.error || 'Sin permisos suficientes', 403, 'SIN_PERMISO');
      case 404:
        throw new ApiError(cuerpo.error || 'Recurso no encontrado', 404, 'NO_ENCONTRADO');
      case 409:
        throw new ApiError(cuerpo.error || 'Registro duplicado', 409, 'DUPLICADO', cuerpo.details || null);
      case 422:
        throw new ApiError(cuerpo.error || 'Datos invÃ¡lidos', 422, 'VALIDACION', cuerpo.details || null);
      case 500:
      default:
        throw new ApiError(cuerpo.error || 'Error interno del servidor', response.status, 'ERROR_SERVIDOR');
    }
  }

  _aplicarFiltroCC(lista) {
    if (!Array.isArray(lista)) return lista;
    const user = window.auth ? window.auth.getUser() : null;
    if (user && user.rol && user.rol.toLowerCase() === 'vocero') {
      const ccName = user.consejoComunal;
      const ccId = user.id_comunidad_asignada;
      return lista.filter(item => {
        if (item.consejoComunal && ccName && item.consejoComunal === ccName) return true;
        if (item.comunidad && ccName && item.comunidad === ccName) return true;
        if (item.consejo_comunal_id && ccId && String(item.consejo_comunal_id) === String(ccId)) return true;
        if (item.id_comunidad && ccId && String(item.id_comunidad) === String(ccId)) return true;
        if (item.nombreConsejo && ccName && item.nombreConsejo === ccName) return true;
        return false;
      });
    }
    return lista;
  }

  _filterHabitantes(habitantes, filtros) {
    let resultado = habitantes;
    if (filtros.consejoComunal) {
      resultado = resultado.filter(h => h.consejoComunal === filtros.consejoComunal);
    }
    return resultado;
  }

  /**
   * Guarda un paso del censo en el servidor o en la cola offline si no hay red.
   * Usa mutex isSubmitting para prevenir envÃ­os concurrentes (PROBLEMA 7).
   */
  async guardarPasoCenso(paso, idEstudio, datos) {
    if (this.isDevelopment) {
      return new Promise(r => setTimeout(() => r({ success: true, id_estudio: idEstudio || Math.floor(Math.random() * 90000000) }), 500));
    }

    // Prevenir envÃ­os concurrentes del mismo paso (PROBLEMA 7)
    if (this.isSubmitting) {
      throw new Error('Ya hay un paso de censo en proceso de envÃ­o. Por favor espera.');
    }

    // Prevenir envÃ­o mientras se estÃ¡ sincronizando la cola
    if (this.isSyncing) {
      throw new Error('El sistema estÃ¡ sincronizando datos offline. Por favor espera un momento.');
    }

    this.isSubmitting = true;

    try {
      const response = await this._fetch(`${this.baseURL}/estudios-demograficos/paso`, {
        method: 'POST',
        ...this._getHeaders(),
        body: JSON.stringify({ paso, id_estudio: idEstudio, datos })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        // El body ya fue leÃ­do arriba: lanzar ApiError manualmente sin volver a leer
        throw new ApiError(
          data.error || `Error HTTP ${response.status}`,
          response.status,
          data.codigo || 'ERROR_SERVIDOR',
          data.details || null
        );
      }
      return data;
    } catch (error) {
      // Si es un ApiError (error del servidor), no encolamos, propagamos
      if (error instanceof ApiError && error.status !== 0) {
        throw error;
      }
      // Si falla por red (sin conexiÃ³n), encolar para sincronizar luego
      try {
        this._enqueuePendingPaso(paso, idEstudio, datos);
        console.info(`[CensoPaso] Sin conexiÃ³n. Paso ${paso} guardado en cola offline.`);
        return { success: true, id_estudio: idEstudio || Math.floor(Math.random() * 90000000), queued: true };
      } catch (queueError) {
        this._enableMockMode(error);
        if (this.isDevelopment) {
          return { success: true, id_estudio: idEstudio || Math.floor(Math.random() * 90000000) };
        }
        throw queueError;
      }
    } finally {
      // Siempre liberar el mutex, aunque haya error
      this.isSubmitting = false;
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

  // --- CENSO DEMOGRÁFICO (creación completa con validación) ---

  /**
   * Obtiene todos los estudios demográficos del backend.
   * Usado por la tabla del listado de censo_viviendas.html.
   */
  async getEstudiosDemograficos(filtros = {}) {
    if (this.isDevelopment) return [];
    const params = new URLSearchParams(filtros);
    try {
      const response = await this._fetch(`${this.baseURL}/estudios-demograficos?${params}`, this._getHeaders());
      if (!response.ok) throw new Error('Error fetching estudios demograficos');
      return await response.json();
    } catch (error) {
      this._enableMockMode(error);
      if (this.isDevelopment) return [];
      throw error;
    }
  }

  /**
   * Crea un censo demográfico completo (todas las 10 secciones).
   * Pasa por _interceptarValidacion: si el usuario es Vocero va a la Bandeja,
   * si es Admin o hay auto-aprobación se guarda directo.
   * 
   * @param {Object} datosCenso - Objeto con TODOS los datos de las 10 secciones del wizard.
   */
  async crearCensoDemografico(datosCenso) {
    return await this._interceptarValidacion('estudios_demograficos', 'CREATE', datosCenso, async () => {
      if (this.isDevelopment) return { success: true, id: Math.floor(Math.random() * 9000) + 1000 };
      const response = await fetch(`${this.baseURL}/estudios-demograficos`, {
        method: 'POST',
        ...this._getHeaders(),
        body: JSON.stringify(datosCenso)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Error al crear el censo demográfico');
      return data;
    });
  }

  /**
   * Elimina un censo demográfico.
   * Pasa por _interceptarValidacion: si el usuario es Vocero va a la Bandeja,
   * si es Admin o hay auto-aprobación se elimina directo.
   */
  async eliminarEstudioDemografico(id) {
    return await this._interceptarValidacion('estudios_demograficos', 'DELETE', { id }, async () => {
      if (this.isDevelopment) return { success: true };
      const response = await fetch(`${this.baseURL}/estudios-demograficos/${id}`, {
        method: 'DELETE',
        ...this._getHeaders()
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Error al eliminar el censo demográfico');
      return data;
    });
  }

  _filterProyectos(proyectos, filtros) {
    let resultado = proyectos;
    if (filtros.consejoComunal) {
      resultado = resultado.filter(p => p.consejoComunal === filtros.consejoComunal);
    }
    return resultado;
  }

  // --- CONTACTO ---
  async enviarContacto(datos) {
    if (this.isDevelopment) {
      return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000));
    }
    const response = await this._fetch(`${this.baseURL}/system/contacto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Error al enviar el mensaje');
    }
    return await response.json();
  }

  // --- CAMBIO DE CONTRASEÃ‘A ---
  async changePassword(passwordActual, nuevaPassword) {
    if (this.isDevelopment) {
      return new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'ContraseÃ±a actualizada (Mock)' }), 1000));
    }
    const response = await this._fetch(`${this.baseURL}/auth/password`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify({ passwordActual, nuevaPassword })
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Error al cambiar la contraseÃ±a');
    }
    return await response.json();
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // VIVIENDAS (Censo T2 â€” Infraestructura)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Obtiene todas las viviendas censadas del backend.
   * Si la API falla, retorna un array vacÃ­o para no romper la UI.
   * @param {Object} filtros - ParÃ¡metros de filtrado opcionales (ej. consejo_comunal_id)
   * @returns {Promise<Array>}
   */
  async getViviendas(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await this._fetch(`${this.baseURL}/viviendas?${params}`, this._getHeaders());
      if (!response.ok) throw new Error('Error cargando viviendas: ' + response.status);
      const data = await response.json();
      // El backend puede devolver array directo o { viviendas: [...] }
      return Array.isArray(data) ? data : (data.viviendas || []);
    } catch (error) {
      console.warn('[API] getViviendas fallÃ³, retornando array vacÃ­o:', error.message);
      return [];
    }
  }



  /**
   * Actualiza los datos de una vivienda existente.
   * @param {number} id - ID de la vivienda a actualizar
   * @param {Object} cambios - Campos a modificar
   * @returns {Promise<Object>} - La vivienda actualizada
   */
  async actualizarVivienda(id, cambios) {
    const response = await this._fetch(`${this.baseURL}/viviendas/${id}`, {
      method: 'PUT',
      ...this._getHeaders(),
      body: JSON.stringify(cambios)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Error al actualizar la vivienda');
    return data;
  }

  /**
   * Elimina una vivienda del sistema.
   * @param {number} id - ID de la vivienda a eliminar
   * @returns {Promise<Object>} - ConfirmaciÃ³n del servidor
   */
  async eliminarVivienda(id) {
    const response = await this._fetch(`${this.baseURL}/viviendas/${id}`, {
      method: 'DELETE',
      ...this._getHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Error al eliminar la vivienda');
    return data;
  }

  /**
   * Abre el PDF de la planilla de censo de una vivienda en una nueva pestaÃ±a.
   * Usa la ruta GET /api/viviendas/:id/exportar-pdf del backend (Puppeteer).
   * @param {number} id - ID de la vivienda
   */
  exportarPdfVivienda(id) {
    const token = window.auth?.getToken() || '';
    const url = `${this.baseURL}/viviendas/${id}/exportar-pdf?token=${token}`;
    window.open(url, '_blank');
  }
}

// Instancia global
window.api = new APIManager();

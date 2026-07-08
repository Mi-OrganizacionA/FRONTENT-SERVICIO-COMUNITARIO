/**
 * sicag-db.js — Módulo centralizado de IndexedDB para SICAG
 *
 * ESTRUCTURA DE LA BASE DE DATOS LOCAL:
 *
 * Object Store: 'habitantes'
 *   keyPath: 'id'
 *   índices: 'cedula' (unique), 'consejo_comunal_id'
 *
 * Object Store: 'proyectos'
 *   keyPath: 'id'
 *   índices: 'id_comunidad', 'estado'
 *
 * Object Store: 'noticias'
 *   keyPath: 'id'
 *   índices: 'publicado'
 *
 * Object Store: 'produccion_agricola'
 *   keyPath: 'id'
 *   índices: 'consejo_comunal_id'
 *
 * Object Store: 'organizaciones'
 *   keyPath: 'id'
 *   índices: 'id_comunidad'
 *   NOTA: En NeonDB la tabla se llama 'organizaciones_sociales'. Este store usa
 *   el alias 'organizaciones' para compatibilidad con el mapa de tablaAModelo.
 *   Usar el alias 'organizaciones' como clave del store en IndexedDB.
 *
 * Object Store: 'voceros'
 *   keyPath: 'id'
 *   índices: 'id_comunidad_asignada'
 *   NOTA: En NeonDB se almacena en la tabla 'usuarios' con rol='vocero'.
 *   El store 'voceros' en IndexedDB es una copia de los usuarios con ese rol.
 *
 * Object Store: 'consejos_comunales'
 *   keyPath: 'id'
 *
 * Object Store: 'cola_escritura'
 *   keyPath: 'clave' (string único = `${modulo}|${accion}|${id}`)
 *   — Migrado desde localStorage 'sicag_offline_queue'
 *
 * Object Store: 'cola_censo'
 *   keyPath: 'clave' (string único = `${paso}|${id_estudio}`)
 *   — Migrado desde localStorage 'sicag_censo_queue'
 *
 * Object Store: 'meta'
 *   keyPath: 'key'
 *   — Para guardar timestamps de última sincronización y otros metadatos
 */

(function() {
  'use strict';

  const DB_NAME    = 'sicag-offline';
  const DB_VERSION = 1;

  // Referencia a la instancia de la DB (singleton)
  let _db = null;

  /**
   * Abre (o crea) la base de datos IndexedDB.
   * Retorna una Promise que resuelve con la instancia de la DB.
   * IMPORTANTE: Llamar esto ANTES de cualquier operación de lectura/escritura.
   */
  async function abrirDB() {
    if (_db) return _db;

    // Verificar que idb esté disponible (cargado desde CDN)
    if (typeof idb === 'undefined') {
      console.error('[SicagDB] La librería idb no está disponible. Verificar que el script de idb se cargue antes que sicag-db.js');
      throw new Error('IndexedDB wrapper (idb) no disponible');
    }

    _db = await idb.openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`[SicagDB] Actualizando schema de v${oldVersion} a v${newVersion}`);

        // ── habitantes ──────────────────────────────────────────────────────
        if (!db.objectStoreNames.contains('habitantes')) {
          const hab = db.createObjectStore('habitantes', { keyPath: 'id' });
          hab.createIndex('cedula', 'cedula', { unique: false }); // No unique porque pueden haber cédulas con V y sin V
          hab.createIndex('consejo_comunal_id', 'consejo_comunal_id', { unique: false });
        }

        // ── proyectos ───────────────────────────────────────────────────────
        if (!db.objectStoreNames.contains('proyectos')) {
          const proy = db.createObjectStore('proyectos', { keyPath: 'id' });
          proy.createIndex('id_comunidad', 'id_comunidad', { unique: false });
          proy.createIndex('estado', 'estado', { unique: false });
        }

        // ── noticias ────────────────────────────────────────────────────────
        if (!db.objectStoreNames.contains('noticias')) {
          const not = db.createObjectStore('noticias', { keyPath: 'id' });
          not.createIndex('publicado', 'publicado', { unique: false });
        }

        // ── produccion_agricola ─────────────────────────────────────────────
        if (!db.objectStoreNames.contains('produccion_agricola')) {
          const prod = db.createObjectStore('produccion_agricola', { keyPath: 'id' });
          prod.createIndex('consejo_comunal_id', 'consejo_comunal_id', { unique: false });
        }

        // ── organizaciones ──────────────────────────────────────────────────
        if (!db.objectStoreNames.contains('organizaciones')) {
          const org = db.createObjectStore('organizaciones', { keyPath: 'id' });
          org.createIndex('id_comunidad', 'id_comunidad', { unique: false });
        }

        // ── viviendas ──────────────────────────────────────────────────
        if (!db.objectStoreNames.contains('viviendas')) {
          const viv = db.createObjectStore('viviendas', { keyPath: 'id' });
          // NOTA: en NeonDB el campo es 'id_comunidad' (no 'consejo_comunal_id')
          viv.createIndex('id_comunidad', 'id_comunidad', { unique: false });
          viv.createIndex('consejo_comunal_id', 'consejo_comunal_id', { unique: false });
        }

        // ── voceros ─────────────────────────────────────────────────────────
        if (!db.objectStoreNames.contains('voceros')) {
          const voc = db.createObjectStore('voceros', { keyPath: 'id' });
          voc.createIndex('id_comunidad_asignada', 'id_comunidad_asignada', { unique: false });
        }

        // ── consejos_comunales ──────────────────────────────────────────────
        if (!db.objectStoreNames.contains('consejos_comunales')) {
          db.createObjectStore('consejos_comunales', { keyPath: 'id' });
        }

        // ── cola_escritura ──────────────────────────────────────────────────
        // Reemplaza 'sicag_offline_queue' de localStorage
        if (!db.objectStoreNames.contains('cola_escritura')) {
          db.createObjectStore('cola_escritura', { keyPath: 'clave' });
        }

        // ── cola_censo ──────────────────────────────────────────────────────
        // Reemplaza 'sicag_censo_queue' de localStorage
        if (!db.objectStoreNames.contains('cola_censo')) {
          db.createObjectStore('cola_censo', { keyPath: 'clave' });
        }

        // ── meta ────────────────────────────────────────────────────────────
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
      blocked() {
        console.warn('[SicagDB] La base de datos está bloqueada por otra pestaña. Cerrar las demás pestañas e intentar de nuevo.');
      },
      blocking() {
        // Esta instancia está bloqueando una actualización de schema en otra pestaña
        console.warn('[SicagDB] Esta pestaña está bloqueando una actualización. Cerrando conexión...');
        _db?.close();
        _db = null;
      },
    });

    console.log('[SicagDB] Base de datos local abierta correctamente.');
    return _db;
  }

  // ── OPERACIONES GENÉRICAS ──────────────────────────────────────────────────

  /**
   * Guarda un array completo de registros en un store, reemplazando todo.
   * Usado para sincronización completa tras cargar datos del servidor.
   *
   * @param {string} storeName - Nombre del object store
   * @param {Array}  registros - Array de objetos a guardar
   */
  async function guardarTodos(storeName, registros) {
    if (!Array.isArray(registros) || registros.length === 0) return;
    const db = await abrirDB();
    const tx = db.transaction(storeName, 'readwrite');
    // Borrar todo primero y luego insertar (reemplazar snapshot completo)
    await tx.store.clear();
    await Promise.all(registros.map(r => tx.store.put(r)));
    await tx.done;
    // Guardar timestamp de última sincronización
    await guardarMeta(`last_sync_${storeName}`, Date.now());
    console.log(`[SicagDB] ${registros.length} registros guardados en '${storeName}'.`);
  }

  /**
   * Obtiene todos los registros de un store.
   *
   * @param {string} storeName - Nombre del object store
   * @returns {Array} Array de todos los registros
   */
  async function obtenerTodos(storeName) {
    const db = await abrirDB();
    return db.getAll(storeName);
  }

  /**
   * Obtiene un registro por su clave primaria (id).
   *
   * @param {string} storeName - Nombre del object store
   * @param {number|string} id - Clave primaria
   * @returns {Object|undefined}
   */
  async function obtenerPorId(storeName, id) {
    const db = await abrirDB();
    return db.get(storeName, id);
  }

  /**
   * Guarda o actualiza un único registro.
   *
   * @param {string} storeName - Nombre del object store
   * @param {Object} registro  - Objeto con el keyPath incluido
   */
  async function guardarUno(storeName, registro) {
    const db = await abrirDB();
    await db.put(storeName, registro);
  }

  /**
   * Elimina un registro por su clave primaria.
   *
   * @param {string} storeName - Nombre del object store
   * @param {number|string} id - Clave primaria
   */
  async function eliminarUno(storeName, id) {
    const db = await abrirDB();
    await db.delete(storeName, id);
  }

  /**
   * Cuenta los registros en un store.
   *
   * @param {string} storeName - Nombre del object store
   * @returns {number}
   */
  async function contarRegistros(storeName) {
    const db = await abrirDB();
    return db.count(storeName);
  }

  /**
   * Busca registros usando un índice.
   *
   * @param {string} storeName  - Nombre del object store
   * @param {string} indexName  - Nombre del índice
   * @param {*}      valor      - Valor a buscar
   * @returns {Array}
   */
  async function buscarPorIndice(storeName, indexName, valor) {
    const db = await abrirDB();
    return db.getAllFromIndex(storeName, indexName, valor);
  }

  // ── METADATOS ──────────────────────────────────────────────────────────────

  async function guardarMeta(key, value) {
    const db = await abrirDB();
    await db.put('meta', { key, value, ts: Date.now() });
  }

  async function obtenerMeta(key) {
    const db = await abrirDB();
    const entry = await db.get('meta', key);
    return entry?.value;
  }

  /**
   * Retorna cuántos segundos han pasado desde la última sincronización del store.
   * Retorna Infinity si nunca se sincronizó.
   */
  async function segundosDesdeSincronizacion(storeName) {
    const ts = await obtenerMeta(`last_sync_${storeName}`);
    if (!ts) return Infinity;
    return Math.floor((Date.now() - ts) / 1000);
  }

  // ── COLA DE ESCRITURA (Reemplaza sicag_offline_queue de localStorage) ──────

  /**
   * Agrega una operación a la cola de escritura.
   * Si ya existe una operación con la misma clave (mismo módulo+acción+id), la reemplaza.
   *
   * @param {Object} operacion - { clave, modulo, accion, endpoint, datos, id, ts, intentos }
   */
  async function encolarEscritura(operacion) {
    const db = await abrirDB();
    const item = {
      ...operacion,
      ts: operacion.ts || Date.now(),
      intentos: operacion.intentos || 0,
    };
    await db.put('cola_escritura', item);
    console.info(`[SicagDB] Operación encolada: ${item.clave}`);
    _notificarConteoColaEscritura();
  }

  /**
   * Obtiene todas las operaciones pendientes de escritura.
   */
  async function obtenerColaEscritura() {
    const db = await abrirDB();
    return db.getAll('cola_escritura');
  }

  /**
   * Elimina una operación de la cola (tras sincronización exitosa).
   */
  async function eliminarDeColaEscritura(clave) {
    const db = await abrirDB();
    await db.delete('cola_escritura', clave);
  }

  /**
   * Actualiza el contador de intentos de una operación.
   */
  async function actualizarIntentosEscritura(clave, intentos) {
    const db = await abrirDB();
    const item = await db.get('cola_escritura', clave);
    if (item) {
      item.intentos = intentos;
      await db.put('cola_escritura', item);
    }
  }

  async function _notificarConteoColaEscritura() {
    try {
      const cola = await obtenerColaEscritura();
      window.dispatchEvent(new CustomEvent('offline:pendingCount', {
        detail: { total: cola.length, universal: cola.length, censo: 0 }
      }));
    } catch (e) { /* ignorar */ }
  }

  // ── COLA DE CENSO (Reemplaza sicag_censo_queue de localStorage) ────────────

  async function encolarCenso(item) {
    const db = await abrirDB();
    await db.put('cola_censo', {
      ...item,
      ts: item.ts || Date.now(),
      intentos: item.intentos || 0,
    });
    console.info(`[SicagDB] Paso de censo encolado: ${item.clave}`);
  }

  async function obtenerColaCenso() {
    const db = await abrirDB();
    return db.getAll('cola_censo');
  }

  async function eliminarDeColaCenso(clave) {
    const db = await abrirDB();
    await db.delete('cola_censo', clave);
  }

  // ── MIGRACIÓN DESDE localStorage ──────────────────────────────────────────

  /**
   * Migra las colas existentes en localStorage a IndexedDB.
   * Llamar una sola vez al inicializar. No borra localStorage hasta confirmar migración.
   */
  async function migrarDesdeLocalStorage() {
    try {
      const db = await abrirDB();

      // Migrar cola_escritura
      const rawUniversal = localStorage.getItem('sicag_offline_queue');
      if (rawUniversal) {
        const items = JSON.parse(rawUniversal);
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            if (item.clave) {
              await db.put('cola_escritura', item);
            }
          }
          console.log(`[SicagDB] Migrados ${items.length} ítems de cola_escritura desde localStorage.`);
          localStorage.removeItem('sicag_offline_queue');
        }
      }

      // Migrar cola_censo
      const rawCenso = localStorage.getItem('sicag_censo_queue');
      if (rawCenso) {
        const items = JSON.parse(rawCenso);
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            // La clave del censo era paso|id_estudio
            const clave = `${item.paso}|${item.id_estudio}`;
            await db.put('cola_censo', { ...item, clave });
          }
          console.log(`[SicagDB] Migrados ${items.length} pasos de censo desde localStorage.`);
          localStorage.removeItem('sicag_censo_queue');
        }
      }
    } catch (err) {
      console.error('[SicagDB] Error durante migración desde localStorage:', err);
      // No lanzar error — la migración falla silenciosamente para no romper el login
    }
  }

  // ── API PÚBLICA ────────────────────────────────────────────────────────────

  window.SicagDB = {
    // Inicialización
    abrirDB,
    migrarDesdeLocalStorage,

    // Operaciones genéricas
    guardarTodos,
    obtenerTodos,
    obtenerPorId,
    guardarUno,
    eliminarUno,
    contarRegistros,
    buscarPorIndice,

    // Metadatos
    guardarMeta,
    obtenerMeta,
    segundosDesdeSincronizacion,

    // Cola de escritura (reemplaza localStorage)
    encolarEscritura,
    obtenerColaEscritura,
    eliminarDeColaEscritura,
    actualizarIntentosEscritura,

    // Cola de censo
    encolarCenso,
    obtenerColaCenso,
    eliminarDeColaCenso,
  };

  console.log('[SicagDB] Módulo cargado. Llamar SicagDB.abrirDB() para inicializar.');
})();

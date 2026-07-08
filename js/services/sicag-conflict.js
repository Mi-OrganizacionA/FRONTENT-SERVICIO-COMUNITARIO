/**
 * sicag-conflict.js — Módulo de detección y resolución de conflictos offline
 *
 * Este módulo maneja los casos donde una operación offline falla al sincronizar
 * porque otro usuario ya realizó un cambio en el mismo registro.
 *
 * ESTRATEGIA DE RESOLUCIÓN:
 *
 * 1. Error 409 (Conflict) al sincronizar → el registro ya existe (cédula duplicada, etc.)
 *    → Guardar como "conflicto pendiente" en IndexedDB
 *    → Notificar al admin
 *    → El admin decide: mantener el existente, usar el nuevo, o fusionar
 *
 * 2. Error 404 al hacer PUT/DELETE → el registro fue eliminado por otro usuario mientras
 *    este estaba offline
 *    → Eliminar de la cola silenciosamente (ya no existe qué editar)
 *    → Notificar al vocero que el registro ya no existe
 *
 * 3. Error 422 (Validation) → los datos de la operación offline ya no son válidos
 *    → Descartar la operación y notificar al vocero
 */

(function() {
  'use strict';

  const STORE_CONFLICTOS = 'meta'; // Guardamos conflictos en el store 'meta' de SicagDB
  const KEY_CONFLICTOS   = 'conflictos_pendientes';

  /**
   * Registra un conflicto en IndexedDB.
   *
   * @param {Object} operacion - La operación de la cola que generó el conflicto
   * @param {number} httpStatus - El código HTTP del error (409, 404, 422)
   * @param {string} mensajeServidor - El mensaje de error del servidor
   */
  async function registrarConflicto(operacion, httpStatus, mensajeServidor) {
    if (!window.SicagDB) return;

    try {
      // Cargar conflictos existentes
      const existentes = await window.SicagDB.obtenerMeta(KEY_CONFLICTOS) || [];

      const nuevoConflicto = {
        id: `conf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        operacion,          // La operación que falló (modulo, accion, datos, etc.)
        httpStatus,         // 409, 404, 422
        mensajeServidor,    // Mensaje del backend
        ts: Date.now(),     // Cuándo ocurrió
        resuelta: false,    // El admin aún no la revisó
        resolucion: null,   // 'mantener_existente' | 'usar_nuevo' | 'descartar'
      };

      existentes.push(nuevoConflicto);
      await window.SicagDB.guardarMeta(KEY_CONFLICTOS, existentes);

      console.warn(`[Conflicto] Registrado: ${operacion.modulo} ${operacion.accion} → HTTP ${httpStatus}`);

      // Disparar evento para que la UI lo muestre
      window.dispatchEvent(new CustomEvent('offline:conflictoDetectado', {
        detail: nuevoConflicto
      }));
    } catch (err) {
      console.error('[Conflicto] Error registrando conflicto:', err);
    }
  }

  /**
   * Obtiene todos los conflictos no resueltos.
   */
  async function obtenerConflictos() {
    if (!window.SicagDB) return [];
    const todos = await window.SicagDB.obtenerMeta(KEY_CONFLICTOS) || [];
    return todos.filter(c => !c.resuelta);
  }

  /**
   * Obtiene el conteo de conflictos no resueltos.
   */
  async function contarConflictos() {
    const lista = await obtenerConflictos();
    return lista.length;
  }

  /**
   * Marca un conflicto como resuelto.
   *
   * @param {string} conflictoId - ID del conflicto
   * @param {string} resolucion - 'mantener_existente' | 'usar_nuevo' | 'descartar'
   */
  async function resolverConflicto(conflictoId, resolucion) {
    if (!window.SicagDB) return;

    const todos = await window.SicagDB.obtenerMeta(KEY_CONFLICTOS) || [];
    const conflicto = todos.find(c => c.id === conflictoId);

    if (!conflicto) {
      console.warn('[Conflicto] No se encontró el conflicto:', conflictoId);
      return;
    }

    conflicto.resuelta = true;
    conflicto.resolucion = resolucion;
    conflicto.ts_resolucion = Date.now();

    // Si la resolución es 'usar_nuevo', reencolar la operación con force=true
    if (resolucion === 'usar_nuevo') {
      await _forzarOperacion(conflicto.operacion);
    }

    await window.SicagDB.guardarMeta(KEY_CONFLICTOS, todos);
    console.info(`[Conflicto] Resuelto ${conflictoId} → ${resolucion}`);

    window.dispatchEvent(new CustomEvent('offline:conflictoResuelto', {
      detail: { conflictoId, resolucion }
    }));
  }

  /**
   * Fuerza la ejecución de una operación ignorando conflictos (para 'usar_nuevo').
   * Agrega un header especial que le indica al backend que sobrescriba.
   */
  async function _forzarOperacion(operacion) {
    if (!window.api) return;
    try {
      const url = `${window.api.baseURL}${operacion.endpoint}`;
      const headers = {
        ...window.api._getHeaders().headers,
        'X-Force-Overwrite': 'true' // Header personalizado — el backend debe soportarlo
      };
      const opciones = {
        method: operacion.accion,
        headers,
        credentials: 'include',
      };
      if (operacion.accion !== 'DELETE' && operacion.datos) {
        opciones.body = JSON.stringify(operacion.datos);
      }
      const resp = await fetch(url, opciones);
      if (resp.ok) {
        console.info('[Conflicto] Operación forzada exitosamente.');
      } else {
        console.warn('[Conflicto] La operación forzada también falló:', resp.status);
      }
    } catch (err) {
      console.error('[Conflicto] Error en operación forzada:', err);
    }
  }

  /**
   * Limpia conflictos resueltos más viejos de 30 días.
   * Llamar periódicamente para no saturar IndexedDB.
   */
  async function limpiarConflictosAntiguos() {
    if (!window.SicagDB) return;
    const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
    const todos = await window.SicagDB.obtenerMeta(KEY_CONFLICTOS) || [];
    const filtrados = todos.filter(c =>
      !c.resuelta || (Date.now() - c.ts_resolucion) < TREINTA_DIAS
    );
    if (filtrados.length < todos.length) {
      await window.SicagDB.guardarMeta(KEY_CONFLICTOS, filtrados);
      console.info(`[Conflicto] Limpiados ${todos.length - filtrados.length} conflictos antiguos.`);
    }
  }

  // API pública
  window.SicagConflictos = {
    registrarConflicto,
    obtenerConflictos,
    contarConflictos,
    resolverConflicto,
    limpiarConflictosAntiguos,
  };

  console.log('[SicagConflictos] Módulo cargado.');
})();

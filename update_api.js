const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'js/api.js');
let content = fs.readFileSync(apiPath, 'utf8');

// --- PASO 3.2 y 3.8 ---
// Reemplazar _encolarOperacion
const oldEncolar = `
  async _encolarOperacion(modulo, accion, endpoint, datos, id = null) {
    if (!this._dbIniciada || !window.SicagDB) {
      console.warn('[Cola Universal] No se puede encolar: IndexedDB no disponible.');
      return;
    }

    const clave = \`\${modulo}|\${accion}|\${id || 'nuevo'}\`;
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

    try {
      await window.SicagDB.encolarEscritura(nuevoItem);
    } catch (e) {
      console.error('[Cola Universal] Error al encolar operación:', e);
      throw new Error('No se pudo guardar la operación offline.');
    }
  }`;

const newEncolar = `
  async _encolarOperacion(modulo, accion, endpoint, datos, id = null) {
    if (!this._dbIniciada || !window.SicagDB) {
      console.warn('[Cola Universal] No se puede encolar: IndexedDB no disponible.');
      return;
    }

    const clave = \`\${modulo}|\${accion}|\${id || 'nuevo'}\`;
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

    try {
      await window.SicagDB.encolarEscritura(nuevoItem);
    } catch (e) {
      console.error('[Cola Universal] Error al encolar operación:', e);
      throw new Error('No se pudo guardar la operación offline.');
    }

    // ── Registrar Background Sync para que el SW lo ejecute aunque la app se cierre ──
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(reg => {
          reg.sync.register('sicag-sync-escritura').then(() => {
            console.info('[Cola] Background Sync registrado: sicag-sync-escritura');
          }).catch(err => {
            console.warn('[Cola] No se pudo registrar Background Sync:', err.message);
          });
        });
      }
    } catch (syncErr) {
      // Background Sync no soportado en este navegador — ignorar silenciosamente
    }

    // Actualizar el badge visual de pendientes
    this._actualizarBadgePendientes();
  }`;

// Note: Reemplazamos quitando espacios iniciales para mayor seguridad
content = content.replace(
  /async _encolarOperacion[\s\S]*?throw new Error\('No se pudo guardar la operaci[\s\S]*?'\);\s*?\n\s*?\}/,
  newEncolar.trim()
);

// --- PASO 3.4 y 3.10 y Badge ---
const oldFlushColaUniversalRegex = /async flushColaUniversal\(\) \{[\s\S]*?detail: \{ sincronizados \}\s*\}\)\);\s*\}/;

const newFlushColaUniversal = `async flushColaUniversal() {
    if (this.isSyncing) {
      console.info('[Cola] Sincronización ya en progreso.');
      return;
    }

    // Verificar que hay conexión real antes de intentar
    if (!navigator.onLine) {
      console.info('[Cola] Sin conexión. Flush cancelado.');
      return;
    }

    let cola = [];
    if (this._dbIniciada && window.SicagDB) {
      cola = await window.SicagDB.obtenerColaEscritura();
    } else {
      try {
        cola = JSON.parse(localStorage.getItem('sicag_offline_queue') || '[]');
      } catch (e) { cola = []; }
    }

    if (!cola.length) {
      console.info('[Cola] Cola vacía, nada que sincronizar.');
      return;
    }

    this.isSyncing = true;
    console.info(\`[Cola] Sincronizando \${cola.length} operaciones pendientes...\`);

    const MAX_INTENTOS = 5; // Después de 5 fallos, marcar como fallida y abandonar
    let sincronizados = 0;
    let fallidas = 0;
    let abandonadas = 0;

    try {
      for (const item of cola) {
        // Si ya superó el límite de intentos, marcar como fallida y saltar
        if ((item.intentos || 0) >= MAX_INTENTOS) {
          console.warn(\`[Cola] Operación \${item.clave} superó \${MAX_INTENTOS} intentos. Marcando como fallida.\`);
          abandonadas++;
          // Eliminar de la cola para no bloquear las demás
          if (this._dbIniciada && window.SicagDB) {
            await window.SicagDB.eliminarDeColaEscritura(item.clave);
          }
          // Notificar al usuario de la operación fallida
          window.dispatchEvent(new CustomEvent('offline:operacionFallida', {
            detail: { item, motivo: 'max_intentos_alcanzados' }
          }));
          continue;
        }

        try {
          const url = \`\${this.baseURL}\${item.endpoint}\`;
          const opciones = { method: item.accion, ...this._getHeaders() };
          if (item.accion !== 'DELETE' && item.datos) {
            opciones.body = JSON.stringify(item.datos);
          }

          const resp = await this._fetch(url, opciones);

          // 409 = conflicto (registro duplicado) — también se considera éxito (ya existe)
          if (resp.ok || resp.status === 409) {
            if (this._dbIniciada && window.SicagDB) {
              await window.SicagDB.eliminarDeColaEscritura(item.clave);
            }
            sincronizados++;
            console.info(\`[Cola] ✅ \${item.accion} \${item.modulo} sincronizado.\`);
          } else {
            throw new Error(\`HTTP \${resp.status}\`);
          }
        } catch (e) {
          console.warn(\`[Cola] ❌ Intento \${(item.intentos || 0) + 1}/\${MAX_INTENTOS} para \${item.clave}:\`, e.message);
          if (this._dbIniciada && window.SicagDB) {
            await window.SicagDB.actualizarIntentosEscritura(item.clave, (item.intentos || 0) + 1);
          }
          fallidas++;
        }
      }
    } finally {
      this.isSyncing = false;

      const resumen = { sincronizados, fallidas, abandonadas };
      console.info(\`[Cola] Flush completado. OK: \${sincronizados}, Fallidas: \${fallidas}, Abandonadas: \${abandonadas}\`);

      window.dispatchEvent(new CustomEvent('offline:syncCompleted', { detail: resumen }));

      // Actualizar badge de pendientes
      this._actualizarBadgePendientes();
    }
  }

  /**
   * Actualiza el badge visual con el conteo actual de pendientes.
   * Se llama después de cada flush y después de cada encolar.
   */
  async _actualizarBadgePendientes() {
    try {
      let total = 0;
      if (this._dbIniciada && window.SicagDB) {
        const cola = await window.SicagDB.obtenerColaEscritura();
        total = cola.length;
      }
      window.dispatchEvent(new CustomEvent('offline:pendingCount', {
        detail: { total }
      }));
    } catch (e) { /* ignorar */ }
  }`;

content = content.replace(oldFlushColaUniversalRegex, newFlushColaUniversal);

// PASO 3.10
const oldCensoQueueRegex = /async flushPendingPasos\(\) \{[\s\S]*?\}\)\);\s*\}/;

const newFlushPendingPasos = `async flushPendingPasos() {
    const cola = this._dbIniciada && window.SicagDB
      ? await window.SicagDB.obtenerColaCenso()
      : (() => {
          try {
            const raw = localStorage.getItem('sicag_censo_queue');
            return raw ? JSON.parse(raw) : [];
          } catch (e) { return []; }
        })();

    if (!cola.length) return;

    console.info(\`[Cola Censo] Sincronizando \${cola.length} pasos pendientes...\`);
    let sincronizados = 0;

    for (const item of cola) {
      try {
        const resp = await this._fetch(\`\${this.baseURL}/estudios-demograficos/paso\`, {
          method: 'POST',
          ...this._getHeaders(),
          body: JSON.stringify({ paso: item.paso, id_estudio: item.id_estudio, datos: item.datos })
        });
        if (!resp.ok) throw new Error(\`HTTP \${resp.status}\`);

        // Eliminar de la cola
        if (this._dbIniciada && window.SicagDB) {
          await window.SicagDB.eliminarDeColaCenso(item.clave);
        }
        sincronizados++;
        console.info(\`[Cola Censo] ✅ Paso \${item.paso} sincronizado.\`);
      } catch (e) {
        console.warn(\`[Cola Censo] ❌ Paso \${item.paso}:\`, e.message);
      }
    }

    console.info(\`[Cola Censo] Completado. OK: \${sincronizados}\`);
    window.dispatchEvent(new CustomEvent('censo:syncCompleted', {
      detail: { sincronizados, pendientes: cola.length - sincronizados }
    }));
  }`;

content = content.replace(oldCensoQueueRegex, newFlushPendingPasos);

fs.writeFileSync(apiPath, content, 'utf8');
console.log('Update completed in api.js');

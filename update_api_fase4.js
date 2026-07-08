const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'js/api.js');
let content = fs.readFileSync(apiPath, 'utf8');

const oldCatch = `} catch (e) {
          console.warn(\`[Cola] ❌ Intento \${(item.intentos || 0) + 1}/\${MAX_INTENTOS} para \${item.clave}:\`, e.message);
          if (this._dbIniciada && window.SicagDB) {
            await window.SicagDB.actualizarIntentosEscritura(item.clave, (item.intentos || 0) + 1);
          }
          fallidas++;
        }`;

const newCatch = `} catch (e) {
          const status = e?.status || (e?.message?.match(/HTTP (\\d+)/)?.[1] ? parseInt(e.message.match(/HTTP (\\d+)/)[1]) : 0);

          // ── 409 Conflict: registro duplicado ──────────────────────────────────────
          if (status === 409) {
            console.warn(\`[Cola] ⚠️ Conflicto detectado para \${item.clave}: registro ya existe.\`);
            // Registrar como conflicto para resolución por el admin
            if (window.SicagConflictos) {
              await window.SicagConflictos.registrarConflicto(item, 409, e.message || 'Registro duplicado');
            }
            // Eliminar de la cola (no tiene sentido reintentar un 409 sin cambiar los datos)
            if (this._dbIniciada && window.SicagDB) {
              await window.SicagDB.eliminarDeColaEscritura(item.clave);
            }
            fallidas++;
            continue;
          }

          // ── 404 Not Found: el registro fue eliminado ──────────────────────────────
          if (status === 404) {
            console.warn(\`[Cola] 🗑️ Registro no encontrado para \${item.clave}. Posiblemente fue eliminado.\`);
            // Eliminar de la cola — no tiene sentido editar/eliminar algo que ya no existe
            if (this._dbIniciada && window.SicagDB) {
              await window.SicagDB.eliminarDeColaEscritura(item.clave);
            }
            // Notificar al usuario
            window.dispatchEvent(new CustomEvent('offline:registroEliminado', {
              detail: { item, mensaje: 'El registro fue eliminado por otro usuario mientras estabas offline.' }
            }));
            fallidas++;
            continue;
          }

          // ── 422 Validation Error: datos inválidos ─────────────────────────────────
          if (status === 422) {
            console.warn(\`[Cola] ❌ Datos inválidos para \${item.clave}. Descartando operación.\`);
            if (this._dbIniciada && window.SicagDB) {
              await window.SicagDB.eliminarDeColaEscritura(item.clave);
            }
            window.dispatchEvent(new CustomEvent('offline:operacionInvalida', {
              detail: { item, mensaje: 'Los datos de esta operación ya no son válidos.' }
            }));
            fallidas++;
            continue;
          }

          // ── Error genérico (red, 500, etc.) — reintentar ─────────────────────────
          console.warn(\`[Cola] ❌ Intento \${(item.intentos || 0) + 1}/\${MAX_INTENTOS} para \${item.clave}:\`, e.message);
          if (this._dbIniciada && window.SicagDB) {
            await window.SicagDB.actualizarIntentosEscritura(item.clave, (item.intentos || 0) + 1);
          }
          fallidas++;
        }`;

if (content.includes(oldCatch)) {
    content = content.replace(oldCatch, newCatch);
    fs.writeFileSync(apiPath, content, 'utf8');
    console.log('Update completed in api.js');
} else {
    console.log('Pattern not found in api.js');
}

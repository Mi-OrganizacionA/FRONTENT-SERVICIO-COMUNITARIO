/**
 * fix_censo_checkboxes.js
 * 
 * Script de corrección y diagnóstico para los checkboxes del módulo censo_viviendas.
 * Inyecta un interceptor que muestra en consola el payload exacto de cada paso antes de enviarlo.
 * 
 * Incluido en censo_viviendas.html después de api.js
 */

(function() {
  'use strict';

  // Instalar los interceptores cuando window.api esté disponible
  function instalarInterceptores() {
    if (!window.api) return false;

    // ─── INTERCEPTAR guardarPasoCenso para diagnóstico ───
    if (!window.api._fixInstalado) {
      const originalGuardar = window.api.guardarPasoCenso.bind(window.api);
      window.api.guardarPasoCenso = async function(paso, idEstudio, datos) {
        console.group(`[CENSO-DEBUG] Guardando Paso ${paso} | ID: ${idEstudio}`);
        if (datos.opciones && datos.opciones.length > 0) {
          console.log(`✅ Checkboxes (${datos.opciones.length}):`);
          datos.opciones.forEach(o => console.log(`   ${o.categoria}: ${o.valor}`));
        } else if ([6, 7, 8, 9].includes(paso)) {
          console.warn(`⚠️  Paso ${paso}: sin checkboxes marcados.`);
        }
        console.groupEnd();
        return originalGuardar(paso, idEstudio, datos);
      };

      // ─── INTERCEPTAR actualizarEstudioDemografico para diagnóstico ───
      const originalActualizar = window.api.actualizarEstudioDemografico.bind(window.api);
      window.api.actualizarEstudioDemografico = async function(id, datos) {
        console.group(`[CENSO-DEBUG] Actualizando Estudio ID: ${id}`);
        const opciones = datos.opciones || [];
        if (opciones.length > 0) {
          console.log(`✅ Total checkboxes: ${opciones.length}`);
          const cats = {};
          opciones.forEach(o => { if (!cats[o.categoria]) cats[o.categoria] = []; cats[o.categoria].push(o.valor); });
          Object.entries(cats).forEach(([c, v]) => console.log(`   ${c}: [${v.join(', ')}]`));
        } else {
          console.warn('[CENSO-DEBUG] ⚠️  Payload de actualización sin checkboxes (puede ser normal si no marcó ninguno).');
        }
        // Verificar el campo problemático de presupuesto
        const presupuesto = datos.acuerdo_pueblo_protagonismo_presupuesto;
        if (presupuesto !== undefined && presupuesto !== null && presupuesto !== '') {
          console.log(`✅ Campo presupuesto: "${presupuesto}"`);
        } else {
          console.warn('[CENSO-DEBUG] ⚠️  Campo "¿De acuerdo con protagonismo en presupuesto?" está vacío o no seleccionado.');
        }
        console.groupEnd();
        return originalActualizar(id, datos);
      };

      // ─── INTERCEPTAR crearCensoDemografico para diagnóstico ───
      const originalCrear = window.api.crearCensoDemografico.bind(window.api);
      window.api.crearCensoDemografico = async function(datos) {
        console.group('[CENSO-DEBUG] Creando Nuevo Censo');
        const opciones = datos.opciones || [];
        if (opciones.length > 0) {
          console.log(`✅ Total checkboxes: ${opciones.length}`);
          const cats = {};
          opciones.forEach(o => { if (!cats[o.categoria]) cats[o.categoria] = []; cats[o.categoria].push(o.valor); });
          Object.entries(cats).forEach(([c, v]) => console.log(`   ${c}: [${v.join(', ')}]`));
        } else {
          console.warn('[CENSO-DEBUG] ⚠️  Payload de creación sin checkboxes.');
        }
        console.groupEnd();
        return originalCrear(datos);
      };

      window.api._fixInstalado = true;
      console.log('[CENSO-DEBUG] Interceptores de diagnóstico instalados. Ver DevTools > Console.');
    }

    return true;
  }

  // Intentar instalar inmediatamente o esperar a que api esté listo
  if (!instalarInterceptores()) {
    const intervalo = setInterval(function() {
      if (instalarInterceptores()) clearInterval(intervalo);
    }, 100);
  }

})();


/**
 * habitante-autocomplete.js
 * Módulo para autocompletar datos de habitantes a partir de su cédula,
 * consultando al backend SICAG.
 */

class HabitanteAutocomplete {
  /**
   * Conecta un input de cédula con el servicio de búsqueda.
   * @param {string|HTMLElement} inputEl  - ID o elemento del input de cédula
   * @param {Function}           onFill   - Callback `(datosHabitante)` cuando se encuentra
   * @param {Object}             options  - Opciones: { debounce: 500, onNotFound: fn }
   */
  static attachTo(inputEl, onFill, options = {}) {
    const input = typeof inputEl === 'string' ? document.getElementById(inputEl) : inputEl;
    if (!input) return;

    const debounceTime = options.debounce  || 500;
    const onNotFound   = options.onNotFound || null;
    let timeoutId;

    // Crear un chip de estado UI que mostraremos junto al input
    const statusChip = document.createElement('span');
    statusChip.style.cssText =
      'font-size:0.75rem; font-weight:600; margin-left:8px; padding:2px 6px; ' +
      'border-radius:4px; display:none; transition:all 0.3s;';

    // Insertar justo después del input (o fuera del cv-input-group si aplica)
    if (input.parentElement && input.parentElement.classList.contains('cv-input-group')) {
      input.parentElement.parentElement.appendChild(statusChip);
    } else if (input.parentNode) {
      input.parentNode.insertBefore(statusChip, input.nextSibling);
    }

    const setStatus = (state, msg) => {
      statusChip.style.display = 'inline-block';
      if (state === 'loading') {
        statusChip.style.backgroundColor = '#E3F2FD';
        statusChip.style.color = '#1565C0';
        statusChip.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${msg || 'Buscando...'}`;
      } else if (state === 'success') {
        statusChip.style.backgroundColor = '#E8F5E9';
        statusChip.style.color = '#2E7D32';
        statusChip.innerHTML = `<i class="fas fa-check"></i> ${msg || 'Encontrado'}`;
        setTimeout(() => { statusChip.style.display = 'none'; }, 3500);
      } else if (state === 'error') {
        statusChip.style.backgroundColor = '#FFEBEE';
        statusChip.style.color = '#C62828';
        statusChip.innerHTML = `<i class="fas fa-xmark"></i> ${msg || 'No registrado'}`;
      } else if (state === 'clear') {
        statusChip.style.display = 'none';
      }
    };

    const search = async () => {
      const cedula = input.value.trim();
      if (!cedula) { setStatus('clear'); return; }

      // Evitar llamadas con menos de 6 dígitos
      if (cedula.replace(/\D/g, '').length < 6) return;

      setStatus('loading');

      try {
        let json = [];
        if (window.api && window.api.buscarHabitanteRapido) {
          json = await window.api.buscarHabitanteRapido(cedula);
        } else {
          const baseURL = window.api?.baseURL || 'https://sicag-api.onrender.com/api';
          const token   = window.auth?.getToken() || '';
          const res = await fetch(
            `${baseURL}/habitantes/buscar/rapido?q=${encodeURIComponent(cedula)}`,
            { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, credentials: 'include' }
          );
          if (!res.ok) throw new Error('Error al consultar');
          json = await res.json();
        }

        const lista = Array.isArray(json) ? json : (json.habitantes || json.data || []);
        let habitante = null;
        if (lista.length > 0) {
          const cedNorm = cedula.replace(/[\.\s-]/g, '').replace(/^[VE]/i, '');
          habitante = lista.find(h => String(h.cedula).replace(/[\.\s-]/g, '') === cedNorm) || lista[0];
        }

        if (habitante) {
          setStatus('success', habitante.nombres || 'Encontrado');
          if (onFill) onFill(habitante);
        } else {
          setStatus('error', 'No registrado');
          if (onNotFound) onNotFound(cedula);
        }

      } catch (err) {
        console.warn('[Autocomplete] Error principal, intentando fallback local:', err.message);
        try {
          // FALLBACK LOCAL: buscar en la lista completa de habitantes si está en memoria
          if (window.api && window.api.getHabitantes) {
            const todos = await window.api.getHabitantes({ limit: 5000 });
            const cedNorm = cedula.replace(/[\.\s-]/g, '').replace(/^[VE]/i, '');
            const hab = todos.find(h => String(h.cedula).replace(/[\.\s-]/g, '') === cedNorm);
            if (hab) {
              setStatus('success', hab.nombres || 'Encontrado');
              if (onFill) onFill(hab);
              return;
            }
          }
          setStatus('error', 'No registrado');
          if (onNotFound) onNotFound(cedula);
        } catch (fbErr) {
          console.error('[Autocomplete] Error en fallback:', fbErr);
          setStatus('error', 'Error de conexión');
        }
      }
    };

    // Al presionar Enter dentro del input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(timeoutId);
        search();
      }
    });

    // Al dejar de escribir (debounce)
    input.addEventListener('input', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(search, debounceTime);
    });

    // Método para forzar búsqueda desde botón de lupa externo
    input.forceSearch = search;
  }
}

// Exponer globalmente
window.HabitanteAutocomplete = HabitanteAutocomplete;

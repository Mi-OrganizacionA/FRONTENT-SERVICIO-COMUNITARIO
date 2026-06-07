/**
 * habitante-autocomplete.js
 * Módulo para autocompletar datos de habitantes a partir de su cédula,
 * consultando al backend SICAG.
 */

class HabitanteAutocomplete {
  /**
   * Conecta un input de cédula con el servicio de búsqueda.
   * @param {string|HTMLElement} inputEl - ID o elemento del input de cédula
   * @param {Function} onFill - Callback `(datosHabitante)` cuando se encuentra
   * @param {Object} options - Opciones extras { debounce: 500 }
   */
  static attachTo(inputEl, onFill, options = {}) {
    const input = typeof inputEl === 'string' ? document.getElementById(inputEl) : inputEl;
    if (!input) return;

    const debounceTime = options.debounce || 500;
    let timeoutId;

    // Crear un chip de estado UI que mostraremos junto al input
    const statusChip = document.createElement('span');
    statusChip.style.cssText = 'font-size:0.75rem; font-weight:600; margin-left:8px; padding:2px 6px; border-radius:4px; display:none; transition:all 0.3s;';
    
    // Lo insertamos justo después del input o del contenedor si hay un input-group
    if (input.parentElement.classList.contains('cv-input-group')) {
      input.parentElement.parentElement.appendChild(statusChip);
    } else {
      input.parentNode.insertBefore(statusChip, input.nextSibling);
    }

    const setStatus = (state, msg) => {
      statusChip.style.display = 'inline-block';
      if (state === 'loading') {
        statusChip.style.backgroundColor = '#E3F2FD'; // Light blue
        statusChip.style.color = '#1565C0';
        statusChip.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${msg || 'Buscando...'}`;
      } else if (state === 'success') {
        statusChip.style.backgroundColor = '#E8F5E9'; // Light green
        statusChip.style.color = '#2E7D32';
        statusChip.innerHTML = `<i class="fas fa-check"></i> ${msg || 'Encontrado'}`;
        setTimeout(() => { statusChip.style.display = 'none'; }, 3000); // Ocultar después de 3s
      } else if (state === 'error') {
        statusChip.style.backgroundColor = '#FFEBEE'; // Light red
        statusChip.style.color = '#C62828';
        statusChip.innerHTML = `<i class="fas fa-xmark"></i> ${msg || 'No encontrado'}`;
      } else if (state === 'clear') {
        statusChip.style.display = 'none';
      }
    };

    const search = async () => {
      const cedula = input.value.trim();
      if (!cedula) {
        setStatus('clear');
        return;
      }

      // Evitar llamadas de menos de 6 caracteres si son puramente números
      if (cedula.replace(/\D/g, '').length < 6) return;

      setStatus('loading');
      try {
        const token = localStorage.getItem('token') || '';
        // La API puede ser /api/habitantes/buscar/:cedula o usar query ?cedula=
        // Asumiendo la ruta estándar de REST: GET /api/habitantes?cedula=XXX
        const res = await fetch(`http://localhost:3000/api/habitantes?cedula=${cedula}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al consultar');

        const json = await res.json();
        // El controller devuelve array. Filtramos exactamente
        let habitante = null;
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Algunos endpoints permiten array, otros retornan exacto. Tomamos el primero
          habitante = json.data.find(h => h.cedula.includes(cedula));
        }

        if (habitante) {
          setStatus('success', habitante.nombres);
          if (onFill) onFill(habitante);
        } else {
          setStatus('error', 'No registrado');
        }
      } catch (err) {
        console.error('Error autocompletado:', err);
        setStatus('error', 'Error de conexión');
      }
    };

    // Al presionar Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(timeoutId);
        search();
      }
    });

    // Al dejar de escribir
    input.addEventListener('input', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(search, debounceTime);
    });

    // Añadir método explícito para forzar búsqueda (si el usuario presiona un botón de lupa)
    input.forceSearch = search;
  }
}

// Exponer globalmente
window.HabitanteAutocomplete = HabitanteAutocomplete;

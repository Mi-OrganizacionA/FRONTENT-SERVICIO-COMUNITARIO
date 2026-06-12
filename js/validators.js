/**
 * Sistema centralizado de validación (SICAG v3.0)
 * Archivo: js/validators.js
 *
 * Mejoras:
 * - Validación asíncrona de cédula única contra el backend (PROBLEMA 4).
 * - Manejo de ApiError tipado para mostrar mensajes diferenciados (PROBLEMA 6).
 */

const validators = {
  // Validadores individuales
  cedula: (cedula) => {
    if (!cedula) return false;
    const cleaned = String(cedula).replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 8;
  },
  email: (email) => {
    if (!email) return true; // Opcional por defecto, requerirlo explícitamente si se necesita
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  nombre: (nombre) => {
    if (!nombre) return false;
    const cleaned = String(nombre).trim();
    return cleaned.length >= 3 && cleaned.length <= 100;
  },
  edad: (edad) => {
    if (!edad && edad !== 0) return false;
    const num = parseInt(edad);
    return num >= 0 && num <= 150;
  },
  telefono: (telefono) => {
    if (!telefono) return true; // Opcional
    const regex = /^(\+?58)?[0-9\-\(\)\s]{10,}$/;
    return regex.test(telefono);
  },
  direccion: (direccion) => {
    if (!direccion) return false;
    return String(direccion).trim().length >= 5;
  },

  // Validador general de un objeto de datos contra un esquema
  validarFormulario: (datos, esquema) => {
    const errores = {};
    Object.keys(esquema).forEach(campo => {
      const validadores = esquema[campo];
      const valor = datos[campo];
      
      validadores.forEach(validadorFn => {
        const resultado = validadorFn(valor);
        if (resultado !== true) {
          errores[campo] = errores[campo] || [];
          errores[campo].push(resultado); // El validador debe retornar el mensaje de error si falla, o true si pasa.
        }
      });
    });

    return {
      valido: Object.keys(errores).length === 0,
      errores
    };
  }
};

// Esquemas predefinidos
const schemas = {
  habitante: {
    cedula: [
      (v) => !!v || 'Cédula requerida',
      (v) => validators.cedula(v) || 'Formato de cédula inválido (7-8 dígitos)'
    ],
    nombre: [
      (v) => !!v || 'Nombre requerido',
      (v) => validators.nombre(v) || 'El nombre debe tener entre 3 y 100 caracteres'
    ],
    edad: [
      (v) => (!!v || v===0) || 'Edad requerida',
      (v) => validators.edad(v) || 'La edad debe estar entre 0 y 150 años'
    ]
  }
};

/**
 * Clase controladora para interactuar con el DOM
 */
class FormValidator {
  constructor(formularioId, schemaKey) {
    this.formulario = document.getElementById(formularioId);
    if (!this.formulario) return;
    this.schema = schemas[schemaKey];
    this.setupFormulario();
  }

  setupFormulario() {
    this.formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      const datos = this.getDatos();
      const validacion = validators.validarFormulario(datos, this.schema);

      if (validacion.valido) {
        this.limpiarErrores();
        // Disparar evento personalizado con los datos listos
        this.formulario.dispatchEvent(new CustomEvent('validSubmit', { detail: datos }));
      } else {
        this.mostrarErrores(validacion.errores);
      }
    });

    // Validación en tiempo real (blur)
    this.formulario.querySelectorAll('input, select, textarea').forEach(campo => {
      campo.addEventListener('blur', () => this.validarCampo(campo));
    });
  }

  getDatos() {
    const datos = {};
    this.formulario.querySelectorAll('[name]').forEach(campo => {
      datos[campo.name] = campo.value;
    });
    return datos;
  }

  validarCampo(campo) {
    const nombre = campo.name;
    if (!this.schema[nombre]) return true;

    const validadores = this.schema[nombre];
    const valor = campo.value;

    for (let validadorFn of validadores) {
      const resultado = validadorFn(valor);
      if (resultado !== true) {
        this.mostrarErrorCampo(campo, resultado);
        return false;
      }
    }
    
    this.limpiarErrorCampo(campo);
    return true;
  }

  mostrarErrores(errores) {
    this.limpiarErrores();
    Object.keys(errores).forEach(campo => {
      const input = this.formulario.querySelector(`[name="${campo}"]`);
      if (input) this.mostrarErrorCampo(input, errores[campo][0]);
    });
  }

  mostrarErrorCampo(campo, mensaje) {
    campo.classList.add('is-invalid');
    let errorDiv = campo.parentElement.querySelector('.invalid-feedback');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-feedback';
      errorDiv.style.color = '#dc3545';
      errorDiv.style.fontSize = '0.875em';
      errorDiv.style.marginTop = '0.25rem';
      campo.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = mensaje;
  }

  limpiarErrorCampo(campo) {
    campo.classList.remove('is-invalid');
    const errorDiv = campo.parentElement.querySelector('.invalid-feedback');
    if (errorDiv) errorDiv.remove();
  }

  limpiarErrores() {
    this.formulario.querySelectorAll('.is-invalid').forEach(campo => {
      this.limpiarErrorCampo(campo);
    });
  }
}

// Exportar global
window.validators = validators;
window.FormValidator = FormValidator;

/**
 * Validación asíncrona de cédula única contra el backend.
 * Se usa en el evento 'blur' del campo cédula en los formularios de habitante.
 * (PROBLEMA 4 - Validaciones asimétricas)
 *
 * @param {string} cedula - La cédula a verificar
 * @returns {Promise<{unica: boolean, error: string|null}>}
 */
async function verificarCedulaUnica(cedula) {
  try {
    // En modo simulación local, siempre considerar única (no hay backend real)
    if (window.api?.isDevelopment) {
      return { unica: true, error: null };
    }

    const cedulaLimpia = String(cedula).replace(/\D/g, '');
    if (cedulaLimpia.length < 7) {
      return { unica: true, error: null }; // Dejar que el validador de formato maneje esto
    }

    const baseURL = window.api?.baseURL || 'https://sicag-api.onrender.com/api';
    const response = await fetch(`${baseURL}/habitantes/check-cedula/${cedulaLimpia}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      // Si el endpoint falla, no bloquear al usuario (fail open)
      console.warn('[Validators] No se pudo verificar unicidad de cédula, continuando.');
      return { unica: true, error: null };
    }

    const data = await response.json();
    if (data.existe) {
      return { unica: false, error: 'Esta cédula ya está registrada en el sistema' };
    }
    return { unica: true, error: null };
  } catch (e) {
    // Fail open: si hay error de red, no bloquear al usuario
    console.warn('[Validators] Error verificando cédula:', e.message);
    return { unica: true, error: null };
  }
}

/**
 * Maneja un error tipado de la API (ApiError) y muestra el mensaje apropiado al usuario.
 * Diferencia entre errores de duplicado (409), validación (422), permisos (403) y servidor (500).
 * (PROBLEMA 6 - Manejo de errores inconsistente)
 *
 * @param {Error|ApiError} error - El error capturado
 * @param {object} [opciones] - Opciones de visualización
 * @param {HTMLElement} [opciones.contenedor] - Contenedor donde mostrar el error
 * @returns {string} Mensaje de error para el usuario
 */
function manejarErrorApi(error, opciones = {}) {
  let mensaje = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  let detalles = null;

  // Verificar si es un ApiError tipado
  if (window.ApiError && error instanceof window.ApiError) {
    switch (error.status) {
      case 401:
        mensaje = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
        break;
      case 403:
        mensaje = 'No tienes permisos para realizar esta acción.';
        break;
      case 404:
        mensaje = 'El registro solicitado no fue encontrado.';
        break;
      case 409:
        // Error de duplicado: la cédula ya existe
        mensaje = error.message || 'Este registro ya existe en el sistema.';
        detalles = error.detalles;
        break;
      case 422:
        // Error de validación: datos incorrectos
        mensaje = error.message || 'Los datos enviados son inválidos.';
        detalles = error.detalles;
        break;
      case 500:
        mensaje = 'Error interno del servidor. El equipo técnico ha sido notificado.';
        break;
      default:
        mensaje = error.message || mensaje;
    }
  } else {
    // Error genérico
    mensaje = error.message || mensaje;
  }

  // Si hay un contenedor, mostrar el error visualmente
  if (opciones.contenedor) {
    const alerta = document.createElement('div');
    alerta.className = 'api-error-alert';
    alerta.style.cssText = 'background:#fff3f3;border:1px solid #f56565;border-radius:6px;padding:10px 14px;margin:8px 0;color:#c53030;font-size:0.9rem;';
    alerta.innerHTML = `<strong>⚠️ ${mensaje}</strong>`;

    // Si hay detalles de campos específicos (error 422)
    if (detalles && detalles.length) {
      const lista = document.createElement('ul');
      lista.style.cssText = 'margin:6px 0 0 16px;padding:0;';
      detalles.forEach(det => {
        const li = document.createElement('li');
        li.textContent = `${det.field}: ${det.message}`;
        lista.appendChild(li);
      });
      alerta.appendChild(lista);
    }

    // Limpiar alertas previas
    const previas = opciones.contenedor.querySelectorAll('.api-error-alert');
    previas.forEach(a => a.remove());
    opciones.contenedor.prepend(alerta);

    // Auto-remover después de 8 segundos
    setTimeout(() => alerta.remove(), 8000);
  }

  return mensaje;
}

window.verificarCedulaUnica = verificarCedulaUnica;
window.manejarErrorApi = manejarErrorApi;

/**
 * Sistema centralizado de validación (SICAG v5.0)
 * Archivo: js/validators.js
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

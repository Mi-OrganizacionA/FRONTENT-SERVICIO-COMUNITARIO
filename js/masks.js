/**
 * SICAG — Máscaras de Entrada de Datos
 * Archivo: js/masks.js
 *
 * Aplica restricciones y formatos a los campos de formulario.
 * Se activa automáticamente al cargarse el DOM.
 * Uso: añadir atributo data-mask="tipo" al input, o dejar que
 * el script lo detecte por ID/placeholder/nombre.
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     FUNCIONES BASE DE MÁSCARA
  ────────────────────────────────────────────── */

  /**
   * Máscara de Cédula venezolana
   * Permite: V- o E- seguido de números con puntos
   * Formato: V-00.000.000
   */
  function aplicarMascaraCedula(input) {
    input.setAttribute('maxlength', '12'); // 12.345.678 = 10 caracteres max (sin V-)
    input.setAttribute('placeholder', input.placeholder || '12.345.678');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('inputmode', 'numeric');

    input.addEventListener('input', function () {
      let v = this.value.toUpperCase().replace(/[^VEve0-9]/g, '');
      let prefix = '';
      let nums = '';
      
      // Si el usuario insiste en tipear V o E, lo dejamos (por retrocompatibilidad)
      if (v.startsWith('V') || v.startsWith('E')) {
        prefix = v[0] + '-';
        nums = v.slice(1).replace(/\D/g, '').slice(0, 9);
      } else {
        // Solo números
        nums = v.replace(/\D/g, '').slice(0, 9);
      }
      
      // Agregar puntos: 0.000.000
      if (nums.length > 3 && nums.length <= 6) {
        nums = nums.slice(0, nums.length - 3) + '.' + nums.slice(nums.length - 3);
      } else if (nums.length > 6) {
        nums = nums.slice(0, nums.length - 6) + '.' +
               nums.slice(nums.length - 6, nums.length - 3) + '.' +
               nums.slice(nums.length - 3);
      }
      
      const valorFinal = nums.length > 0 ? prefix + nums : prefix;
      if (this.value !== valorFinal) this.value = valorFinal;
    });

    input.addEventListener('keydown', function (e) {
      const permitidos = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (permitidos.includes(e.key)) return;
      if (/^[0-9]$/.test(e.key)) return;
      if (this.value.length === 0 && /^[VvEe]$/.test(e.key)) return; // Solo permitir al inicio
      e.preventDefault();
    });

    input.addEventListener('blur', function () {
      const nums = this.value.replace(/\D/g, '');
      if (nums.length > 0 && (nums.length < 7 || nums.length > 9)) {
        this.style.borderColor = 'var(--ru)';
        if (!this.nextElementSibling || !this.nextElementSibling.classList.contains('error-cedula')) {
          const err = document.createElement('small');
          err.className = 'error-cedula';
          err.style.color = 'var(--ru)';
          err.style.display = 'block';
          err.textContent = 'La cédula debe tener entre 7 y 9 dígitos.';
          this.parentNode.insertBefore(err, this.nextSibling);
        }
      } else {
        this.style.borderColor = '';
        if (this.nextElementSibling && this.nextElementSibling.classList.contains('error-cedula')) {
          this.nextElementSibling.remove();
        }
      }
    });
  }

  /**
   * Máscara de Nombres y Apellidos
   * Permite: letras, espacios, tildes, ñ, apóstrofes
   * Bloquea: números, caracteres especiales
   */
  function aplicarMascaraNombres(input) {
    input.setAttribute('maxlength', '40');
    
    input.addEventListener('keydown', function (e) {
      const permitidos = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                          'Home', 'End', 'Enter', ' '];
      if (permitidos.includes(e.key)) return;
      // Letras del alfabeto incluyendo ñ, tildes, apóstrofe
      if (/^[a-zA-ZáéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑüÜ''\-]$/.test(e.key)) return;
      e.preventDefault();
    });

    input.addEventListener('input', function () {
      // Eliminar cualquier número o símbolo que se haya pegado
      const nuevo = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑüÜ''\-\s]/g, '');
      if (this.value !== nuevo) this.value = nuevo;
    });

    input.addEventListener('blur', function () {
      let val = this.value.replace(/\s+/g, ' ').trim();
      val = val.split(' ').map(palabra => {
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
      }).join(' ');
      if (this.value !== val) this.value = val;
    });
  }

  /**
   * Máscara de Teléfono venezolano
   * Permite: +, números, espacios, guiones, paréntesis
   */
  function aplicarMascaraTelefono(input) {
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('maxlength', '15'); // (0412) 123-4567 = 15 chars
    input.setAttribute('placeholder', '(0412) 123-4567');

    input.addEventListener('keydown', function (e) {
      const permitidos = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (permitidos.includes(e.key)) return;
      if (/^[0-9]$/.test(e.key)) return;
      e.preventDefault();
    });

    input.addEventListener('input', function () {
      let nums = this.value.replace(/\D/g, '').slice(0, 11);
      
      let formatted = '';
      if (nums.length > 0) {
        formatted += '(' + nums.substring(0, 4);
      }
      if (nums.length >= 5) {
        formatted += ') ' + nums.substring(4, 7);
      }
      if (nums.length >= 8) {
        formatted += '-' + nums.substring(7, 11);
      }
      
      if (this.value !== formatted) this.value = formatted;
    });

    input.addEventListener('blur', function () {
      const nums = this.value.replace(/\D/g, '');
      if (nums.length > 0 && nums.length < 11) {
        this.style.borderColor = 'var(--ru)';
        if (!this.nextElementSibling || !this.nextElementSibling.classList.contains('error-telefono')) {
          const err = document.createElement('small');
          err.className = 'error-telefono';
          err.style.color = 'var(--ru)';
          err.style.display = 'block';
          err.textContent = 'El teléfono debe tener 11 dígitos.';
          this.parentNode.insertBefore(err, this.nextSibling);
        }
      } else {
        const prefijo = nums.substring(0, 4);
        const validos = ['0412', '0414', '0416', '0422', '0424', '0426'];
        if (nums.length === 11 && !validos.includes(prefijo) && !prefijo.startsWith('02')) {
          this.style.borderColor = 'var(--ru)';
          if (!this.nextElementSibling || !this.nextElementSibling.classList.contains('error-telefono')) {
            const err = document.createElement('small');
            err.className = 'error-telefono';
            err.style.color = 'var(--ru)';
            err.style.display = 'block';
            err.textContent = 'Prefijo inválido.';
            this.parentNode.insertBefore(err, this.nextSibling);
          }
        } else {
          this.style.borderColor = '';
          if (this.nextElementSibling && this.nextElementSibling.classList.contains('error-telefono')) {
            this.nextElementSibling.remove();
          }
        }
      }
    });
  }

  /**
   * Máscara Numérica (solo números y punto decimal)
   * Para: hectáreas, cantidades, presupuesto, etc.
   */
  function aplicarMascaraNumero(input, permitirDecimal = true) {
    input.setAttribute('inputmode', 'decimal');

    input.addEventListener('keydown', function (e) {
      const permitidos = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
                          'Home', 'End'];
      if (permitidos.includes(e.key)) return;
      if (/^[0-9]$/.test(e.key)) return;
      if (permitirDecimal && e.key === '.' && !this.value.includes('.')) return;
      e.preventDefault();
    });

    input.addEventListener('input', function () {
      const patron = permitirDecimal ? /[^0-9.]/g : /[^0-9]/g;
      let nuevo = this.value.replace(patron, '');
      // Evitar múltiples puntos decimales
      const partes = nuevo.split('.');
      if (partes.length > 2) nuevo = partes[0] + '.' + partes.slice(1).join('');
      if (this.value !== nuevo) this.value = nuevo;
    });
  }

  /**
   * Máscara de Número de Planilla (alfanumérico, sin caracteres raros)
   */
  function aplicarMascaraPlanilla(input) {
    input.setAttribute('maxlength', '20');
    input.addEventListener('input', function () {
      const nuevo = this.value.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase();
      if (this.value !== nuevo) this.value = nuevo;
    });
  }

  /* ──────────────────────────────────────────────
     APLICACIÓN AUTOMÁTICA POR data-mask
  ────────────────────────────────────────────── */

  function aplicarPorAtributo() {
    document.querySelectorAll('[data-mask]').forEach(function (input) {
      const tipo = input.getAttribute('data-mask');
      switch (tipo) {
        case 'cedula':   aplicarMascaraCedula(input);   break;
        case 'nombre':   aplicarMascaraNombres(input);  break;
        case 'telefono': aplicarMascaraTelefono(input); break;
        case 'numero':   aplicarMascaraNumero(input, false); break;
        case 'decimal':  aplicarMascaraNumero(input, true);  break;
        case 'planilla': aplicarMascaraPlanilla(input); break;
      }
    });
  }

  /* ──────────────────────────────────────────────
     APLICACIÓN POR ID PREDEFINIDO (IDs conocidos del sistema)
  ────────────────────────────────────────────── */

  // IDs de cédulas conocidos en el sistema
  const IDS_CEDULA = [
    'habCedula', 'cedulaJefe', 'encuestadorCedula', 'encuestadoCedula',
    'cNombre' /* No es cédula pero no está en esta lista */,
    'verifyPasswordInput' /* Contraseña — no aplica */
  ];
  // Filtrar solo los que son realmente cédula
  const IDS_CEDULA_REAL = [
    'habCedula', 'cedulaJefe', 'encuestadorCedula', 'encuestadoCedula',
    'habBuscarCedula' /* campo de búsqueda pública */
  ];

  // IDs de nombres conocidos
  const IDS_NOMBRES = [
    'habNombres', 'habApellidos', 'jefNombres',
    'encuestadorNombre', 'encuestadoNombre', 'projResponsable',
    'orgNombre', 'cNombre'
  ];

  // IDs de teléfono conocidos
  const IDS_TELEFONO = [
    'orgTelefono', 'cTelefono', 'habTelefono'
  ];

  // IDs numéricos (enteros)
  const IDS_NUMERO = [
    'habEdad', 'cantidadHabitantes', 'cantidadCilindrosGas'
  ];

  // IDs numéricos decimales
  const IDS_DECIMAL = [
    'prodHectareas', 'projPresupuesto', 'projAvance', 'prodRendimiento'
  ];

  function aplicarPorIds() {
    IDS_CEDULA_REAL.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.dataset.maskApplied) {
        aplicarMascaraCedula(el);
        el.dataset.maskApplied = '1';
      }
    });

    IDS_NOMBRES.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.dataset.maskApplied) {
        aplicarMascaraNombres(el);
        el.dataset.maskApplied = '1';
      }
    });

    IDS_TELEFONO.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.dataset.maskApplied) {
        aplicarMascaraTelefono(el);
        el.dataset.maskApplied = '1';
      }
    });

    IDS_NUMERO.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.dataset.maskApplied) {
        aplicarMascaraNumero(el, false);
        el.dataset.maskApplied = '1';
      }
    });

    IDS_DECIMAL.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.dataset.maskApplied) {
        aplicarMascaraNumero(el, true);
        el.dataset.maskApplied = '1';
      }
    });
  }

  /* ──────────────────────────────────────────────
     DETECCIÓN AUTOMÁTICA POR PLACEHOLDER Y TIPO
  ────────────────────────────────────────────── */
  function aplicarPorDeteccion() {
    document.querySelectorAll('input:not([data-mask-applied])').forEach(function (input) {
      if (input.dataset.maskApplied) return;
      const ph = (input.placeholder || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const name = (input.name || '').toLowerCase();

      // Detectar cédulas por placeholder/id
      if (ph.includes('cédula') || ph.includes('cedula') || ph.includes('v-12') ||
          id.includes('cedula') || name.includes('cedula')) {
        aplicarMascaraCedula(input);
        input.dataset.maskApplied = '1';
        return;
      }

      // Detectar nombres por id
      if ((id.includes('nombre') || id.includes('apellido')) &&
          input.type === 'text') {
        aplicarMascaraNombres(input);
        input.dataset.maskApplied = '1';
        return;
      }

      // Detectar teléfonos
      if (input.type === 'tel' || id.includes('telefono') ||
          ph.includes('+58') || ph.includes('teléfono')) {
        aplicarMascaraTelefono(input);
        input.dataset.maskApplied = '1';
        return;
      }

      // Detectar hectáreas / cantidades numéricas por id
      if (id.includes('hectarea') || id.includes('cantidad') ||
          id.includes('presupuesto') || id.includes('rendimiento')) {
        aplicarMascaraNumero(input, true);
        input.dataset.maskApplied = '1';
        return;
      }
    });
  }

  /* ──────────────────────────────────────────────
     INICIALIZACIÓN
  ────────────────────────────────────────────── */
  function init() {
    aplicarPorAtributo();
    aplicarPorIds();
    aplicarPorDeteccion();
  }

  // Ejecutar al cargar DOM (también sirve para páginas que cargan dinámicamente)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-ejecutar si algún modal carga campos nuevos (MutationObserver ligero)
  const observer = new MutationObserver(function (mutations) {
    let needsApply = false;
    mutations.forEach(function (m) {
      if (m.addedNodes.length > 0) needsApply = true;
    });
    if (needsApply) {
      setTimeout(function () {
        aplicarPorAtributo();
        aplicarPorIds();
        aplicarPorDeteccion();
      }, 100);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Exponer funciones para uso externo si se necesita
  window.SICAGMasks = {
    cedula: aplicarMascaraCedula,
    nombres: aplicarMascaraNombres,
    telefono: aplicarMascaraTelefono,
    numero: aplicarMascaraNumero,
    reinit: init
  };

})();

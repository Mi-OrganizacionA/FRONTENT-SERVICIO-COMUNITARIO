/* js/voceros.js — gestión de voceros y creación de cuentas en localStorage */
(() => {
  const STORAGE_KEY = 'sicag_voceros';
  const accountKey = 'sicag_accounts';

  const elements = {
    tableBody: document.querySelector('#tablaVoceros tbody'),
    modal: document.getElementById('modalAgregar'),
    addButton: document.getElementById('btnAgregarVocero'),
    closeButton: document.getElementById('closeModal'),
    form: document.getElementById('formAgregar'),
    cedulaInput: document.getElementById('inputCedula'),
    comunidadSelect: document.getElementById('selComunidad'),
    passwordInput: document.getElementById('confirmPass'),
    feedback: document.getElementById('buscarResult')
  };

  const getVoceros = async () => {
    try {
      return await window.api.getVoceros();
    } catch(e) {
      console.error(e);
      return [];
    }
  };

  const getAccountStore = () => {
    const raw = localStorage.getItem(accountKey);
    return raw ? JSON.parse(raw) : {};
  };

  const saveAccountStore = (store) => {
    localStorage.setItem(accountKey, JSON.stringify(store));
  };

  const renderVocerosTable = async () => {
    if (!elements.tableBody) return;
    const voceros = await getVoceros();
    elements.tableBody.innerHTML = '';

    voceros.forEach((vocero) => {
      const row = document.createElement('tr');
      row.dataset.id = vocero.id;
      row.innerHTML = `
        <td>${vocero.cedula || vocero.nombre_usuario}</td>
        <td>${vocero.nombre}</td>
        <td>${vocero.consejoComunal || vocero.comunidad || 'N/D'}</td>
        <td>
          <button class="btn-sicag btn-danger btn-sm" type="button" data-id="${vocero.id}">Eliminar</button>
        </td>`;
      elements.tableBody.appendChild(row);
    });

    elements.tableBody.querySelectorAll('button[data-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        if (!id || !confirm(`¿Eliminar este vocero?`)) return;
        try {
          await window.api.eliminarVocero(id);
          renderVocerosTable();
        } catch(e) {
          alert('Error eliminando vocero');
        }
      });
    });
  };

  const resetModal = () => {
    if (!elements.form) return;
    elements.form.reset();
    if (elements.feedback) elements.feedback.textContent = '';
  };

  const openModal = () => {
    if (!elements.modal) return;
    elements.modal.classList.add('show');
    elements.modal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    if (!elements.modal) return;
    elements.modal.classList.remove('show');
    elements.modal.setAttribute('aria-hidden', 'true');
    resetModal();
  };

  const findHabitanteByCedula = (cedula) => {
    const raw = localStorage.getItem('sicag_censo_viviendas_t2');
    if (!raw) return null;
    const records = JSON.parse(raw);
    return records.find((record) => record.cedula_jefe_familia === cedula) || null;
  };

  const validateAdminPassword = async (value) => {
    try {
      await window.api.verifyPassword(value);
      return true;
    } catch (e) {
      return false;
    }
  };

  const createVoceroAccount = (cedula) => {
    const store = getAccountStore();
    if (!store[cedula]) {
      store[cedula] = { pass: 'vocero123', rol: 'Vocero', redirect: 'censo.html' };
      saveAccountStore(store);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!elements.form) return;

    const comunidad = elements.comunidadSelect?.value;
    const cedula = elements.cedulaInput?.value.trim();
    const password = elements.passwordInput?.value;

    if (!comunidad || !cedula || !password) {
      return alert('Completa todos los campos antes de continuar.');
    }

    const isValidPassword = await validateAdminPassword(password);
    if (!isValidPassword) {
      return alert('Contraseña de administrador incorrecta.');
    }

    const inputNombre = document.getElementById('inputNombre');
    const nombreEncontrado = (inputNombre && inputNombre.value) ? inputNombre.value : ('Vocero ' + cedula);

    try {
      await window.api.crearVocero({
        cedula,
        nombre: nombreEncontrado, // Toma el nombre real del habitante
        comunidad
      });
      createVoceroAccount(cedula);
      closeModal();
      renderVocerosTable();
    } catch(e) {
      alert('Error creando vocero o la cédula ya existe');
    }
  };

  if (elements.addButton) {
    elements.addButton.addEventListener('click', openModal);
  }

  if (elements.closeButton) {
    elements.closeButton.addEventListener('click', closeModal);
  }

  if (elements.cedulaInput) {
    elements.cedulaInput.addEventListener('input', () => {
      if (elements.feedback) elements.feedback.textContent = '';
    });
  }

  if (elements.form) {
    elements.form.addEventListener('submit', handleFormSubmit);
  }

  // Resaltado de fila desde búsqueda global
  const applyUrlHighlight = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewVoceroId = urlParams.get('viewVocero');
    if (viewVoceroId) {
      setTimeout(() => {
        const row = document.querySelector(`tr[data-id="${viewVoceroId}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.transition = 'background-color 0.5s ease';
          row.style.backgroundColor = 'rgba(255, 193, 7, 0.4)';
          setTimeout(() => row.style.backgroundColor = '', 3000);
        }
      }, 500);
    }
  };

  renderVocerosTable().then(applyUrlHighlight);
})();

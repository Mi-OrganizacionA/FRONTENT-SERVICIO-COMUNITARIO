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

  const getStoredVoceros = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  };

  const setStoredVoceros = (voceros) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(voceros));
  };

  const getAccountStore = () => {
    const raw = localStorage.getItem(accountKey);
    return raw ? JSON.parse(raw) : {};
  };

  const saveAccountStore = (store) => {
    localStorage.setItem(accountKey, JSON.stringify(store));
  };

  const renderVocerosTable = () => {
    if (!elements.tableBody) return;
    const voceros = getStoredVoceros();
    elements.tableBody.innerHTML = '';

    voceros.forEach((vocero) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${vocero.cedula}</td>
        <td>${vocero.nombre}</td>
        <td>${vocero.comunidad}</td>
        <td>
          <button class="btn-sicag btn-danger btn-sm" type="button" data-cedula="${vocero.cedula}">Eliminar</button>
        </td>`;
      elements.tableBody.appendChild(row);
    });

    elements.tableBody.querySelectorAll('button[data-cedula]').forEach((button) => {
      button.addEventListener('click', () => {
        const cedula = button.dataset.cedula;
        if (!cedula || !confirm(`Eliminar vocero ${cedula}?`)) return;
        const remaining = getStoredVoceros().filter((item) => item.cedula !== cedula);
        setStoredVoceros(remaining);
        renderVocerosTable();
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

  const validateAdminPassword = (value) => {
    const adminPass = sessionStorage.getItem('sicag_pass');
    return value && adminPass && value === adminPass;
  };

  const createVoceroAccount = (cedula) => {
    const store = getAccountStore();
    if (!store[cedula]) {
      store[cedula] = { pass: 'vocero123', rol: 'Vocero', redirect: 'censo.html' };
      saveAccountStore(store);
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (!elements.form) return;

    const comunidad = elements.comunidadSelect?.value;
    const cedula = elements.cedulaInput?.value.trim();
    const password = elements.passwordInput?.value;

    if (!comunidad || !cedula || !password) {
      return alert('Completa todos los campos antes de continuar.');
    }

    if (!validateAdminPassword(password)) {
      return alert('Contraseña de administrador incorrecta.');
    }

    const habitante = findHabitanteByCedula(cedula);
    if (!habitante) {
      return alert('No se encontró habitante con esa cédula en los registros de viviendas.');
    }

    const voceros = getStoredVoceros();
    if (voceros.some((item) => item.cedula === cedula)) {
      return alert('Esta cédula ya está registrada como vocero.');
    }

    voceros.push({
      cedula,
      nombre: habitante.nombre_jefe_familia || habitante.nombre || 'N/D',
      comunidad
    });

    setStoredVoceros(voceros);
    createVoceroAccount(cedula);
    closeModal();
    renderVocerosTable();
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

  renderVocerosTable();
})();

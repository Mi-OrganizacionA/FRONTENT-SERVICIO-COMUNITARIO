/**
 * js/configuracion.js — Control interactivo y persistencia de configuración del SICAG
 */
(() => {
  const STORAGE_KEY_AVISOS = 'sicag_cartelera';
  const STORAGE_KEY_PORTAL = 'sicag_portal_settings';

  const defaultPortalSettings = {
    nombre: 'Comuna Socialista Agroecológica Simón Rodríguez',
    lema: 'Ecosocialismo y Tecnología',
    descripcion: 'Plataforma comunal diseñada para el control demográfico, cartelera informativa digital y gestión de proyectos agroecológicos administrada por la Sala de Autogobierno.',
    telefono: '0412-5554321',
    email: 'contacto@comunasimonrodriguez.org',
    facebook: 'https://facebook.com/comunasimonrodriguez'
  };

  const getStoredAvisos = () => {
    const raw = localStorage.getItem(STORAGE_KEY_AVISOS);
    return raw ? JSON.parse(raw) : [
      { id: 1, tipo: 'aviso', titulo: 'Mantenimiento del transformador', contenido: 'Se informa que habrá trabajos de mantenimiento en el sector La Esperanza.', fecha: '2026-05-25', autor: 'Sala de Autogobierno' },
      { id: 2, tipo: 'convocatoria', titulo: 'Asamblea extraordinaria', contenido: 'Convocamos a todos los voceros para debatir nuevos planes de siembra.', fecha: '2026-05-28', autor: 'Sala de Autogobierno' }
    ];
  };

  const setStoredAvisos = (avisos) => {
    localStorage.setItem(STORAGE_KEY_AVISOS, JSON.stringify(avisos));
  };

  const getPortalSettings = () => {
    const raw = localStorage.getItem(STORAGE_KEY_PORTAL);
    return raw ? JSON.parse(raw) : defaultPortalSettings;
  };

  const setPortalSettings = (settings) => {
    localStorage.setItem(STORAGE_KEY_PORTAL, JSON.stringify(settings));
  };

  // --- TAB NAVIGATION LLOGIC ---
  const initTabs = () => {
    const tabButtons = document.querySelectorAll('.btn-tab-config');
    const sections = document.querySelectorAll('.config-tab-section');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // Reset all buttons styling
        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--sub)';
        });

        // Set active style on current button
        btn.classList.add('active');
        btn.style.background = 'var(--vv)';
        btn.style.color = '#fff';

        // Hide all sections, show target
        sections.forEach(sec => {
          if (sec.id === `section-${targetTab}`) {
            sec.style.display = '';
          } else {
            sec.style.display = 'none';
          }
        });
      });
    });
  };

  // --- ANNOUNCEMENTS / AVISOS CRUD ---
  const renderAvisosList = () => {
    const container = document.getElementById('listaAvisos');
    if (!container) return;

    const avisos = getStoredAvisos();
    container.innerHTML = '';

    if (avisos.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--muted); border: 2px dashed var(--border); border-radius: var(--r-md);">
          <i class="fas fa-bullhorn" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 0.5rem;"></i>
          <span>No hay avisos o encuestas publicados en este momento.</span>
        </div>`;
      return;
    }

    avisos.forEach(av => {
      const card = document.createElement('div');
      card.style.background = 'var(--bg)';
      card.style.border = '1px solid var(--border)';
      card.style.borderRadius = 'var(--r-md)';
      card.style.padding = '1rem';
      card.style.position = 'relative';

      let typeBadge = '';
      let borderLeftColor = 'var(--border)';

      if (av.tipo === 'aviso') {
        typeBadge = '<span class="badge-sicag badge-finalizado"><i class="fas fa-triangle-exclamation"></i> Aviso</span>';
        borderLeftColor = 'var(--ru)';
      } else if (av.tipo === 'convocatoria') {
        typeBadge = '<span class="badge-sicag badge-desarrollo"><i class="fas fa-bullhorn"></i> Convocatoria</span>';
        borderLeftColor = '#E65100';
      } else {
        typeBadge = '<span class="badge-sicag badge-activo"><i class="fas fa-newspaper"></i> Noticia</span>';
        borderLeftColor = 'var(--vp)';
      }

      card.style.borderLeft = `4px solid ${borderLeftColor}`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          ${typeBadge}
          <button class="btn-sicag btn-danger btn-icon btn-sm delete-aviso-btn" data-id="${av.id}" title="Eliminar publicación" style="padding: 0.2rem 0.4rem;">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
        <strong style="display: block; font-size: 0.9rem; color: var(--txt); margin-bottom: 0.25rem;">${av.titulo}</strong>
        <p style="font-size: 0.8rem; color: var(--sub); margin-bottom: 0.5rem; line-height: 1.4;">${av.contenido}</p>
        <div style="font-size: 0.7rem; color: var(--muted); display: flex; gap: 1rem;">
          <span><i class="fas fa-user"></i> ${av.autor}</span>
          <span><i class="fas fa-calendar-alt"></i> ${av.fecha}</span>
        </div>
      `;

      container.appendChild(card);
    });

    // Bind delete buttons
    container.querySelectorAll('.delete-aviso-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        if (confirm('¿Está seguro de eliminar esta publicación de la cartelera?')) {
          const remaining = getStoredAvisos().filter(av => av.id !== id);
          setStoredAvisos(remaining);
          renderAvisosList();
        }
      });
    });
  };

  const handleAvisoFormSubmit = (e) => {
    e.preventDefault();
    const titulo = document.getElementById('avisoTitulo').value.trim();
    const tipo = document.getElementById('avisoTipo').value;
    const contenido = document.getElementById('avisoContenido').value.trim();

    if (!titulo || !tipo || !contenido) return;

    const avisos = getStoredAvisos();
    const newAviso = {
      id: Date.now(),
      titulo,
      tipo,
      contenido,
      fecha: new Date().toISOString().split('T')[0],
      autor: 'Sala de Autogobierno'
    };

    avisos.unshift(newAviso);
    setStoredAvisos(avisos);
    renderAvisosList();

    // Reset form
    document.getElementById('formAviso').reset();

    // Show feedback
    alert('¡Publicación registrada con éxito en la cartelera digital!');
  };

  // --- PORTAL SETTINGS ---
  const loadPortalSettings = () => {
    const settings = getPortalSettings();

    document.getElementById('portalNombre').value = settings.nombre;
    document.getElementById('portalLema').value = settings.lema;
    document.getElementById('portalDescripcion').value = settings.descripcion;
    document.getElementById('portalTelefono').value = settings.telefono || '';
    document.getElementById('portalEmail').value = settings.email || '';
    document.getElementById('portalFacebook').value = settings.facebook || '';
  };

  const handlePortalFormSubmit = (e) => {
    e.preventDefault();

    const settings = {
      nombre: document.getElementById('portalNombre').value.trim(),
      lema: document.getElementById('portalLema').value.trim(),
      descripcion: document.getElementById('portalDescripcion').value.trim(),
      telefono: document.getElementById('portalTelefono').value.trim(),
      email: document.getElementById('portalEmail').value.trim(),
      facebook: document.getElementById('portalFacebook').value.trim()
    };

    setPortalSettings(settings);
    alert('Configuración del Portal Público guardada con éxito.');
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    renderAvisosList();
    loadPortalSettings();

    // Bind forms
    const formAviso = document.getElementById('formAviso');
    if (formAviso) formAviso.addEventListener('submit', handleAvisoFormSubmit);

    const formPortal = document.getElementById('formPortal');
    if (formPortal) formPortal.addEventListener('submit', handlePortalFormSubmit);
  });
})();

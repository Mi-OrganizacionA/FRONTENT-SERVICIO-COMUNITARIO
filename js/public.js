/* ============================================================
   SICAG — Portal Público JavaScript
   ============================================================ */
(function () {
  'use strict';

  // ==========================================
  // INTERACTIVIDAD CARTOGRAFÍA (IFRAME)
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    const mapTriggers = document.querySelectorAll('[data-map-target]');
    const iframe = document.getElementById('mapaIframe');

    mapTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        // Si es un enlace del footer y hace salto a #mapa, dejamos que ocurra normalmente
        // pero igual enviamos el postMessage
        const targetName = trigger.getAttribute('data-map-target');
        
        // Enviamos el mensaje al iframe
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'highlightCommunity',
            community: targetName
          }, '*');
        }

        // Añadir una pequeña animación visual en index.html si no es footer
        if (!trigger.classList.contains('footer-map-link')) {
          mapTriggers.forEach(t => t.style.background = '');
          trigger.style.background = 'rgba(46, 125, 50, 0.15)';
          trigger.style.borderRadius = '8px';
        }
      });
    });
  });

  /* ── NAV SCROLL ── */
  const nav = document.getElementById('pubNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    /* scrollTopBtn visibility manejado por animations.js (Anime.js) */
  }, { passive: true });


  /* ── HAMBURGER ── */
  const burger = document.getElementById('pubBurger');
  const navLinks = document.getElementById('pubNavLinks');
  const navCtas = document.getElementById('pubNavCtas');

  function closeMobileMenu() {
    burger.classList.remove('open');
    navLinks.classList.remove('mobile-open');
    navCtas.classList.remove('mobile-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  function openMobileMenu() {
    burger.classList.add('open');
    navLinks.classList.add('mobile-open');
    navCtas.classList.add('mobile-open');
    burger.setAttribute('aria-expanded', 'true');
  }

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    burger.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeMobileMenu();
  });

  // Auto-close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMobileMenu();
  }, { passive: true });

  /* ── PARALLAX HERO ── */
  const heroBg = document.querySelector('.pub-hero-bg');
  window.addEventListener('scroll', () => {
    if (heroBg) heroBg.style.transform = `scale(1.08) translateY(${window.scrollY * 0.25}px)`;
  }, { passive: true });

  /* ── SCROLL TO TOP ── */
  /* El click es manejado por animations.js (animación de lanzamiento) */
  // document.getElementById('scrollTopBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


  /* ── FADE-UP OBSERVER ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

  /* ── COUNTER ANIMATION ──
     Migrado a js/animations.js (Anime.js).
     Se mantiene aquí como fallback si Anime.js no carga.
  ── */
  function animCount(el, target, suffix = '') {
    let cur = 0, step = Math.ceil(target / 60);
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur.toLocaleString('es-VE') + suffix;
      if (cur >= target) clearInterval(t);
    }, 28);
  }
  /* Solo activar si Anime.js NO está disponible */
  if (typeof anime === 'undefined') {
    const statsIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          statsIO.unobserve(e.target);
          document.querySelectorAll('[data-count]').forEach(el => {
            animCount(el, parseInt(el.dataset.count), el.dataset.suffix || '');
          });
        }
      });
    }, { threshold: 0.5 });
    const statsEl = document.querySelector('.pub-stats');
    if (statsEl) statsIO.observe(statsEl);
  }


  /* ── CAROUSEL CARTELERA ── */
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('.pub-dot');
  let currentSlide = 0;
  let slideInterval;
  const visibleCards = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;

  function getCardWidth() {
    const cards = track ? track.querySelectorAll('.pub-news-card') : [];
    if (!cards[0]) return 0;
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    return cards[0].offsetWidth + gap;
  }

  function goToSlide(n) {
    const cards = track ? track.querySelectorAll('.pub-news-card') : [];
    const max = Math.max(0, cards.length - visibleCards());
    currentSlide = Math.max(0, Math.min(n, max));
    if (track) track.style.transform = `translateX(-${currentSlide * getCardWidth()}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  }
  function nextSlide() {
    const cards = track ? track.querySelectorAll('.pub-news-card') : [];
    const max = Math.max(0, cards.length - visibleCards());
    goToSlide(currentSlide >= max ? 0 : currentSlide + 1);
  }
  document.getElementById('carouselPrev')?.addEventListener('click', () => { goToSlide(currentSlide - 1); resetInterval(); });
  document.getElementById('carouselNext')?.addEventListener('click', () => { nextSlide(); resetInterval(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goToSlide(i); resetInterval(); }));
  function resetInterval() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 4500); }
  slideInterval = setInterval(nextSlide, 4500);

  // Reset carousel on resize (e.g. phone rotation)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goToSlide(0), 200);
  }, { passive: true });

  /* ── CONTACT FORM ── */
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i> ¡Mensaje Enviado!';
      btn.style.background = 'var(--vd)';
      contactForm.reset();
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }, 1500);
  });

  /* ── GLOBAL STATE PARA EXPLORADOR ── */
  let todasLasNoticias = [];
  let todosLosProyectos = [];
  let explorerType = '';
  let explorerPage = 1;
  const EXPLORER_PER_PAGE = 8;
  let explorerFiltered = [];

  /* ── CARGAR DATOS PUBLICOS ── */
  async function cargarDatosPublicos() {
    let proyectos = [];
    let noticias = [];
    let stats = null;

    try {
      // Soporte para API inyectada (Electron) o fetch REST backend
      if (window.api && window.api.getProyectosPublicos) {
        proyectos = await window.api.getProyectosPublicos().catch(e => {
            console.warn('Proyectos requiere auth o falló:', e.message);
            return [];
        });
        if (window.api.getNoticias) {
            noticias = await window.api.getNoticias().catch(e => {
                console.error('Error fetching noticias:', e.message);
                return [];
            });
        }
        if (window.api.getDashboardStats) {
            stats = await window.api.getDashboardStats().catch(e => {
                console.warn('Stats requiere auth o falló:', e.message);
                return null;
            });
        }
        if (!stats) {
            const baseApi = window.api.baseURL || 'https://sicag-api.onrender.com/api';
            const resS = await fetch(`${baseApi}/system/public-stats`).catch(()=>null);
            if (resS && resS.ok) stats = await resS.json();
        }
      } else {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const baseApi = window.api ? window.api.baseURL : (isLocal ? 'http://localhost:3000/api' : 'https://sicag-api.onrender.com/api');
        const resP = await fetch(`${baseApi}/proyectos/publico`).catch(()=>null);
        if (resP && resP.ok) proyectos = await resP.json();
        
        const resN = await fetch(`${baseApi}/cartelera/publico/activas`).catch(()=>null);
        if (resN && resN.ok) noticias = await resN.json();

        const resS = await fetch(`${baseApi}/system/public-stats`).catch(()=>null);
        if (resS && resS.ok) stats = await resS.json();
      }
      
      todasLasNoticias = noticias;
      todosLosProyectos = proyectos;

      renderProyectos(proyectos);
      renderNoticias(noticias);
      if (stats) renderStats(stats, proyectos.length);
    } catch(err) {
      console.error('Error general cargando datos publicos', err);
      renderProyectos([]);
      renderNoticias([]);
    } finally {
      const backendLoader = document.getElementById('backendLoader');
      if (backendLoader) {
        backendLoader.style.opacity = '0';
        setTimeout(() => backendLoader.remove(), 400);
      }
    }
  }

  function renderStats(stats, totalProyectos) {
    // Actualizar elementos con los datos reales
    // Agregamos data-count para que anime.js los anime cuando entre al viewport
    const map = {
      'idxHab': stats.habitantes || 0,
      'idxCC': 9,
      'idxHectareas': 156,
      't1Ha': 156,
      't1Proj': totalProyectos || stats.proyectos || 0,
      't1Prod': 8500,
      't2Elec': 92,
      't2Agua': 85,
      't2Gas': 78,
      't4Ninos': stats.ninos || 0,
      't4AdultosM': 850,
      't4Disc': 120,
      'dashHab': stats.habitantes || 0,
      'dashElec': stats.electores || 0,
      'dashCC': 9
    };

    for (const [id, value] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) {
        el.dataset.count = value;
        el.textContent = value.toLocaleString('es-VE') + (el.dataset.suffix || '');
      }
    }
  }

  function generarHtmlProyecto(p) {
     const estado = (p.estado || 'propuesto').toLowerCase();
     const avance = p.avance || 0;
     const esDestacado = p.destacado === true || p.destacado === 1 ||
                         p.is_featured === true || p.is_featured === 1;

     return `
       <div class="pub-card" style="background:#fff;border:1px solid var(--gray3);border-radius:var(--r-lg);padding:1.5rem;display:flex;flex-direction:column;box-shadow:var(--sh-sm);transition:var(--tr);cursor:pointer;" onclick="abrirModalDetalle(${p.id}, 'proyecto')">
          ${esDestacado ? `<div style="font-size:.65rem;font-weight:800;color:#E65100;background:#FFF8E1;border:1px solid #FFCC80;border-radius:20px;padding:.18rem .6rem;display:inline-flex;align-items:center;gap:.3rem;align-self:flex-start;margin-bottom:.6rem;text-transform:uppercase;letter-spacing:.05em;"><i class="fas fa-star"></i> Destacado</div>` : ''}
          <div style="font-size:0.75rem;font-weight:700;color:var(--vp);text-transform:uppercase;margin-bottom:0.5rem;display:flex;justify-content:space-between;">
             <span><i class="fas fa-hammer"></i> ${estado}</span>
             <span>${avance}%</span>
          </div>
          <h4 style="font-size:1rem;font-weight:700;margin-bottom:0.5rem;color:var(--dark)">${p.nombre_proyecto || ''}</h4>
          <p style="font-size:0.8rem;color:var(--gray4);flex:1;margin-bottom:1rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${p.descripcion || ''}</p>
          <div style="font-size:0.75rem;color:var(--gray4);border-top:1px solid var(--gray3);padding-top:0.75rem;">
             <i class="fas fa-map-marker-alt" style="color:var(--vv)"></i> ${p.consejo_comunal || 'Sector General'}
          </div>
       </div>
     `;
  }

  function renderProyectos(proyectos) {
    const grid = document.getElementById('indexProyectosGrid');
    if (!grid) return;
    
    // Ordenar destacados primero
    const ordenados = [...proyectos].sort((a, b) => {
      const aD = (a.destacado === true || a.destacado === 1) ? 1 : 0;
      const bD = (b.destacado === true || b.destacado === 1) ? 1 : 0;
      return bD - aD;
    });

    let html = '';
    const ultimos = ordenados.slice(-5).reverse(); // Mostrar 5 max en landing
    html += ultimos.map(p => generarHtmlProyecto(p)).join('');
    
    // Siempre agregar tarjeta ver mas
    html += `
      <div class="pub-card card-ver-mas" onclick="abrirExplorador('proyectos')" style="border-radius:var(--r-lg);padding:1.5rem;min-height:220px;">
         <i class="fas fa-arrow-right"></i>
         <h3>Ver más proyectos</h3>
      </div>
    `;
    grid.innerHTML = html;
    
    if(window.reinitCardsAnim) setTimeout(window.reinitCardsAnim, 50);
  }


  function generarHtmlNoticia(n) {
       const tipo = (n.tipo_publicacion || 'noticia').toLowerCase();
       let icono = 'fa-newspaper';
       let colorTag = 'var(--az)';
       let bgTag = '#E3F2FD';
       
       if (tipo === 'convocatoria') {
         icono = 'fa-bullhorn';
         colorTag = '#E65100';
         bgTag = '#FFF8E1';
       } else if (tipo === 'encuesta') {
         icono = 'fa-poll';
         colorTag = 'var(--vp)';
         bgTag = 'var(--vbg)';
       } else if (tipo === 'aviso') {
         icono = 'fa-triangle-exclamation';
         colorTag = 'var(--ru)';
         bgTag = '#FFEBEE';
       }
       
       const fecha = n.fecha_publicacion ? new Date(n.fecha_publicacion).toLocaleDateString() : '';
       const star = n.destacada ? '<i class="fas fa-star" style="color:#F9A825;margin-right:4px;"></i>' : '';
       const encuestaBtn = (tipo === 'encuesta' && n.enlace_extra)
         ? `<a href="${n.enlace_extra}" target="_blank" rel="noopener" class="pub-news-link" style="color:var(--vp);font-weight:600;margin-top:.5rem;display:inline-block;" onclick="event.stopPropagation();"><i class="fas fa-external-link-alt"></i> Participar en la encuesta</a>`
         : '';
       return `
         <div class="pub-news-card" style="cursor:pointer;${n.destacada ? 'border:2px solid #F9A825;' : ''}" onclick="abrirModalDetalle(${n.id}, 'noticia')">
            <div class="pub-news-body" style="display:flex;flex-direction:column;height:100%;">
               <div class="pub-news-tag" style="background:${bgTag};color:${colorTag};align-self:flex-start;">
                  ${star}<i class="fas ${icono}"></i> ${tipo}
               </div>
               <h4>${n.titulo || ''}</h4>
               <p style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1;">${n.contenido || ''}</p>
               ${encuestaBtn}
               <div class="pub-news-link" style="color:var(--gray4);border-top:1px solid var(--gray3);padding-top:1rem;width:100%;margin-top:1rem;">
                  <i class="fas fa-calendar" style="color:var(--vv);"></i> ${fecha}
               </div>
            </div>
         </div>
       `;
  }

  function renderNoticias(noticias) {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    // Ordenar: las publicaciones destacadas van primero
    const noticiasOrdenadas = [...noticias].sort((a, b) => {
      const aD = (a.destacada === true || a.destacada === 1) ? 1 : 0;
      const bD = (b.destacada === true || b.destacada === 1) ? 1 : 0;
      return bD - aD;
    });

    const activas = noticiasOrdenadas.slice(-5).reverse();
    track.style.justifyContent = 'flex-start';
    track.style.gap = '24px';
    
    let html = activas.map(n => generarHtmlNoticia(n)).join('');
    
    html += `
      <div class="pub-news-card card-ver-mas" onclick="abrirExplorador('noticias')" style="min-height:220px; flex: 0 0 calc(33.333% - 1rem);">
         <i class="fas fa-arrow-right"></i>
         <h3>Ver más noticias</h3>
      </div>
    `;
    track.innerHTML = html;
    
    if(window.reinitCardsAnim) setTimeout(window.reinitCardsAnim, 50);
  }

  /* ── LÓGICA DE MODALES Y EXPLORADOR ── */
  const modalDetalleOverlay = document.getElementById('modalDetalleOverlay');
  const modalExploradorOverlay = document.getElementById('modalExploradorOverlay');

  window.cerrarModales = function() {
    if(modalDetalleOverlay) {
      modalDetalleOverlay.classList.remove('open');
      modalDetalleOverlay.setAttribute('aria-hidden', 'true');
    }
    if(modalExploradorOverlay) {
      modalExploradorOverlay.classList.remove('open');
      modalExploradorOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  };

  document.getElementById('modalDetalleClose')?.addEventListener('click', () => {
    modalDetalleOverlay.classList.remove('open');
    modalDetalleOverlay.setAttribute('aria-hidden', 'true');
    if(!modalExploradorOverlay.classList.contains('open')) document.body.style.overflow = '';
  });
  document.getElementById('modalExploradorClose')?.addEventListener('click', window.cerrarModales);

  window.abrirModalDetalle = function(id, tipo) {
    const titleEl = document.getElementById('modalDetalleTitle');
    const infoEl = document.getElementById('modalDetalleInfo');
    const descEl = document.getElementById('modalDetalleDesc');

    let item = null;
    if (tipo === 'proyecto') {
      item = todosLosProyectos.find(p => String(p.id) === String(id));
      if (!item) return;
      titleEl.textContent = item.nombre_proyecto;
      infoEl.innerHTML = `
        <div class="pub-modal-info-item"><label>Estado</label><span>${item.estado || 'Propuesto'}</span></div>
        <div class="pub-modal-info-item"><label>Avance</label><span>${item.avance || 0}%</span></div>
        <div class="pub-modal-info-item"><label>Consejo Comunal</label><span>${item.consejo_comunal || 'N/A'}</span></div>
        <div class="pub-modal-info-item"><label>Presupuesto Estimado</label><span>${item.presupuesto_estimado ? Number(item.presupuesto_estimado).toLocaleString('es-VE',{style:'currency',currency:'VES'}) : 'No definido'}</span></div>
      `;
      descEl.textContent = item.descripcion || 'Sin descripción detallada.';
    } else if (tipo === 'noticia') {
      item = todasLasNoticias.find(n => String(n.id) === String(id));
      if (!item) return;
      titleEl.textContent = item.titulo;
      const fecha = item.fecha_publicacion ? new Date(item.fecha_publicacion).toLocaleDateString() : 'Desconocida';
      infoEl.innerHTML = `
        <div class="pub-modal-info-item"><label>Tipo</label><span><i class="fas fa-bullhorn"></i> ${item.tipo_publicacion || 'Noticia'}</span></div>
        <div class="pub-modal-info-item"><label>Fecha</label><span><i class="fas fa-calendar"></i> ${fecha}</span></div>
        <div class="pub-modal-info-item" style="grid-column: 1 / -1;"><label>Autor</label><span>${item.autor || 'Sistema SICAG'}</span></div>
      `;
      let descHtml = (item.contenido || '').replace(/\n/g, '<br>');
      if (item.tipo_publicacion === 'encuesta' && item.enlace_extra) {
        descHtml += `<p style="margin-top:1rem;"><a href="${item.enlace_extra}" target="_blank" rel="noopener" style="color:var(--vp);font-weight:600;"><i class="fas fa-external-link-alt"></i> Participar en la encuesta</a></p>`;
      }
      if (item.fecha_cierre) {
        const cierre = new Date(item.fecha_cierre).toLocaleDateString();
        infoEl.innerHTML += `<div class="pub-modal-info-item"><label>Cierre</label><span><i class="fas fa-hourglass-end"></i> ${cierre}</span></div>`;
      }
      descEl.innerHTML = descHtml;
    }

    modalDetalleOverlay.setAttribute('aria-hidden', 'false');
    modalDetalleOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.abrirExplorador = function(tipo) {
    explorerType = tipo;
    explorerPage = 1;
    const searchInput = document.getElementById('fsSearch');
    const filterStatus = document.getElementById('fsFilterStatus');
    
    if(searchInput) searchInput.value = '';
    if(document.getElementById('fsFilterCC')) document.getElementById('fsFilterCC').value = '';
    
    if (tipo === 'proyectos') {
      document.getElementById('fsTitle').textContent = 'Explorador de Proyectos';
      document.getElementById('fsSub').textContent = 'Proyectos agroecológicos y de infraestructura de los consejos comunales.';
      document.getElementById('fsIcon').innerHTML = '<i class="fas fa-seedling"></i>';
      if(filterStatus) {
        filterStatus.style.display = 'block';
        filterStatus.innerHTML = `
          <option value="">Todos los Estados</option>
          <option value="activo">Activo</option>
          <option value="desarrollo">En Desarrollo</option>
          <option value="propuesto">Propuesto</option>
          <option value="pendiente">Pendiente</option>
          <option value="completado">Completado</option>
        `;
      }
    } else {
      document.getElementById('fsTitle').textContent = 'Explorador de Noticias';
      document.getElementById('fsSub').textContent = 'Avisos, convocatorias y actualizaciones de la comuna.';
      document.getElementById('fsIcon').innerHTML = '<i class="fas fa-newspaper"></i>';
      if(filterStatus) {
        filterStatus.style.display = 'block';
        filterStatus.innerHTML = `
          <option value="">Todos los Tipos</option>
          <option value="noticia">Noticia</option>
          <option value="convocatoria">Convocatoria</option>
          <option value="encuesta">Encuesta</option>
          <option value="aviso">Aviso</option>
        `;
      }
    }
    
    filtrarExplorador();
    modalExploradorOverlay.setAttribute('aria-hidden', 'false');
    modalExploradorOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function filtrarExplorador() {
    const q = document.getElementById('fsSearch').value.toLowerCase().trim();
    const cc = document.getElementById('fsFilterCC').value;
    const status = document.getElementById('fsFilterStatus').value.toLowerCase();
    
    let base = explorerType === 'proyectos' ? todosLosProyectos : todasLasNoticias;
    
    explorerFiltered = base.filter(item => {
      // Búsqueda por texto
      const textMatch = explorerType === 'proyectos' ? 
        ((item.nombre_proyecto||'').toLowerCase().includes(q) || (item.descripcion||'').toLowerCase().includes(q)) :
        ((item.titulo||'').toLowerCase().includes(q) || (item.contenido||'').toLowerCase().includes(q));
        
      if (!textMatch) return false;
      
      // Búsqueda por CC
      if (cc) {
        if (explorerType === 'proyectos') {
           const cName = (item.consejo_comunal || '').toLowerCase();
           const keywordMap = {
              'jobito1': 'jobito i', 'jobito2': 'jobito ii', 'brisas': 'brisas',
              'aeb': 'andrés eloy', 'mercedes1': 'mercedes', 'santacruz': 'santa cruz', 'corozo': 'corozo'
           };
           const kw = keywordMap[cc] || cc;
           if (!cName.includes(kw)) return false;
        }
      }
      
      // Búsqueda por estado/tipo
      if (status) {
        if (explorerType === 'proyectos') {
          if ((item.estado||'').toLowerCase() !== status) return false;
        } else {
          if ((item.tipo_publicacion||'').toLowerCase() !== status) return false;
        }
      }
      
      return true;
    });
    
    explorerFiltered.reverse(); // más recientes primero
    explorerPage = 1;
    renderExploradorGrid();
  }

  document.getElementById('fsSearch')?.addEventListener('input', filtrarExplorador);
  document.getElementById('fsFilterCC')?.addEventListener('change', filtrarExplorador);
  document.getElementById('fsFilterStatus')?.addEventListener('change', filtrarExplorador);

  function renderExploradorGrid() {
    const grid = document.getElementById('fsGrid');
    const pagination = document.getElementById('fsPagination');
    if(!grid || !pagination) return;

    const start = (explorerPage - 1) * EXPLORER_PER_PAGE;
    const end = start + EXPLORER_PER_PAGE;
    const paged = explorerFiltered.slice(start, end);
    
    if (paged.length === 0) {
      grid.innerHTML = '<p style="text-align:center;width:100%;color:var(--gray4);grid-column:1/-1;">No se encontraron resultados.</p>';
      pagination.innerHTML = '';
      return;
    }
    
    if (explorerType === 'proyectos') {
      grid.innerHTML = paged.map(p => generarHtmlProyecto(p)).join('');
    } else {
      grid.innerHTML = paged.map(n => generarHtmlNoticia(n)).join('');
    }
    
    // Generar paginación
    const totalPages = Math.ceil(explorerFiltered.length / EXPLORER_PER_PAGE);
    let pagHtml = '';
    if (totalPages > 1) {
      for(let i=1; i<=totalPages; i++) {
        pagHtml += `<button class="pub-page-btn ${i===explorerPage?'active':''}" onclick="window.cambiarPaginaExplorador(${i})">${i}</button>`;
      }
    }
    pagination.innerHTML = pagHtml;
  }

  window.cambiarPaginaExplorador = function(p) {
    explorerPage = p;
    renderExploradorGrid();
    document.getElementById('modalExploradorOverlay').scrollTo({top:0, behavior:'smooth'});
  };

  // Ejecutar carga
  document.addEventListener('DOMContentLoaded', () => {
     cargarDatosPublicos();
     
     // ── BUSCADOR PÚBLICO DE HABITANTE (sin login) ──
     const searchBtn  = document.getElementById('habSearchBtn');
     const searchInp  = document.getElementById('habSearch');

     /**
      * Función principal de búsqueda — accesible sin autenticación.
      * Solo acepta cédula exacta (formato numérico).
      */
     window.buscarHabitantePublico = async function () {
       if (!searchBtn || !searchInp) return;

       const rawValue = (searchInp.value || '').trim();
       if (!rawValue) {
         mostrarModalHab({ error: 'Ingresa un número de cédula para buscar.' });
         return;
       }

       // Extraer solo los números de la cédula
       const soloNumeros = rawValue.replace(/[^0-9]/g, '');
       if (!soloNumeros || soloNumeros.length < 5) {
         mostrarModalHab({ error: 'Ingresa una cédula válida (solo números, mínimo 5 dígitos).' });
         return;
       }

       const btnOriginHTML = searchBtn.innerHTML;
       searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
       searchBtn.disabled = true;

       try {
         let habs = [];

         // Intentar API pública del backend primero (no requiere token)
         try {
           const baseUrl = (window.api && window.api.baseURL) || 'https://sicag-api.onrender.com/api';
           const res = await fetch(`${baseUrl}/habitantes/publico/buscar?cedula=${encodeURIComponent(soloNumeros)}`);
           if (res.ok) {
             const data = await res.json();
             // La respuesta puede ser el habitante directamente o un array
             habs = Array.isArray(data) ? data : (data.habitante ? [data.habitante] : (data.id ? [data] : []));
           }
         } catch (_) {
           // Si no hay endpoint público específico, fallback al endpoint general
         }

         // Fallback: usar window.api.getHabitantes si el anterior no dio resultado
         if (habs.length === 0 && window.api && window.api.getHabitantes) {
           try {
             const todos = await window.api.getHabitantes();
             habs = todos.filter(h =>
               h.cedula && h.cedula.toString().replace(/[^0-9]/g, '') === soloNumeros
             );
           } catch (_) {}
         }

         if (habs.length === 0) {
           // Segundo intento: fetch al backend sin autenticación
           try {
             const baseUrl2 = (window.api && window.api.baseURL) || 'https://sicag-api.onrender.com/api';
             const r2 = await fetch(`${baseUrl2}/habitantes?cedula=${soloNumeros}`);
             if (r2.ok) {
               const d2 = await r2.json();
               habs = Array.isArray(d2) ? d2 : (d2.habitantes || []);
             }
           } catch (_) {}
         }

         if (habs.length > 0) {
           mostrarModalHab({ habitante: habs[0] });
         } else {
           mostrarModalHab({ notFound: soloNumeros });
         }

       } catch (e) {
         mostrarModalHab({ error: 'Error de conexión al consultar. Intenta de nuevo.' });
       } finally {
         searchBtn.innerHTML = btnOriginHTML;
         searchBtn.disabled  = false;
       }
     };

     // Evento del botón y de la tecla Enter
     if (searchBtn) searchBtn.addEventListener('click', window.buscarHabitantePublico);
     if (searchInp) {
       searchInp.addEventListener('keydown', (e) => {
         if (e.key === 'Enter') window.buscarHabitantePublico();
       });
       // Permitir solo números y caracteres de cédula en este campo
       searchInp.addEventListener('keydown', (e) => {
         const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
         if (allowed.includes(e.key)) return;
         if (/^[0-9VvEe\-]$/.test(e.key)) return;
         e.preventDefault();
       });
     }
  });

  /**
   * Muestra el modal de resultado de búsqueda de habitante.
   * @param {Object} opts - { habitante, error, notFound }
   */
  function mostrarModalHab(opts) {
    const overlay = document.getElementById('modalHabOverlay');
    const body    = document.getElementById('modalHabBody');
    if (!overlay || !body) return;

    if (opts.error) {
      body.innerHTML = `
        <div class="mhab-icon error"><i class="fas fa-exclamation-circle"></i></div>
        <p class="mhab-status error">${opts.error}</p>
      `;
    } else if (opts.notFound) {
      body.innerHTML = `
        <div class="mhab-icon notfound"><i class="fas fa-user-slash"></i></div>
        <p class="mhab-status notfound">Cédula <strong>V-${opts.notFound}</strong> no encontrada en el padrón.</p>
        <p class="mhab-hint">Verifica el número de cédula. Si el habitante no está registrado,<br>acércate a la Sala de Autogobierno.</p>
      `;
    } else if (opts.habitante) {
      const h = opts.habitante;
      const nombre   = `${h.nombres || ''} ${h.apellidos || ''}`.trim() || 'Sin nombre';
      const cedula   = h.cedula ? `V-${h.cedula}` : 'Sin cédula';
      const consejo  = (h.consejo && h.consejo.nombre_comunidad) ||
                       h.consejo_comunal || h.nombre_comunidad || 'Registrado';
      const initials = nombre.split(' ').slice(0,2).map(p => p[0]||'').join('').toUpperCase();

      body.innerHTML = `
        <div class="mhab-avatar">${initials}</div>
        <div class="mhab-name">${nombre}</div>
        <div class="mhab-cedula">${cedula}</div>
        <div class="mhab-tags">
          <span class="mhab-tag"><i class="fas fa-house-chimney"></i> ${consejo}</span>
          <span class="mhab-tag ok"><i class="fas fa-circle-check"></i> Censado(a) ✓</span>
        </div>
        <p class="mhab-disclaimer">Los datos mostrados corresponden al registro público del padrón comunal.<br>Para más información, contacta a tu Consejo Comunal.</p>
      `;
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // Cerrar modal habitante
  document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('modalHabClose');
    const overlay  = document.getElementById('modalHabOverlay');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
    if (overlay) overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

})();


/* ============================================================
   SICAG — Portal Público JavaScript
   ============================================================ */
(function () {
  'use strict';

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
      } else {
        const resP = await fetch('http://localhost:3000/api/proyectos').catch(()=>null);
        if (resP && resP.ok) proyectos = await resP.json();
        
        const resN = await fetch('http://localhost:3000/api/noticias').catch(()=>null);
        if (resN && resN.ok) noticias = await resN.json();
        
        const resS = await fetch('http://localhost:3000/api/dashboard/stats').catch(()=>null);
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
     // Usamos JSON.stringify y escape para pasar el objeto al onclick, pero es mejor pasar el ID y buscarlo.
     return `
       <div class="pub-card" style="background:#fff;border:1px solid var(--gray3);border-radius:var(--r-lg);padding:1.5rem;display:flex;flex-direction:column;box-shadow:var(--sh-sm);transition:var(--tr);cursor:pointer;" onclick="abrirModalDetalle(${p.id}, 'proyecto')">
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
    
    let html = '';
    const ultimos = proyectos.slice(-5).reverse(); // Mostrar 5 max en landing
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
       return `
         <div class="pub-news-card" style="cursor:pointer;" onclick="abrirModalDetalle(${n.id}, 'noticia')">
            <div class="pub-news-body" style="display:flex;flex-direction:column;height:100%;">
               <div class="pub-news-tag" style="background:${bgTag};color:${colorTag};align-self:flex-start;">
                  <i class="fas ${icono}"></i> ${tipo}
               </div>
               <h4>${n.titulo || ''}</h4>
               <p style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1;">${n.contenido || ''}</p>
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

    const activas = noticias.slice(-5).reverse();
    track.style.justifyContent = 'flex-start'; // Reset justify si habian
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
      item = todosLosProyectos.find(p => p.id === id);
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
      item = todasLasNoticias.find(n => n.id === id);
      if (!item) return;
      titleEl.textContent = item.titulo;
      const fecha = item.fecha_publicacion ? new Date(item.fecha_publicacion).toLocaleDateString() : 'Desconocida';
      infoEl.innerHTML = `
        <div class="pub-modal-info-item"><label>Tipo</label><span><i class="fas fa-bullhorn"></i> ${item.tipo_publicacion || 'Noticia'}</span></div>
        <div class="pub-modal-info-item"><label>Fecha</label><span><i class="fas fa-calendar"></i> ${fecha}</span></div>
        <div class="pub-modal-info-item" style="grid-column: 1 / -1;"><label>Autor</label><span>${item.autor || 'Sistema SICAG'}</span></div>
      `;
      descEl.innerHTML = (item.contenido || '').replace(/\n/g, '<br>');
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
     
     // Habilitar Buscador de Habitante en Landing Page
     const searchBtn = document.getElementById('habSearchBtn');
     if (searchBtn) {
       searchBtn.addEventListener('click', async () => {
         const btnOriginHTML = searchBtn.innerHTML;
         searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
         searchBtn.disabled = true;
         
         const input = document.getElementById('habSearch');
         const q = (input ? input.value : '').toLowerCase().trim();
         
         try {
            let habs = [];
            if (window.api && window.api.getHabitantes) {
              habs = await window.api.getHabitantes();
            } else {
              const res = await fetch('http://localhost:3000/api/habitantes').catch(()=>null);
              if (res && res.ok) habs = await res.json();
            }
            
            const match = habs.find(h => 
               (h.cedula && h.cedula.toString() === q) || 
               (h.nombres && h.nombres.toLowerCase().includes(q))
            );
            
            if (match) {
               alert(`✅ HABITANTE ENCONTRADO:\n\nNombre: ${match.nombres} ${match.apellidos || ''}\nC.I.: V-${match.cedula}\nConsejo Comunal: ${match.consejo ? match.consejo.nombre_comunidad : 'Registrado'}\nEstatus: Censado(a) correctamente en la plataforma SICAG.`);
            } else {
               alert(`❌ NO ENCONTRADO:\nNo se hallaron coincidencias para "${q}". Verifica el número de cédula o el nombre.`);
            }
         } catch(e) {
            alert('Error de conexión al consultar habitante.');
         }
         
         searchBtn.innerHTML = btnOriginHTML;
         searchBtn.disabled = false;
       });
     }
  });

})();

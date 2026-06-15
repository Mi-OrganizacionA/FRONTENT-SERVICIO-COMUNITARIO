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

    // Cargar Configuración del Portal
    const portalConfig = JSON.parse(localStorage.getItem('sicag_portal_settings') || '{}');
    if (Object.keys(portalConfig).length > 0) {
      const setEl = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
      setEl('txtContactDir', portalConfig.direccion);
      setEl('txtContactTlf', portalConfig.telefono);
      setEl('txtContactHorario', portalConfig.horario);
      setEl('txtContactCorreo', portalConfig.correo);

      // Limpiar números para WhatsApp URL
      const waNumber = (portalConfig.telefono || '').replace(/\D/g, '');
      const waLink = waNumber ? `https://wa.me/${waNumber}?text=Hola,%20les%20escribo%20desde%20el%20portal%20SICAG` : '#';

      // Actualizar redes (Contacto y Footer)
      document.querySelectorAll('.pub-btn-whatsapp').forEach(a => a.href = waLink);
      document.querySelectorAll('.pub-btn-facebook').forEach(a => a.href = portalConfig.facebook || '#');
      document.querySelectorAll('.pub-btn-instagram').forEach(a => a.href = portalConfig.instagram || '#');
      document.querySelectorAll('.pub-btn-tiktok').forEach(a => a.href = portalConfig.tiktok || '#');
    }
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
  
  function getCardWidth() {
    const cards = track ? track.querySelectorAll('.pub-news-card') : [];
    if (!cards[0]) return 0;
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    return cards[0].offsetWidth + gap;
  }

  function goToSlide(n) {
    if(!track) return;
    const cards = track.querySelectorAll('.pub-news-card');
    const wrap = track.parentElement; // pub-carousel-wrap
    const visibleCards = Math.floor(wrap.offsetWidth / getCardWidth()) || 1;
    const max = Math.max(0, cards.length - visibleCards);
    currentSlide = Math.max(0, Math.min(n, max));
    
    wrap.scrollTo({
      left: currentSlide * getCardWidth(),
      behavior: 'smooth'
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  }
  
  function nextSlide() {
    if(!track) return;
    const cards = track.querySelectorAll('.pub-news-card');
    const wrap = track.parentElement;
    const visibleCards = Math.floor(wrap.offsetWidth / getCardWidth()) || 1;
    const max = Math.max(0, cards.length - visibleCards);
    goToSlide(currentSlide >= max ? 0 : currentSlide + 1);
  }
  
  document.getElementById('carouselPrev')?.addEventListener('click', () => { goToSlide(currentSlide - 1); resetInterval(); });
  document.getElementById('carouselNext')?.addEventListener('click', () => { nextSlide(); resetInterval(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goToSlide(i); resetInterval(); }));
  function resetInterval() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 4500); }
  slideInterval = setInterval(nextSlide, 4500);

  // Sincronizar dots con el scroll manual
  if(track) {
    track.parentElement.addEventListener('scroll', () => {
      const scrollLeft = track.parentElement.scrollLeft;
      const index = Math.round(scrollLeft / getCardWidth());
      if(index !== currentSlide) {
        currentSlide = index;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
      }
    }, { passive: true });
  }

  // Reset carousel on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goToSlide(0), 200);
  }, { passive: true });

  /* ── CONTACT FORM ── */
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    
    // Obtener datos
    const nombre = document.getElementById('cNombre').value;
    const correo = document.getElementById('cCorreo')?.value || '';
    const consejoComunal = document.getElementById('cCC').value;
    const mensaje = document.getElementById('cMensaje').value;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;

    try {
      if (window.api && window.api.enviarContacto) {
        await window.api.enviarContacto({ nombre, correo, consejoComunal, mensaje });
      } else {
        // Fallback simulación si API no está cargada
        await new Promise(r => setTimeout(r, 1500));
      }
      
      btn.innerHTML = '<i class="fas fa-check"></i> ¡Mensaje enviado! Nuestros administradores lo revisarán en breve.';
      btn.style.background = 'var(--vd)';
      contactForm.reset();
    } catch (err) {
      console.error(err);
      btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al enviar';
      btn.style.background = 'var(--ru)';
    } finally {
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }
  });

  /* ── GLOBAL STATE PARA EXPLORADOR ── */
  let todasLasNoticias = [];
  let todosLosProyectos = [];
  let explorerType = '';
  let explorerPage = 1;
  const EXPLORER_PER_PAGE = 8;
  let explorerFiltered = [];

  /* ── CARGAR DATOS PUBLICOS ── */
  
  // ─────────────────────────────────────────
  // REGISTRO DE PWA Y MODO OFFLINE (PÚBLICO)
  // ─────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[PWA Público] Service Worker registrado:', reg.scope);
      }).catch(err => {
        console.warn('[PWA Público] Fallo al registrar:', err);
      });
    });
  }
  
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  }

  async function cargarDatosPublicos() {
    let proyectos = [];
    let noticias = [];
    let stats = null;

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
      const baseApi = window.api ? window.api.baseURL : (isLocal ? 'http://localhost:3000/api' : 'https://sicag-api.onrender.com/api');

      // 1. Proyectos públicos
      try {
        if (window.api && window.api.getProyectosPublicos) {
          proyectos = await window.api.getProyectosPublicos();
        } else {
          const resP = await fetch(`${baseApi}/proyectos/publico`);
          if (resP.ok) proyectos = await resP.json();
        }
      } catch (e) {
        console.warn('Error cargando proyectos públicos:', e.message);
      }

      // 2. Noticias públicas (Cartelera)
      try {
        if (window.api && window.api.getNoticias) {
          noticias = await window.api.getNoticias();
        } else {
          const resN = await fetch(`${baseApi}/cartelera/publico/activas`);
          if (resN.ok) noticias = await resN.json();
        }
      } catch (e) {
        console.warn('Error cargando noticias públicas:', e.message);
      }

      // 3. Stats públicas
      try {
        const resS = await fetch(`${baseApi}/system/public-stats`);
        if (resS.ok) stats = await resS.json();
      } catch (e) {
        console.warn('Error cargando stats públicas:', e.message);
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

     const nombresConsejo = {
       1: 'C.C. Jobito I',
       2: 'C.C. Jobito II',
       3: 'C.C. Jobito III',
       10: 'Para toda la Comuna'
     };
     const nombreConsejo = nombresConsejo[p.id_comunidad] || p.consejo_comunal || p.consejo || 'Sector General';

     let badgeColor = 'rgba(21,101,192,.1)';
     let textColor = '#1565C0';
     if(estado === 'aprobado') { badgeColor = 'rgba(106,27,154,.1)'; textColor = '#6A1B9A'; }
     else if(estado === 'en_ejecucion') { badgeColor = 'rgba(230,81,0,.1)'; textColor = '#E65100'; }
     else if(estado === 'finalizado') { badgeColor = 'rgba(27,94,32,.12)'; textColor = '#1B5E20'; }

     return `
        <div class="proj-card fade-in-up" data-id="${p.id}" onclick="abrirModalDetalle(${p.id}, 'proyecto')" style="background:#fff; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.05); overflow:hidden; position:relative; display:flex; flex-direction:column; cursor:pointer; transition:transform 0.3s, box-shadow 0.3s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 10px 25px rgba(0,0,0,.1)';" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
          <div style="height:4px; width:100%; background:${textColor};"></div>
          <div style="padding: 1.5rem; display: flex; flex-direction: column; flex: 1; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="background: ${badgeColor}; color: ${textColor}; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;"><i class="fas fa-circle" style="font-size:0.5rem;margin-right:4px;vertical-align:middle;margin-bottom:1px;"></i> ${estado}</span>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--gray5);"><i class="fas fa-tag" style="color:var(--gray4);"></i> ${p.tipo_proyecto || 'General'}</span>
            </div>
            
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--dark); line-height: 1.35;">${p.titulo || p.nombre_proyecto || ''}</div>
            
            <div style="font-size: 0.85rem; color: var(--gray4); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.descripcion || ''}</div>
            
            <div style="margin-top: auto; padding-top: 0.5rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: var(--muted); margin-bottom: 0.4rem;">
                <span>Avance del Proyecto</span>
                <span style="color:${textColor};">${avance}%</span>
              </div>
              <div style="height: 6px; background: #F0F0F0; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${avance}%; background: ${textColor}; border-radius: 4px; transition:width 0.5s ease;"></div>
              </div>
            </div>
            
            <div style="margin-top: 0.5rem; border-top: 1px dashed #E0E0E0; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--gray5);">
                <i class="fas fa-map-marker-alt" style="color:var(--vv);margin-right:4px;"></i>${nombreConsejo}
              </div>
              <div style="color:var(--vp); font-size: 0.8rem; font-weight: 700;"><i class="fas fa-arrow-right"></i> Ver Detalles</div>
            </div>
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
      titleEl.textContent = item.titulo || item.nombre_proyecto || 'Proyecto sin título';
      
      const nombresConsejo = {
        1: 'C.C. Jobito I',
        2: 'C.C. Jobito II',
        3: 'C.C. Jobito III',
        10: 'Para toda la Comuna'
      };
      const nombreConsejo = nombresConsejo[item.id_comunidad] || item.consejo_comunal || item.consejo || 'Sector General';

      const estado = (item.estado || 'propuesto').toLowerCase();
      let badgeColor = 'rgba(21,101,192,.1)'; let textColor = '#1565C0';
      if(estado === 'aprobado') { badgeColor = 'rgba(106,27,154,.1)'; textColor = '#6A1B9A'; }
      else if(estado === 'en_ejecucion') { badgeColor = 'rgba(230,81,0,.1)'; textColor = '#E65100'; }
      else if(estado === 'finalizado') { badgeColor = 'rgba(27,94,32,.12)'; textColor = '#1B5E20'; }

      infoEl.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; width: 100%;">
          <div style="background:#F9FAFB;border:1px solid #EAEEF2;border-radius:12px;padding:1.25rem;margin-bottom:1.5rem;display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
             <div>
                <div style="font-size:.7rem;color:var(--gray4);font-weight:700;text-transform:uppercase;margin-bottom:.3rem;letter-spacing:0.5px;"><i class="fas fa-map-marker-alt" style="color:var(--vv);"></i> Consejo Comunal</div>
                <div style="font-size:.85rem;font-weight:700;color:var(--dark);">${nombreConsejo}</div>
             </div>
             <div>
                <div style="font-size:.7rem;color:var(--gray4);font-weight:700;text-transform:uppercase;margin-bottom:.3rem;letter-spacing:0.5px;"><i class="fas fa-user-tie" style="color:var(--vv);"></i> Responsable</div>
                <div style="font-size:.85rem;font-weight:700;color:var(--dark);">${item.responsable || 'Comunidad'}</div>
             </div>
             <div>
                <div style="font-size:.7rem;color:var(--gray4);font-weight:700;text-transform:uppercase;margin-bottom:.3rem;letter-spacing:0.5px;"><i class="fas fa-calendar-alt" style="color:var(--vv);"></i> Inicio / Registro</div>
                <div style="font-size:.85rem;font-weight:700;color:var(--dark);">${item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString() : 'Por definir'}</div>
             </div>
             <div>
                <div style="font-size:.7rem;color:var(--gray4);font-weight:700;text-transform:uppercase;margin-bottom:.3rem;letter-spacing:0.5px;"><i class="fas fa-calendar-check" style="color:var(--vv);"></i> Culminación</div>
                <div style="font-size:.85rem;font-weight:700;color:var(--dark);">${item.fecha_fin ? new Date(item.fecha_fin).toLocaleDateString() : 'Por definir'}</div>
             </div>
          </div>

          <div style="margin-bottom:1.5rem;">
             <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:.5rem;">
                <span style="font-size:.8rem;font-weight:700;color:var(--muted);"><i class="fas fa-tasks"></i> Avance del Proyecto</span>
                <span style="color:${textColor};font-size:1.25rem;font-weight:800;">${item.avance || 0}%</span>
             </div>
             <div style="height:8px;background:#E0E0E0;border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${item.avance || 0}%;background:${textColor};border-radius:4px;"></div>
             </div>
          </div>
          
          <div style="display:flex;gap:1rem;margin-bottom:0.5rem;flex-wrap:wrap;">
             <div style="background:${badgeColor};color:${textColor};padding:.4rem 1rem;border-radius:20px;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;"><i class="fas fa-circle" style="font-size:0.5rem;vertical-align:middle;margin-bottom:1px;margin-right:2px;"></i> ${estado}</div>
             <div style="background:#FFF3E0;color:#E65100;padding:.4rem 1rem;border-radius:20px;font-size:.75rem;font-weight:800;"><i class="fas fa-coins"></i> ${item.presupuesto_estimado && item.presupuesto_estimado > 0 ? Number(item.presupuesto_estimado).toLocaleString('es-VE',{style:'currency',currency:'VES'}) : 'Sin presupuesto'}</div>
          </div>
        </div>
      `;
      descEl.innerHTML = `<div style="padding-top:1rem;border-top:1px dashed #E0E0E0;"><p style="font-size:0.95rem;color:var(--sub);line-height:1.6;">${item.descripcion || 'Sin descripción detallada.'}</p></div>`;
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
    const filterCC = document.getElementById('fsFilterCC');
    
    if(searchInput) searchInput.value = '';
    if(filterCC) filterCC.value = '';
    
    if (tipo === 'proyectos') {
      document.getElementById('fsTitle').textContent = 'Explorador de Proyectos';
      document.getElementById('fsSub').textContent = 'Proyectos agroecológicos y de infraestructura de los consejos comunales.';
      document.getElementById('fsIcon').innerHTML = '<i class="fas fa-seedling"></i>';
      if(filterCC) filterCC.style.display = 'inline-block';
      if(filterStatus) {
        filterStatus.style.display = 'inline-block';
        filterStatus.innerHTML = `
          <option value="">Todos los Estados</option>
          <option value="propuesto">Propuesto</option>
          <option value="aprobado">Aprobado</option>
          <option value="en_ejecucion">En Ejecución</option>
          <option value="finalizado">Finalizado</option>
          <option value="rechazado">Rechazado</option>
        `;
      }
    } else {
      document.getElementById('fsTitle').textContent = 'Explorador de Noticias';
      document.getElementById('fsSub').textContent = 'Avisos, convocatorias y actualizaciones de la comuna.';
      document.getElementById('fsIcon').innerHTML = '<i class="fas fa-newspaper"></i>';
      if(filterCC) filterCC.style.display = 'none';
      if(filterStatus) {
        filterStatus.style.display = 'inline-block';
        filterStatus.innerHTML = `
          <option value="">Todos los Tipos</option>
          <option value="noticia">Noticia general</option>
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
    const cc = document.getElementById('fsFilterCC') ? document.getElementById('fsFilterCC').value : '';
    const status = document.getElementById('fsFilterStatus') ? document.getElementById('fsFilterStatus').value.toLowerCase() : '';
    
    let base = explorerType === 'proyectos' ? todosLosProyectos : todasLasNoticias;
    
    explorerFiltered = base.filter(item => {
      // Búsqueda por texto
      const textMatch = explorerType === 'proyectos' ? 
        ((item.titulo||item.nombre_proyecto||'').toLowerCase().includes(q) || (item.descripcion||'').toLowerCase().includes(q)) :
        ((item.titulo||'').toLowerCase().includes(q) || (item.contenido||'').toLowerCase().includes(q));
        
      if (!textMatch) return false;
      
      // Búsqueda por CC
      if (cc && explorerType === 'proyectos') {
         const nombresConsejo = {
           1: 'C.C. Jobito I', 2: 'C.C. Jobito II', 3: 'C.C. Jobito III', 10: 'Para toda la Comuna'
         };
         const cName = (nombresConsejo[item.id_comunidad] || item.consejo_comunal || item.consejo || '').toLowerCase();
         const keywordMap = {
            'jobito1': 'jobito i', 'jobito2': 'jobito ii', 'brisas': 'brisas',
            'aeb': 'andrés eloy', 'mercedes1': 'mercedes', 'santacruz': 'santa cruz', 'corozo': 'corozo'
         };
         const kw = keywordMap[cc] || cc;
         if (!cName.includes(kw)) return false;
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

         // Usar el endpoint público del backend (no requiere token).
         // El parámetro que acepta el backend es '?q=' (ver buscarPublico en habitantesController.js).
         try {
           const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
           const baseUrl = (window.api && window.api.baseURL) || (isLocal ? 'http://localhost:3000/api' : 'https://sicag-api.onrender.com/api');
           const res = await fetch(`${baseUrl}/habitantes/publico/buscar?q=${encodeURIComponent(soloNumeros)}`);
           
           if (res.ok) {
             const data = await res.json();
             // La respuesta puede ser un array o un objeto con el habitante
             habs = Array.isArray(data) ? data : (data.habitante ? [data.habitante] : (data.id ? [data] : []));
             // Filtrar para que la cédula coincida exactamente (el backend hace búsqueda parcial con LIKE)
             habs = habs.filter(h => h.cedula && h.cedula.toString().replace(/[^0-9]/g, '') === soloNumeros);
           } else if (res.status === 429) {
             mostrarModalHab({ error: 'Demasiadas consultas. Por favor, espera un minuto y vuelve a intentar.' });
             return;
           }
         } catch (_) {
           // Error de red — el resultado quedará vacío, se mostrará "no encontrado"
         }

         // NOTA: No hacemos fallback a window.api.getHabitantes() ni a /api/habitantes
         // porque ambos endpoints requieren autenticación y causarían un error 401 + cierre de sesión.

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
      
      const edadStr = h.edad ? `${h.edad} años` : 'N/D';
      const generoStr = h.genero === 'M' ? 'Masculino' : (h.genero === 'F' ? 'Femenino' : (h.genero || 'N/D'));
      const electorStr = h.elector ? 'Habilitado(a)' : 'No Elector';

      body.innerHTML = `
        <div class="mhab-avatar">${initials}</div>
        <div class="mhab-name">${nombre}</div>
        <div class="mhab-cedula">${cedula}</div>
        <div class="mhab-tags" style="margin-bottom:1rem;">
          <span class="mhab-tag"><i class="fas fa-house-chimney"></i> ${consejo}</span>
          <span class="mhab-tag ok"><i class="fas fa-circle-check"></i> Censado(a) ✓</span>
        </div>
        
        <div style="background:rgba(0,0,0,0.03); border-radius:12px; padding:1rem; margin-bottom:1.5rem; text-align:left; display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; font-size:0.9rem;">
          <div>
            <div style="color:var(--gray5); font-weight:600; font-size:0.75rem; text-transform:uppercase;">Edad</div>
            <div style="color:var(--vp); font-weight:700;"><i class="fas fa-user-clock" style="opacity:0.6;"></i> ${edadStr}</div>
          </div>
          <div>
            <div style="color:var(--gray5); font-weight:600; font-size:0.75rem; text-transform:uppercase;">Género</div>
            <div style="color:var(--vp); font-weight:700;"><i class="fas fa-venus-mars" style="opacity:0.6;"></i> ${generoStr}</div>
          </div>
          <div style="grid-column: span 2;">
            <div style="color:var(--gray5); font-weight:600; font-size:0.75rem; text-transform:uppercase;">Estatus Electoral</div>
            <div style="color:var(--vp); font-weight:700;"><i class="fas fa-vote-yea" style="opacity:0.6;"></i> ${electorStr}</div>
          </div>
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


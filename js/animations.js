/* ============================================================
   SICAG — Animaciones con Anime.js v3
   Módulo central de animaciones para index.html y login.html
   ============================================================ */
(function () {
  'use strict';

  /* ── Utilidad: esperar a que el DOM esté listo ── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ────────────────────────────────────────────────────────────
     ANIMACIONES DE INDEX.HTML — PORTAL PÚBLICO
  ──────────────────────────────────────────────────────────── */

  function initPublicAnimations() {
    if (!document.querySelector('.pub-hero')) return; // No es index

    /* ── 1. TRICOLOR BAR — wipe de izquierda a derecha ── */
    const tricolorEl = document.querySelector('.pub-tricolor');
    if (tricolorEl) {
      // Anime.js v3 requiere que transform-origin se ponga via style
      tricolorEl.style.transformOrigin = 'left center';
      tricolorEl.style.transform = 'scaleX(0)';
      anime({
        targets: tricolorEl,
        scaleX: [0, 1],
        duration: 900,
        easing: 'easeOutExpo',
      });
    }

    /* ── 2. NAV — desliza desde arriba ── */
    const nav = document.getElementById('pubNav');
    if (nav) {
      // Forzar estado inicial oculto por JS también (por si CSS no cargó aún)
      nav.style.opacity = '0';
      nav.style.transform = 'translateY(-80px)';
      anime({
        targets: nav,
        translateY: [-80, 0],
        opacity: [0, 1],
        duration: 700,
        delay: 200,
        easing: 'easeOutExpo',
      });
    }

    /* ── 3. HERO — timeline escalonado badge → h1 → p → botones ── */
    const heroTimeline = anime.timeline({
      easing: 'easeOutExpo',
    });

    const heroBadge = document.querySelector('.pub-hero-badge');
    const heroH1 = document.querySelector('.pub-hero h1');
    const heroP = document.querySelector('.pub-hero-content > p');
    const heroBtns = document.querySelectorAll('.pub-hero-btns .btn-prim, .pub-hero-btns .btn-sec');
    const heroScroll = document.querySelector('.pub-hero-scroll');

    if (heroBadge) {
      heroTimeline.add({
        targets: heroBadge,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 400,
      });
    }

    if (heroH1) {
      heroTimeline.add({
        targets: heroH1,
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 700,
      }, '-=300');
    }

    if (heroP) {
      heroTimeline.add({
        targets: heroP,
        translateY: [25, 0],
        opacity: [0, 1],
        duration: 600,
      }, '-=400');
    }

    if (heroBtns.length) {
      heroTimeline.add({
        targets: heroBtns,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(120),
      }, '-=300');
    }

    if (heroScroll) {
      heroTimeline.add({
        targets: heroScroll,
        translateY: [10, 0],
        opacity: [0, 1],
        duration: 400,
      }, '-=100');
    }

    /* ── 3b. Hero scroll indicator — bounce loop ── */
    if (heroScroll) {
      anime({
        targets: heroScroll,
        translateY: [0, 6],
        duration: 1000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        delay: 1800,
      });
    }

    /* ── 4. STATS COUNTERS — animación Anime.js al entrar en viewport ── */
    const statsSection = document.querySelector('.pub-stats');
    if (statsSection) {
      const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            statsObserver.disconnect();
            animateCounters();
            animateStatItems();
          }
        });
      }, { threshold: 0.4 });
      statsObserver.observe(statsSection);
    }

    function animateCounters() {
      document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const obj = { val: 0 };
        anime({
          targets: obj,
          val: target,
          round: 1,
          duration: 1800,
          easing: 'easeOutExpo',
          update: function () {
            el.textContent = obj.val.toLocaleString('es-VE') + suffix;
          },
          complete: function () {
            /* Pulse suave al finalizar */
            anime({
              targets: el.parentElement,
              scale: [1, 1.06, 1],
              duration: 450,
              easing: 'easeInOutSine',
            });
          }
        });
      });
    }

    function animateStatItems() {
      anime({
        targets: '.pub-stat-item',
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 700,
        delay: anime.stagger(150),
        easing: 'easeOutBack',
      });
    }

    /* ── 5. CARDS SCROLL — IntersectionObserver + Anime.js stagger ── */
    function createScrollAnimator(selector, options = {}) {
      const elements = document.querySelectorAll(selector);
      if (!elements.length) return;

      const observer = new IntersectionObserver((entries, obs) => {
        const visible = [];
        entries.forEach(e => {
          if (e.isIntersecting) {
            visible.push(e.target);
            obs.unobserve(e.target);
          }
        });
        if (visible.length) {
          anime({
            targets: visible,
            translateY: options.translateY ?? [45, 0],
            translateX: options.translateX ?? [0, 0],
            opacity: [0, 1],
            duration: options.duration ?? 700,
            delay: anime.stagger(options.stagger ?? 100),
            easing: options.easing ?? 'easeOutExpo',
          });
        }
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

      elements.forEach(el => {
        // Ocultar previamente solo los que no tendrán fade-up CSS
        if (!el.classList.contains('fade-up')) {
          el.style.opacity = '0';
        }
        observer.observe(el);
      });
    }

    // Tarjetas Habitante
    createScrollAnimator('.pub-hab-card', {
      translateY: [50, 0],
      stagger: 120,
      easing: 'easeOutBack',
    });

    // Tarjetas 7 Transformaciones
    createScrollAnimator('.pub-7t-card', {
      translateX: [-40, 0],
      translateY: [20, 0],
      stagger: 140,
      duration: 750,
      easing: 'easeOutExpo',
    });

    // Section labels y títulos
    createScrollAnimator('.pub-section-label', {
      translateY: [20, 0],
      stagger: 0,
      duration: 500,
    });

    // Items de lista CC
    createScrollAnimator('.pub-cc-item', {
      translateX: [-20, 0],
      translateY: [0, 0],
      stagger: 60,
      duration: 400,
      easing: 'easeOutSine',
    });

    // Cards de noticias (carousel)
    createScrollAnimator('.pub-news-card', {
      translateY: [30, 0],
      stagger: 90,
      duration: 500,
    });

    // Contacto grid items
    createScrollAnimator('.pub-contact-item', {
      translateX: [-25, 0],
      translateY: [0, 0],
      stagger: 80,
      duration: 500,
    });

    /* ── 6. HOVER MICRO-ANIMATIONS en tarjetas ── */
    document.querySelectorAll('.pub-hab-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        anime({
          targets: card.querySelector('.pub-hab-icon'),
          scale: [1, 1.15],
          rotate: [0, -5],
          duration: 300,
          easing: 'easeOutBack',
        });
      });
      card.addEventListener('mouseleave', () => {
        anime({
          targets: card.querySelector('.pub-hab-icon'),
          scale: [1.15, 1],
          rotate: [-5, 0],
          duration: 250,
          easing: 'easeInOutSine',
        });
      });
    });

    document.querySelectorAll('.pub-7t-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        anime({
          targets: card.querySelector('.pub-7t-icon'),
          scale: [1, 1.12],
          duration: 280,
          easing: 'easeOutBack',
        });
        anime({
          targets: card.querySelectorAll('.pub-7t-stat span'),
          translateY: [0, -3],
          duration: 250,
          delay: anime.stagger(40),
          easing: 'easeOutSine',
        });
      });
      card.addEventListener('mouseleave', () => {
        anime({
          targets: card.querySelector('.pub-7t-icon'),
          scale: [1.12, 1],
          duration: 220,
          easing: 'easeInOutSine',
        });
        anime({
          targets: card.querySelectorAll('.pub-7t-stat span'),
          translateY: [-3, 0],
          duration: 200,
          delay: anime.stagger(30),
          easing: 'easeInOutSine',
        });
      });
    });

    /* ── 7. SUBMIT BUTTON — animación al hover ── */
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('mouseenter', () => {
        anime({
          targets: submitBtn.querySelector('i'),
          rotate: [0, -15],
          scale: [1, 1.3],
          duration: 300,
          easing: 'easeOutBack',
        });
      });
      submitBtn.addEventListener('mouseleave', () => {
        anime({
          targets: submitBtn.querySelector('i'),
          rotate: [-15, 0],
          scale: [1.3, 1],
          duration: 250,
          easing: 'easeInOutSine',
        });
      });
    }

    /* ── 8. NAV LINKS hover underline animation ── */
    document.querySelectorAll('.pub-nav-links a').forEach(link => {
      link.addEventListener('mouseenter', () => {
        anime({
          targets: link,
          translateY: [0, -2],
          duration: 200,
          easing: 'easeOutSine',
        });
      });
      link.addEventListener('mouseleave', () => {
        anime({
          targets: link,
          translateY: [-2, 0],
          duration: 180,
          easing: 'easeInOutSine',
        });
      });
    });

    /* ── 9. SCROLL TOP BUTTON + RE-ANIMACIÓN AL SUBIR ── */

    /* Función reutilizable: re-animar el hero (funciona desde button Y scroll manual) */
    function animateHeroReturn() {
      const heroBadge = document.querySelector('.pub-hero-badge');
      const heroH1 = document.querySelector('.pub-hero h1');
      const heroP = document.querySelector('.pub-hero-content > p');
      const heroBtns = document.querySelectorAll('.pub-hero-btns .btn-prim, .pub-hero-btns .btn-sec');
      const heroScroll = document.querySelector('.pub-hero-scroll');

      /* Ocultar rápidamente para la re-entrada */
      [heroBadge, heroH1, heroP, heroScroll].forEach(el => {
        if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(25px)'; }
      });
      heroBtns.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; });

      /* Timeline de re-entrada cascada */
      const reTl = anime.timeline({ easing: 'easeOutExpo' });
      if (heroBadge) reTl.add({ targets: heroBadge, translateY: [25, 0], opacity: [0, 1], duration: 550, delay: 80 });
      if (heroH1) reTl.add({ targets: heroH1, translateY: [35, 0], opacity: [0, 1], duration: 650 }, '-=300');
      if (heroP) reTl.add({ targets: heroP, translateY: [20, 0], opacity: [0, 1], duration: 550 }, '-=400');
      if (heroBtns.length) reTl.add({ targets: heroBtns, translateY: [15, 0], opacity: [0, 1], duration: 450, delay: anime.stagger(120) }, '-=300');
      if (heroScroll) reTl.add({ targets: heroScroll, translateY: [10, 0], opacity: [0, 1], duration: 380 }, '-=200');

      /* Bounce suave del nav */
      anime({ targets: '#pubNav', scale: [1, 1.02, 1], duration: 500, easing: 'easeOutBack' });
    }

    /* IntersectionObserver: dispara animateHeroReturn cuando el hero
       VUELVE a aparecer en pantalla (scroll manual o botón) */
    let heroHasLeft = false;
    const heroSection = document.querySelector('.pub-hero');
    if (heroSection) {
      const heroReturnObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            heroHasLeft = true;         // hero salió del viewport
          } else if (heroHasLeft) {
            heroHasLeft = false;        // hero regresó → re-animar
            animateHeroReturn();
          }
        });
      }, { threshold: 0.35 });
      heroReturnObs.observe(heroSection);
    }

    /* Botón scroll-top: mostrar/ocultar + lanzamiento */
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
      let isNearBottom = false;
      let isLaunching = false;

      /* Asegurar pointer-events correcto desde el inicio */
      scrollBtn.style.pointerEvents = 'none';

      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrolled / totalHeight;

        /* — Mostrar / ocultar botón — */
        if (scrolled > 400 && !scrollBtn._animeVisible && !isLaunching) {
          scrollBtn._animeVisible = true;
          scrollBtn.style.pointerEvents = 'auto';
          anime({ targets: scrollBtn, scale: [0.4, 1], opacity: [0, 1], duration: 400, easing: 'easeOutBack' });
        } else if (scrolled <= 400 && scrollBtn._animeVisible && !isLaunching) {
          scrollBtn._animeVisible = false;
          anime({
            targets: scrollBtn, scale: [1, 0.4], opacity: [1, 0], duration: 250, easing: 'easeInSine',
            complete: () => { scrollBtn.style.pointerEvents = 'none'; }
          });
        }

        /* — Al llegar al fondo (>85%) — llamada de atención — */
        if (progress > 0.85 && !isNearBottom) {
          isNearBottom = true;

          anime({ targets: scrollBtn, scale: [1, 1.35, 1, 1.2, 1], rotate: [0, -12, 12, -6, 0], duration: 700, easing: 'easeInOutSine' });

          const icon = scrollBtn.querySelector('i');
          if (icon) {
            icon.className = 'fas fa-rocket';
            anime({
              targets: icon, translateY: [4, -4], duration: 600,
              direction: 'alternate', loop: 3, easing: 'easeInOutSine',
              complete: () => { icon.className = 'fas fa-chevron-up'; }
            });
          }

          /* Anillo de pulso */
          const ring = document.createElement('div');
          ring.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;width:46px;height:46px;border-radius:50%;border:2px solid rgba(46,125,50,.7);pointer-events:none;z-index:1499;';
          document.body.appendChild(ring);
          anime({ targets: ring, scale: [1, 2.8], opacity: [1, 0], duration: 800, easing: 'easeOutExpo', complete: () => ring.remove() });

        } else if (progress <= 0.82) {
          isNearBottom = false;
        }
      }, { passive: true });

      /* ── CLICK: animación de lanzamiento ── */
      scrollBtn.addEventListener('click', () => {
        if (isLaunching) return;
        isLaunching = true;

        const icon = scrollBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-rocket';

        /* Botón despega */
        anime({
          targets: scrollBtn,
          translateY: [0, -320],
          scale: [1, 0.15],
          opacity: [1, 0],
          duration: 500,
          easing: 'easeInExpo',
          complete: () => {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.transform = 'translateY(20px) scale(0.4)';
            scrollBtn.style.pointerEvents = 'none';
            scrollBtn._animeVisible = false;
            isLaunching = false;
            if (icon) icon.className = 'fas fa-chevron-up';
          }
        });

        /* Scroll real al tope */
        setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 180);
        /* Nota: animateHeroReturn() la dispara el IntersectionObserver automáticamente */
      });
    }

    /* ── 10. FOOTER — entrada escalonada de columnas ── */
    createScrollAnimator('.pub-footer-grid > div', {
      translateY: [30, 0],
      stagger: 100,
      duration: 550,
    });

  } // end initPublicAnimations


  /* ────────────────────────────────────────────────────────────
     ANIMACIONES DE LOGIN.HTML
  ──────────────────────────────────────────────────────────── */

  function initLoginAnimations() {
    if (!document.querySelector('.login-page')) return; // No es login

    /* ── 1. TRICOLOR BAR login.html ── */
    const tricolor = document.querySelector('.tricolor');
    if (tricolor) {
      tricolor.style.transformOrigin = 'left center';
      tricolor.style.transform = 'scaleX(0)';
      anime({
        targets: tricolor,
        scaleX: [0, 1],
        duration: 900,
        easing: 'easeOutExpo',
      });
    }

    /* ── 2. HERO PANEL — logo + headline + features escalonados ── */
    const loginTimeline = anime.timeline({ easing: 'easeOutExpo' });

    const heroLogoIcon = document.querySelector('.hero-logo-icon');
    const heroLogoText = document.querySelector('.hero-logo-text');
    const heroH1 = document.querySelector('.hero-headline h1');
    const heroP = document.querySelector('.hero-headline p');
    const featItems = document.querySelectorAll('.feat-item');
    const heroFooter = document.querySelector('.hero-footer');

    if (heroLogoIcon) {
      loginTimeline.add({
        targets: heroLogoIcon,
        scale: [0.3, 1],
        opacity: [0, 1],
        rotate: [-15, 0],
        duration: 700,
        delay: 300,
        easing: 'easeOutBack',
      });
    }

    if (heroLogoText) {
      loginTimeline.add({
        targets: heroLogoText,
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 500,
      }, '-=400');
    }

    if (heroH1) {
      loginTimeline.add({
        targets: heroH1,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
      }, '-=200');
    }

    if (heroP) {
      loginTimeline.add({
        targets: heroP,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
      }, '-=350');
    }

    if (featItems.length) {
      loginTimeline.add({
        targets: featItems,
        translateX: [-30, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(90),
      }, '-=200');
    }

    if (heroFooter) {
      loginTimeline.add({
        targets: heroFooter,
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 400,
      }, '-=100');
    }

    /* ── 3. LOGIN CARD — entrada premium ── */
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
      // En lugar de ocultarla de nuevo (lo que causa el parpadeo tipo 'recarga'),
      // simplemente dejamos que la animación CSS 'cardIn' haga su trabajo,
      // o la sobreescribimos suavemente sin delay.
      loginCard.style.animation = 'none'; // Quitar la CSS
      
      anime({
        targets: loginCard,
        translateY: [24, 0],
        scale: [0.98, 1],
        opacity: [0, 1],
        duration: 550,
        easing: 'easeOutCubic'
      });
    }

    /* ── 4. Card Header — avatar y texto ── */
    const cardAvatar = document.querySelector('.card-avatar');
    const cardH2 = document.querySelector('.card-header-login h2');
    const cardP = document.querySelector('.card-header-login p');

    if (cardAvatar) {
      anime({
        targets: cardAvatar,
        scale: [0.5, 1],
        rotate: [-10, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 150,
        easing: 'easeOutBack',
      });
    }

    if (cardH2) {
      anime({
        targets: cardH2,
        translateY: [15, 0],
        opacity: [0, 1],
        duration: 450,
        delay: 200,
        easing: 'easeOutExpo',
      });
    }

    if (cardP) {
      anime({
        targets: cardP,
        translateY: [10, 0],
        opacity: [0, 1],
        duration: 400,
        delay: 260,
        easing: 'easeOutExpo',
      });
    }

    /* ── 5. Form inputs — entrada escalonada ── */
    const formGroups = document.querySelectorAll('.lg-group, .form-extras, .btn-login, .or-sep, .demo-roles, .card-foot');
    if (formGroups.length) {
      anime({
        targets: formGroups,
        translateY: [15, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(70, { start: 300 }),
        easing: 'easeOutSine',
      });
    }

    /* ── 6. LOGO ICON — pulse suave en loop ── */
    setTimeout(() => {
      const logoIcon = document.querySelector('.hero-logo-icon');
      if (logoIcon) {
        anime({
          targets: logoIcon,
          scale: [1, 1.08, 1],
          boxShadow: [
            '0 8px 24px rgba(67,160,71,.4)',
            '0 12px 36px rgba(67,160,71,.7)',
            '0 8px 24px rgba(67,160,71,.4)'
          ],
          duration: 2200,
          loop: true,
          easing: 'easeInOutSine',
          direction: 'alternate',
        });
      }
    }, 1500);

    /* ── 7. CARD AVATAR — pulse de seguridad ── */
    setTimeout(() => {
      const avatar = document.querySelector('.card-avatar');
      if (avatar) {
        anime({
          targets: avatar,
          scale: [1, 1.05, 1],
          duration: 2800,
          loop: true,
          easing: 'easeInOutSine',
        });
      }
    }, 1800);

    /* ── 8. Hover animaciones en feat-items ── */
    document.querySelectorAll('.feat-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        anime({
          targets: item.querySelector('.feat-icon'),
          scale: [1, 1.15],
          rotate: [0, -8],
          duration: 280,
          easing: 'easeOutBack',
        });
      });
      item.addEventListener('mouseleave', () => {
        anime({
          targets: item.querySelector('.feat-icon'),
          scale: [1.15, 1],
          rotate: [-8, 0],
          duration: 250,
          easing: 'easeInOutSine',
        });
      });
    });

    /* ── 9. Btn login hover ── */
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('mouseenter', () => {
        anime({
          targets: loginBtn,
          scale: [1, 1.02],
          duration: 200,
          easing: 'easeOutSine',
        });
      });
      loginBtn.addEventListener('mouseleave', () => {
        anime({
          targets: loginBtn,
          scale: [1.02, 1],
          duration: 180,
          easing: 'easeInOutSine',
        });
      });
    }

    /* ── 10. Demo buttons hover ── */
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        anime({
          targets: btn.querySelector('i'),
          rotate: [0, 15],
          scale: [1, 1.2],
          duration: 250,
          easing: 'easeOutBack',
        });
      });
      btn.addEventListener('mouseleave', () => {
        anime({
          targets: btn.querySelector('i'),
          rotate: [15, 0],
          scale: [1.2, 1],
          duration: 200,
          easing: 'easeInOutSine',
        });
      });
    });

  } // end initLoginAnimations


  /* ── Inicializar según la página detectada ── */
  ready(function () {
    initPublicAnimations();
    initLoginAnimations();
  });

})();

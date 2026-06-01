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

})();

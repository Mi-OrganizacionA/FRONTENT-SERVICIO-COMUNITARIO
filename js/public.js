/* ============================================================
   SICAG — Portal Público JavaScript
   ============================================================ */
(function(){
'use strict';

/* ── NAV SCROLL ── */
const nav = document.getElementById('pubNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
  document.getElementById('scrollTopBtn').classList.toggle('show', window.scrollY > 400);
}, {passive:true});

/* ── HAMBURGER ── */
const burger = document.getElementById('pubBurger');
const navLinks = document.getElementById('pubNavLinks');
const navCtas = document.getElementById('pubNavCtas');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('mobile-open');
  navCtas.classList.toggle('mobile-open');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  navLinks.classList.remove('mobile-open');
  navCtas.classList.remove('mobile-open');
}));

/* ── PARALLAX HERO ── */
const heroBg = document.querySelector('.pub-hero-bg');
window.addEventListener('scroll', () => {
  if(heroBg) heroBg.style.transform = `scale(1.08) translateY(${window.scrollY * 0.25}px)`;
}, {passive:true});

/* ── SCROLL TO TOP ── */
document.getElementById('scrollTopBtn').addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

/* ── FADE-UP OBSERVER ── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

/* ── COUNTER ANIMATION ── */
function animCount(el, target, suffix='') {
  let cur = 0, step = Math.ceil(target / 60);
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur.toLocaleString('es-VE') + suffix;
    if(cur >= target) clearInterval(t);
  }, 28);
}
const statsIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting) {
      statsIO.unobserve(e.target);
      document.querySelectorAll('[data-count]').forEach(el => {
        animCount(el, parseInt(el.dataset.count), el.dataset.suffix || '');
      });
    }
  });
}, {threshold:0.5});
const statsEl = document.querySelector('.pub-stats');
if(statsEl) statsIO.observe(statsEl);


/* ── CAROUSEL CARTELERA ── */
const track = document.getElementById('carouselTrack');
const dots = document.querySelectorAll('.pub-dot');
let currentSlide = 0;
let slideInterval;
const visibleCards = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;

function goToSlide(n) {
  const cards = track ? track.querySelectorAll('.pub-news-card') : [];
  const max = Math.max(0, cards.length - visibleCards());
  currentSlide = Math.max(0, Math.min(n, max));
  const cardW = cards[0] ? cards[0].offsetWidth + 24 : 0;
  if(track) track.style.transform = `translateX(-${currentSlide * cardW}px)`;
  dots.forEach((d,i) => d.classList.toggle('active', i === currentSlide));
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

/* ── CONTACT FORM ── */
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', function(e) {
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

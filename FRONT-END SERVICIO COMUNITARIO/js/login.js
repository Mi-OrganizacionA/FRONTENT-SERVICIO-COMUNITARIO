0/* ============================================================
   SICAG v3.0 — Login JavaScript
   Archivo: js/login.js
   ============================================================ */

'use strict';

// ============================================================
// DATOS SIMULADOS — Usuarios del sistema
// ============================================================
const USUARIOS_DEMO = {
  'admin': { pass: 'admin123', rol: 'Administrador', redirect: 'dashboard.html' },
  'v-admin': { pass: 'admin123', rol: 'Administrador', redirect: 'dashboard.html' },
  'vocero': { pass: 'vocero123', rol: 'Vocero', redirect: 'dashboard.html' }
};

// ============================================================
// PARTÍCULAS DECORATIVAS DE FONDO
// ============================================================
(function crearParticulas() {
  const container = document.getElementById('particles');
  if (!container) return;
  const colores = ['#4CAF50', '#FFD700', '#D2691E', '#228B22', '#FF8C00'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 80 + 20;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      background:${colores[Math.floor(Math.random() * colores.length)]};
      animation-duration:${Math.random() * 20 + 15}s;
      animation-delay:${Math.random() * 15}s;
    `;
    container.appendChild(p);
  }
})();

// ============================================================
// TOGGLE CONTRASEÑA VISIBLE/OCULTA
// ============================================================
const togglePassBtn = document.getElementById('togglePass');
const loginPassInput = document.getElementById('loginPass');
const togglePassIcon = document.getElementById('togglePassIcon');

if (togglePassBtn) {
  togglePassBtn.addEventListener('click', () => {
    const visible = loginPassInput.type === 'text';
    loginPassInput.type = visible ? 'password' : 'text';
    togglePassIcon.className = visible ? 'fas fa-eye' : 'fas fa-eye-slash';
  });
}

// ============================================================
// ACCESO RÁPIDO DE DEMOSTRACIÓN
// ============================================================
function fillDemo(user, pass) {
  document.getElementById('loginUser').value = user;
  document.getElementById('loginPass').value = pass;
  document.getElementById('loginAlert').classList.remove('show');
}

// Exponer globalmente para los onclick del HTML
window.fillDemo = fillDemo;

// ============================================================
// OCULTAR ALERTA AL ESCRIBIR
// ============================================================
['loginUser', 'loginPass'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => {
    document.getElementById('loginAlert').classList.remove('show');
  });
});

// ============================================================
// SUBMIT DEL FORMULARIO
// ============================================================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const userInput = document.getElementById('loginUser').value.trim().toLowerCase();
    const passInput = document.getElementById('loginPass').value.trim();
    const btn = document.getElementById('loginBtn');
    const alertBox = document.getElementById('loginAlert');
    const alertMsg = document.getElementById('loginAlertMsg');

    // --- Validar campos vacíos ---
    if (!userInput || !passInput) {
      alertMsg.textContent = 'Por favor, completa todos los campos.';
      alertBox.classList.add('show');
      return;
    }

    // --- Simular carga ---
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>VERIFICANDO...';
    btn.disabled = true;

    setTimeout(() => {
      const usuario = USUARIOS_DEMO[userInput];

      if (usuario && usuario.pass === passInput) {
        // ✅ Credenciales correctas — guardar sesión simulada
        sessionStorage.setItem('sicag_user', userInput);
        sessionStorage.setItem('sicag_rol', usuario.rol);

        btn.innerHTML = '<i class="fas fa-check me-2"></i>¡BIENVENIDO!';
        btn.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32)';

        setTimeout(() => {
          window.location.href = usuario.redirect;
        }, 900);

      } else {
        // ❌ Credenciales incorrectas
        alertMsg.textContent = 'Credenciales incorrectas. Verifique su cédula y contraseña.';
        alertBox.classList.add('show');
        btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>ENTRAR AL SISTEMA';
        btn.disabled = false;
        btn.style.background = '';

        // Efecto shake en la tarjeta de login
        const panel = document.querySelector('.login-card');
        if (panel) {
          panel.style.animation = 'shake 0.4s ease';
          setTimeout(() => { panel.style.animation = ''; }, 400);
        }
      }
    }, 1400);
  });
}

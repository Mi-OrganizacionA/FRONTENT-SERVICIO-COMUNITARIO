/* ============================================================
   SICAG v5.0 — Login Refactorizado (Usa AuthManager)
   Archivo: js/login.js
   ============================================================ */

'use strict';

class LoginController {
  constructor() {
    this.loginForm = document.getElementById('loginForm');
    this.userInput = document.getElementById('loginUser');
    this.passInput = document.getElementById('loginPass');
    this.submitBtn = document.getElementById('loginBtn');
    this.alertBox = document.getElementById('loginAlert');
    this.alertMsg = document.getElementById('loginAlertMsg');

    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    this._setupUI();
  }

  _setupUI() {
    // Toggle Password Visibility
    const toggleBtn = document.getElementById('togglePass');
    const toggleIcon = document.getElementById('togglePassIcon');
    if (toggleBtn && this.passInput) {
      toggleBtn.addEventListener('click', () => {
        const isText = this.passInput.type === 'text';
        this.passInput.type = isText ? 'password' : 'text';
        toggleIcon.className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
      });
    }

    // Hide alerts on typing
    [this.userInput, this.passInput].forEach(el => {
      if (el) el.addEventListener('input', () => this.ocultarError());
    });

    // Partículas de fondo
    this._crearParticulas();
  }

  async handleSubmit(e) {
    e.preventDefault();
    const usuario = this.userInput.value.trim().toLowerCase();
    const password = this.passInput.value.trim();

    if (!usuario || !password) {
      this.mostrarError('Por favor, completa todos los campos.');
      return;
    }

    try {
      this.setLoading(true);
      
      // Llamada al AuthManager centralizado
      const userData = await window.auth.login(usuario, password);
      
      this.mostrarExito('¡BIENVENIDO!');

      // Redirección centralizada
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 900);

    } catch (error) {
      this.mostrarError(error.message);
      this.setLoading(false);
      this._shakeCard();
    }
  }

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isLoading;
    if (isLoading) {
      this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>VERIFICANDO...';
    } else {
      this.submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>ENTRAR AL SISTEMA';
      this.submitBtn.style.background = '';
    }
  }

  mostrarExito(mensaje) {
    if (!this.submitBtn) return;
    this.submitBtn.innerHTML = `<i class="fas fa-check me-2"></i>${mensaje}`;
    this.submitBtn.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32)';
  }

  mostrarError(mensaje) {
    if (!this.alertBox || !this.alertMsg) return;
    this.alertMsg.textContent = mensaje;
    this.alertBox.classList.add('show');
  }

  ocultarError() {
    if (this.alertBox) this.alertBox.classList.remove('show');
  }

  _shakeCard() {
    const panel = document.querySelector('.login-card');
    if (panel) {
      panel.style.animation = 'shake 0.4s ease';
      setTimeout(() => { panel.style.animation = ''; }, 400);
    }
  }

  _crearParticulas() {
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
  }
}

// Inicializar asegurando que el DOM esté listo o ya cargado
function initLogin() {
  if (document.getElementById('loginForm')) {
    window.loginCtrl = new LoginController();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}

// Función global para demo (mantenida por compatibilidad visual)
window.fillDemo = function(user, pass) {
  const userInput = document.getElementById('loginUser');
  const passInput = document.getElementById('loginPass');
  if (userInput && passInput) {
    userInput.value = user;
    passInput.value = pass;
    document.getElementById('loginAlert')?.classList.remove('show');
  }
};

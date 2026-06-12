/* ============================================================
   SICAG v2.5 — Login Refactorizado (Usa AuthManager)
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
    this._setupRecoveryModal();
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

  // --- Recuperación de Contraseña ---
  _setupRecoveryModal() {
    const modal = document.getElementById('recoveryModal');
    const btnOpen = document.getElementById('forgotPasswordBtn');
    const btnClose = document.getElementById('closeRecovery');
    
    if (!modal || !btnOpen) return;

    btnOpen.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('show');
      this._goToWizardStep(1);
    });

    btnClose.addEventListener('click', () => {
      modal.classList.remove('show');
      this._resetRecoveryModal();
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        this._resetRecoveryModal();
      }
    });

    const btnRequestCode = document.getElementById('btnRequestCode');
    const btnVerifyCode = document.getElementById('btnVerifyCode');
    const btnResetPassword = document.getElementById('btnResetPassword');
    const btnFinish = document.getElementById('btnFinishRecovery');

    if (btnRequestCode) {
      btnRequestCode.addEventListener('click', async () => {
        const email = document.getElementById('recoveryEmail').value.trim();
        if (!email) return alert('Por favor, ingresa tu correo.');
        
        btnRequestCode.disabled = true;
        btnRequestCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        try {
          const res = await window.api.requestCode(email);
          
          if (res && res.isGeneric) {
            document.getElementById('codeDescText').innerHTML = `Se detectó un correo genérico de prueba.<br><b>${res.message}</b>`;
          } else {
            document.getElementById('codeDescText').innerHTML = `Ingresa el código de 6 dígitos enviado a <b>${email}</b>.`;
          }
          
          this._goToWizardStep(2);
        } catch (error) {
          alert('Error: ' + error.message);
        } finally {
          btnRequestCode.disabled = false;
          btnRequestCode.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Código';
        }
      });
    }

    if (btnVerifyCode) {
      btnVerifyCode.addEventListener('click', () => {
        const code = document.getElementById('recoveryCode').value.trim();
        if (!code || code.length < 6) return alert('Ingresa un código válido de 6 dígitos.');
        // No verificamos al backend hasta enviar la contraseña. Solo pasamos visualmente.
        this._goToWizardStep(3);
      });
    }

    // Password strength indicator
    const newPassInput = document.getElementById('recoveryNewPassword');
    if (newPassInput) {
      newPassInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const fill = document.getElementById('pwFill');
        const hint = document.getElementById('pwHint');
        let strength = 0;
        
        if (val.length > 5) strength += 1;
        if (val.length > 7) strength += 1;
        if (/[A-Z]/.test(val)) strength += 1;
        if (/[0-9]/.test(val)) strength += 1;
        if (/[^A-Za-z0-9]/.test(val)) strength += 1;

        if (val.length === 0) strength = 0;

        const colors = ['#ru', '#C62828', '#F9A825', '#43A047', '#1B5E20', '#1B5E20'];
        const texts = ['', 'Muy débil', 'Débil', 'Buena', 'Fuerte', 'Muy fuerte'];

        fill.style.width = (strength * 20) + '%';
        fill.style.backgroundColor = colors[strength] || '#eee';
        hint.textContent = texts[strength] || 'Nivel de seguridad';
      });
    }

    if (btnResetPassword) {
      btnResetPassword.addEventListener('click', async () => {
        const email = document.getElementById('recoveryEmail').value.trim();
        const code = document.getElementById('recoveryCode').value.trim();
        const newPassword = document.getElementById('recoveryNewPassword').value.trim();
        const confirmPassword = document.getElementById('recoveryConfirmPassword').value.trim();

        if (!newPassword || newPassword !== confirmPassword) {
          return alert('Las contraseñas no coinciden o están vacías.');
        }
        if (newPassword.length < 8) {
          return alert('La contraseña debe tener al menos 8 caracteres.');
        }

        btnResetPassword.disabled = true;
        btnResetPassword.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        try {
          await window.api.resetPassword(email, code, newPassword);
          this._goToWizardStep(4);
        } catch (error) {
          alert('Error: ' + error.message);
        } finally {
          btnResetPassword.disabled = false;
          btnResetPassword.innerHTML = '<i class="fas fa-key"></i> Guardar Nueva Contraseña';
        }
      });
    }

    if (btnFinish) {
      btnFinish.addEventListener('click', () => {
        modal.classList.remove('show');
        this._resetRecoveryModal();
      });
    }
  }

  _goToWizardStep(step) {
    document.getElementById('stepEmail').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('stepCode').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('stepPassword').style.display = step === 3 ? 'block' : 'none';
    document.getElementById('stepSuccess').style.display = step === 4 ? 'block' : 'none';

    const titles = ['', 'Identificación', 'Verificación', 'Nueva Contraseña', 'Completado'];
    const titleEl = document.getElementById('wizTitle');
    if (titleEl) titleEl.textContent = titles[step];

    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById('wiz' + i);
      if (el) {
        if (i < step) {
          el.className = 'wiz-step active';
          el.innerHTML = '<i class="fas fa-check"></i>';
        } else if (i === step) {
          el.className = 'wiz-step active';
          el.innerHTML = i;
        } else {
          el.className = 'wiz-step';
          el.innerHTML = i;
        }
      }
    }
  }

  _resetRecoveryModal() {
    this._goToWizardStep(1);
    document.getElementById('recoveryEmail').value = '';
    document.getElementById('recoveryCode').value = '';
    document.getElementById('recoveryNewPassword').value = '';
    document.getElementById('recoveryConfirmPassword').value = '';
    
    const fill = document.getElementById('pwFill');
    const hint = document.getElementById('pwHint');
    if (fill) { fill.style.width = '0%'; fill.style.backgroundColor = '#eee'; }
    if (hint) hint.textContent = 'Nivel de seguridad';
  }
}

// Inicializar asegurando que el DOM esté listo o ya cargado
function initLogin() {
  if (window.auth && window.auth.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }
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

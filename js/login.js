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
    // Alternar visibilidad de la contraseña
    const toggleBtn = document.getElementById('togglePass');
    const toggleIcon = document.getElementById('togglePassIcon');
    if (toggleBtn && this.passInput) {
      toggleBtn.addEventListener('click', () => {
        const isText = this.passInput.type === 'text';
        this.passInput.type = isText ? 'password' : 'text';
        toggleIcon.className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
      });
    }

    // Ocultar alerta de error al escribir
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
      await window.auth.login(usuario, password);
      this.mostrarExito('¡BIENVENIDO!');
      
      // Verificar si el usuario está usando la app pública instalada
      // y debería instalar la app del sistema para una mejor experiencia
      const esAppPublicaInstalada = window.matchMedia('(display-mode: standalone)').matches
        && !document.querySelector('link[rel="manifest"][href*="sistema"]');

      if (esAppPublicaInstalada) {
        // Mostrar mensaje suave (no bloquear el flujo)
        setTimeout(() => {
          if (window.Components?.showToast) {
            Components.showToast(
              '💡 Para una mejor experiencia offline, instala también la "App del Sistema" desde el dashboard.',
              'info'
            );
          }
        }, 1500); // Mostrar después de la redirección
      }

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

  // ─── Recuperación de Contraseña (Wizard de 4 pasos) ───────────────────────
  _setupRecoveryModal() {
    const modal = document.getElementById('recoveryModal');
    const btnOpen = document.getElementById('forgotPasswordBtn');
    const btnClose = document.getElementById('closeRecovery');

    if (!modal || !btnOpen) return;

    // Abrir modal
    btnOpen.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('show');
      this._resetRecoveryModal();
      this._goToWizardStep(1);
    });

    // Cerrar modal con la X
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        modal.classList.remove('show');
        this._resetRecoveryModal();
      });
    }

    // Cerrar modal al hacer clic en el fondo
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        this._resetRecoveryModal();
      }
    });

    // ── Paso 1: Solicitar el código por correo ────────────────────────────────
    const btnRequestCode = document.getElementById('btnRequestCode');
    if (btnRequestCode) {
      btnRequestCode.addEventListener('click', async () => {
        const email = document.getElementById('recoveryEmail').value.trim();

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
          this._mostrarAlertaModal('Por favor, ingresa un correo electrónico válido.', 'error');
          return;
        }

        btnRequestCode.disabled = true;
        btnRequestCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        this._ocultarAlertaModal();

        try {
          const res = await window.api.requestCode(email);

          if (res && res.isGeneric) {
            // Correo @sicag.com: código de prueba fijo 123456
            document.getElementById('codeDescText').innerHTML = `
              <b>Correo de sistema detectado.</b><br>
              Usa el código de prueba:
              <span style="font-size:1.5rem; font-weight:800; letter-spacing:8px; color:var(--vp); display:block; margin-top:8px;">123456</span>
            `;
          } else {
            // Correo real: código enviado por SMTP
            document.getElementById('codeDescText').innerHTML =
              `Ingresa el código de 6 dígitos enviado a <b>${email}</b>.`;
          }

          this._goToWizardStep(2);
        } catch (error) {
          this._mostrarAlertaModal(error.message || 'No se encontró una cuenta con ese correo.', 'error');
        } finally {
          btnRequestCode.disabled = false;
          btnRequestCode.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Código';
        }
      });
    }

    // ── Paso 2: Verificar el código ───────────────────────────────────────────
    const btnVerifyCode = document.getElementById('btnVerifyCode');
    if (btnVerifyCode) {
      btnVerifyCode.addEventListener('click', async () => {
        const email = document.getElementById('recoveryEmail').value.trim();
        const code = document.getElementById('recoveryCode').value.trim();

        if (!code || code.length < 6) {
          this._mostrarAlertaModal('Ingresa el código completo de 6 dígitos.', 'error');
          return;
        }

        btnVerifyCode.disabled = true;
        btnVerifyCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        this._ocultarAlertaModal();

        try {
          // Intentar verificación previa via endpoint dedicado (si existe)
          const baseURL = (window.api && window.api.baseURL) || 'https://sicag-api.onrender.com/api';
          const resp = await fetch(`${baseURL}/auth/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
          });

          if (resp.ok) {
            // Código correcto confirmado por el backend
            this._goToWizardStep(3);
          } else {
            const errData = await resp.json().catch(() => ({}));
            this._mostrarAlertaModal(errData.error || 'Código incorrecto. Intenta de nuevo.', 'error');
          }
        } catch (_) {
          // Si el endpoint /verify-code no existe (404 de red o error), avanzar igual.
          // El backend validará el código en el paso de reset final.
          this._goToWizardStep(3);
        } finally {
          btnVerifyCode.disabled = false;
          btnVerifyCode.innerHTML = '<i class="fas fa-check-circle"></i> Verificar Código';
        }
      });
    }

    // Indicador de fortaleza de contraseña
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

        const colors = ['#eee', '#C62828', '#F9A825', '#43A047', '#1B5E20', '#1B5E20'];
        const texts = ['Nivel de seguridad', 'Muy débil', 'Débil', 'Buena', 'Fuerte', 'Muy fuerte'];

        if (fill) { fill.style.width = (strength * 20) + '%'; fill.style.backgroundColor = colors[strength] || '#eee'; }
        if (hint) hint.textContent = texts[strength] || 'Nivel de seguridad';
      });
    }

    // ── Paso 3: Guardar la nueva contraseña ───────────────────────────────────
    const btnResetPassword = document.getElementById('btnResetPassword');
    if (btnResetPassword) {
      btnResetPassword.addEventListener('click', async () => {
        const email = document.getElementById('recoveryEmail').value.trim();
        const code = document.getElementById('recoveryCode').value.trim();
        const newPassword = document.getElementById('recoveryNewPassword').value.trim();
        const confirmPassword = document.getElementById('recoveryConfirmPassword').value.trim();

        if (!newPassword || newPassword !== confirmPassword) {
          this._mostrarAlertaModal('Las contraseñas no coinciden o están vacías.', 'error');
          return;
        }
        if (newPassword.length < 8) {
          this._mostrarAlertaModal('La contraseña debe tener al menos 8 caracteres.', 'error');
          return;
        }

        btnResetPassword.disabled = true;
        btnResetPassword.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        this._ocultarAlertaModal();

        try {
          await window.api.resetPassword(email, code, newPassword);
          this._goToWizardStep(4);
        } catch (error) {
          this._mostrarAlertaModal(error.message || 'Error al guardar. Verifica que el código sea correcto.', 'error');
        } finally {
          btnResetPassword.disabled = false;
          btnResetPassword.innerHTML = '<i class="fas fa-key"></i> Guardar Nueva Contraseña';
        }
      });
    }

    // ── Paso 4: Finalizar y cerrar modal ──────────────────────────────────────
    const btnFinish = document.getElementById('btnFinishRecovery');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => {
        modal.classList.remove('show');
        this._resetRecoveryModal();
      });
    }
  }

  /**
   * Muestra una alerta visual dentro del modal (en lugar de alert() nativo).
   * @param {string} mensaje - Texto a mostrar
   * @param {'error'|'success'} tipo - Tipo de alerta
   */
  _mostrarAlertaModal(mensaje, tipo = 'error') {
    let alertEl = document.getElementById('modalRecoveryAlert');
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.id = 'modalRecoveryAlert';
      alertEl.style.cssText = [
        'padding:0.75rem 1rem', 'border-radius:10px', 'font-size:0.82rem',
        "font-family:'Poppins',sans-serif", 'margin-bottom:1rem',
        'display:flex', 'align-items:center', 'gap:0.5rem'
      ].join(';');
      // Insertar debajo del wizard de pasos
      const modalContent = document.querySelector('#recoveryModal .modal-content');
      const wizNav = modalContent ? modalContent.querySelector('div') : null;
      if (wizNav) wizNav.after(alertEl);
    }

    if (tipo === 'error') {
      alertEl.style.background = '#FFF3F3';
      alertEl.style.border = '1px solid #FFCDD2';
      alertEl.style.color = '#C62828';
      alertEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
    } else {
      alertEl.style.background = '#F1F8E9';
      alertEl.style.border = '1px solid #C5E1A5';
      alertEl.style.color = '#2E7D32';
      alertEl.innerHTML = `<i class="fas fa-check-circle"></i> ${mensaje}`;
    }

    alertEl.style.display = 'flex';
  }

  _ocultarAlertaModal() {
    const alertEl = document.getElementById('modalRecoveryAlert');
    if (alertEl) alertEl.style.display = 'none';
  }

  _goToWizardStep(step) {
    document.getElementById('stepEmail').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('stepCode').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('stepPassword').style.display = step === 3 ? 'block' : 'none';
    document.getElementById('stepSuccess').style.display = step === 4 ? 'block' : 'none';

    const titles = ['', 'Identificación', 'Verificación', 'Nueva Contraseña', '¡Completado!'];
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
          el.innerHTML = String(i);
        } else {
          el.className = 'wiz-step';
          el.innerHTML = String(i);
        }
      }
    }

    // Limpiar la alerta al cambiar de paso
    this._ocultarAlertaModal();
  }

  _resetRecoveryModal() {
    const emailEl = document.getElementById('recoveryEmail');
    const codeEl = document.getElementById('recoveryCode');
    const newPassEl = document.getElementById('recoveryNewPassword');
    const confirmEl = document.getElementById('recoveryConfirmPassword');

    if (emailEl) emailEl.value = '';
    if (codeEl) codeEl.value = '';
    if (newPassEl) newPassEl.value = '';
    if (confirmEl) confirmEl.value = '';

    const fill = document.getElementById('pwFill');
    const hint = document.getElementById('pwHint');
    if (fill) { fill.style.width = '0%'; fill.style.backgroundColor = '#eee'; }
    if (hint) hint.textContent = 'Nivel de seguridad';

    this._ocultarAlertaModal();
  }
}

// Inicializar cuando el DOM esté listo
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

// Función global para modo demo (compatibilidad visual)
window.fillDemo = function(user, pass) {
  const userInput = document.getElementById('loginUser');
  const passInput = document.getElementById('loginPass');
  if (userInput && passInput) {
    userInput.value = user;
    passInput.value = pass;
    document.getElementById('loginAlert')?.classList.remove('show');
  }
};

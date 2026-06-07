const AuthService = require('../services/authService');
const EmailService = require('../services/emailService');
let UsuarioModel = null;
const logger = require('../utils/logger');

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });
      const result = await AuthService.login(email, password, UsuarioModel);
      res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ token: result.token, usuario: result.usuario });
    } catch (error) {
      logger.error('Error en login:', error);
      res.status(401).json({ error: error.message || 'Error en autenticación' });
    }
  }

  static async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) return res.status(401).json({ error: 'Refresh token no encontrado' });
      const newToken = await AuthService.refreshToken(refreshToken, UsuarioModel);
      res.json({ token: newToken });
    } catch (error) {
      logger.error('Error en refresh:', error);
      res.status(401).json({ error: 'Refresh token inválido' });
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie('refreshToken');
      res.json({ mensaje: 'Logout exitoso' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPerfil(req, res) {
    try {
      const user = await UsuarioModel.findByPk(req.user.id, { attributes: { exclude: ['contraseña'] } });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async verifyPassword(req, res) {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: 'Contraseña requerida' });
      
      const userId = req.user.id;
      const user = await UsuarioModel.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const isValid = AuthService.validatePassword(password, user.credenciales);
      if (!isValid) return res.status(401).json({ error: 'Contraseña incorrecta' });

      res.json({ success: true, message: 'Contraseña verificada' });
    } catch (error) {
      logger.error('Error verificando contraseña:', error);
      res.status(500).json({ error: 'Error del servidor al verificar contraseña' });
    }
  }

  static async changePassword(req, res) {
    try {
      const { passwordActual, nuevaPassword } = req.body;
      if (!passwordActual || !nuevaPassword) return res.status(400).json({ error: 'Faltan campos de contraseña' });

      const userId = req.user.id;
      const user = await UsuarioModel.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const isValid = AuthService.validatePassword(passwordActual, user.credenciales);
      if (!isValid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

      user.credenciales = AuthService.hashPassword(nuevaPassword);
      await user.save();

      res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      res.status(500).json({ error: 'Error del servidor al cambiar contraseña' });
    }
  }

  // --- Recuperación de Contraseña por Correo ---

  static async requestCode(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Correo requerido' });

      const user = await UsuarioModel.findOne({ where: { email, activo: true } });
      if (!user) return res.status(404).json({ error: 'No existe una cuenta activa con ese correo' });

      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      user.codigo_verificacion = code;
      user.codigo_expiracion = expire;
      await user.save();

      await EmailService.sendVerificationCode(email, code);

      res.json({ success: true, message: 'Código enviado al correo' });
    } catch (error) {
      logger.error('Error solicitando código:', error);
      res.status(500).json({ error: 'Error enviando código de verificación' });
    }
  }

  static async resetPasswordWithCode(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ error: 'Todos los campos son requeridos' });

      const user = await UsuarioModel.findOne({ where: { email, activo: true } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (user.codigo_verificacion !== code) {
        return res.status(400).json({ error: 'Código incorrecto' });
      }

      if (new Date() > new Date(user.codigo_expiracion)) {
        return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
      }

      // Actualizar contraseña
      user.credenciales = AuthService.hashPassword(newPassword);
      user.codigo_verificacion = null;
      user.codigo_expiracion = null;
      await user.save();

      res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      logger.error('Error reseteando contraseña:', error);
      res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
  }

  static setUsuarioModel(model) {
    UsuarioModel = model;
  }
}

module.exports = AuthController;

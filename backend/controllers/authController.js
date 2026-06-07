const AuthService = require('../services/authService');
let UsuarioModel = null;
const logger = require('../utils/logger');

class AuthController {
  static async login(req, res) {
    try {
      const { usuario, contraseña } = req.body;
      if (!usuario || !contraseña) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      const result = await AuthService.login(usuario, contraseña, UsuarioModel);
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
      const { contraseña } = req.body;
      if (!contraseña) return res.status(400).json({ error: 'Contraseña requerida' });
      
      const userId = req.user.id;
      const user = await UsuarioModel.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const isValid = AuthService.validatePassword(contraseña, user.contraseña);
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

      const isValid = AuthService.validatePassword(passwordActual, user.contraseña);
      if (!isValid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

      user.contraseña = AuthService.hashPassword(nuevaPassword);
      await user.save();

      res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      res.status(500).json({ error: 'Error del servidor al cambiar contraseña' });
    }
  }

  static setUsuarioModel(model) {
    UsuarioModel = model;
  }
}

module.exports = AuthController;

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

  static setUsuarioModel(model) {
    UsuarioModel = model;
  }
}

module.exports = AuthController;

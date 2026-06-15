const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const logger = require('../utils/logger');

class AuthService {
  static generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email, rol: user.rol, id_comunidad_asignada: user.id_comunidad_asignada, nombre: user.nombre }, env.jwt.secret, { expiresIn: env.jwt.expire });
  }

  static generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, env.jwt.refresh_secret, { expiresIn: env.jwt.refresh_expire });
  }

  static hashPassword(password) { return bcrypt.hashSync(password, 10); }
  static validatePassword(password, hash) { return bcrypt.compareSync(password, hash); }

  static async login(identifier, password, userModel) {
    const { Op } = require('sequelize');
    const user = await userModel.findOne({ 
      where: { 
        [Op.or]: [
          { email: identifier },
          { telefono: identifier }
        ],
        activo: true 
      } 
    });
    if (!user) throw new Error('Credenciales incorrectas');
    const isValid = this.validatePassword(password, user.credenciales);
    if (!isValid) throw new Error('Credenciales incorrectas');
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    await user.update({ ultimo_login: new Date() });
    logger.info(`✅ Login exitoso: ${identifier}`);
    return { token, refreshToken, usuario: { id: user.id, email: user.email, telefono: user.telefono, cedula: user.cedula, nombre: user.nombre, rol: user.rol, id_comunidad_asignada: user.id_comunidad_asignada } };
  }

  static async refreshToken(refreshToken, userModel) {
    try {
      const decoded = jwt.verify(refreshToken, env.jwt.refresh_secret);
      const user = await userModel.findByPk(decoded.id);
      if (!user || !user.activo) throw new Error('Usuario no válido');
      return this.generateToken(user);
    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }
}

module.exports = AuthService;

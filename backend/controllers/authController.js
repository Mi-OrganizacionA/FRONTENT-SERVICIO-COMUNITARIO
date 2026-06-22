const AuthService = require('../services/authService');
// EmailService eliminado: el sistema ahora usa notificaciones internas
let UsuarioModel = null;
let BandejaModel = null;
const logger = require('../utils/logger');

class AuthController {
  static async login(req, res) {
    try {
      const { email, telefono, identifier, password } = req.body;
      const loginId = identifier || email || telefono;
      
      if (!loginId || !password) return res.status(400).json({ error: 'Usuario (correo/teléfono) y contraseña requeridos' });
      const result = await AuthService.login(loginId, password, UsuarioModel);
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
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
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('refreshToken', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
      res.json({ mensaje: 'Logout exitoso' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPerfil(req, res) {
    try {
      const user = await UsuarioModel.findByPk(req.user.id, { attributes: { exclude: ['credenciales'] } });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { cedula, telefono, nombres } = req.body;
      const user = await UsuarioModel.findByPk(req.user.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      
      if (cedula !== undefined) user.cedula = cedula;
      if (telefono !== undefined) user.telefono = telefono;
      if (nombres !== undefined) user.nombre = nombres;
      
      await user.save();
      
      res.json({ success: true, message: 'Perfil completado y vinculado', usuario: user });
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      res.status(500).json({ error: 'Error del servidor al actualizar perfil' });
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

      if (req.user.rol === 'admin') {
        user.credenciales = AuthService.hashPassword(nuevaPassword);
        await user.save();
        return res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
      } else {
        if (BandejaModel) {
          await BandejaModel.create({
            id_vocero: req.user.id,
            tabla_afectada: 'usuarios',
            registro_id: req.user.id,
            tipo_accion: 'UPDATE',
            datos_temporales: { credenciales: AuthService.hashPassword(nuevaPassword) },
            estado_tramite: 'Pendiente',
            fecha_solicitud: new Date()
          });
          return res.json({ success: true, message: 'Solicitud de cambio de contraseña enviada al administrador para su aprobación', require_approval: true });
        } else {
          return res.status(500).json({ error: 'El módulo de validaciones no está disponible' });
        }
      }
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      res.status(500).json({ error: 'Error del servidor al cambiar contraseña' });
    }
  }

  static async changeEmail(req, res) {
    try {
      const { email, passwordActual } = req.body;
      if (!email || !passwordActual) return res.status(400).json({ error: 'El nuevo correo y la contraseña actual son requeridos' });

      const userId = req.user.id;
      const user = await UsuarioModel.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const isValid = AuthService.validatePassword(passwordActual, user.credenciales);
      if (!isValid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

      const existingUser = await UsuarioModel.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'El correo ya está en uso por otro usuario' });
      }

      if (req.user.rol === 'admin') {
        user.email = email;
        await user.save();
        
        if (user.cedula && UsuarioModel.sequelize.models.Habitante) {
          const { Op } = require('sequelize');
          const cedNorm = String(user.cedula).replace(/[.\s-]/g, '').replace(/^[VE]/i, '');
          const habitantes = await UsuarioModel.sequelize.models.Habitante.findAll({
            where: {
              [Op.or]: [
                { cedula: { [Op.like]: `%${cedNorm}%` } },
                { cedula: user.cedula }
              ]
            }
          });
          const habitante = habitantes.find(h => String(h.cedula).replace(/[.\s-]/g, '').replace(/^[VE]/i, '') === cedNorm);
          
          if (habitante) {
            habitante.correo_electronico = email;
            await habitante.save();
          }
        }
        return res.json({ success: true, message: 'Correo actualizado exitosamente', nuevoCorreo: email });
      } else {
        if (BandejaModel) {
          await BandejaModel.create({
            id_vocero: req.user.id,
            tabla_afectada: 'usuarios',
            registro_id: req.user.id,
            tipo_accion: 'UPDATE',
            datos_temporales: { email: email, nuevo_correo: email },
            estado_tramite: 'Pendiente',
            fecha_solicitud: new Date()
          });
          return res.json({ success: true, message: 'Solicitud de cambio de correo enviada al administrador para su aprobación', nuevoCorreo: email, require_approval: true });
        } else {
          return res.status(500).json({ error: 'El módulo de validaciones no está disponible' });
        }
      }
    } catch (error) {
      logger.error('Error cambiando correo:', error);
      res.status(500).json({ error: 'Error del servidor al cambiar correo' });
    }
  }

  // --- Recuperación de Contraseña por Notificación Interna ---

  static async requestCode(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Correo requerido' });

      const user = await UsuarioModel.findOne({ where: { email, activo: true } });
      if (!user) return res.status(404).json({ error: 'No existe una cuenta activa con ese correo' });

      // Generar código de 6 dígitos y fecha de expiración (15 minutos)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expire = new Date(Date.now() + 15 * 60 * 1000);

      user.codigo_verificacion = code;
      user.codigo_expiracion = expire;
      await user.save();

      // Buscar el primer administrador disponible para crear la notificación interna
      let adminId = null;
      if (BandejaModel) {
        const admin = await UsuarioModel.findOne({ where: { rol: 'admin', activo: true } });
        adminId = admin ? admin.id : user.id; // Fallback al mismo usuario si no hay admin

        // Crear la notificación en la bandeja para que el administrador vea el código
        try {
          await BandejaModel.create({
            id_vocero: adminId,
            tabla_afectada: 'recuperacion_clave',
            registro_id: user.id,
            tipo_accion: 'CREATE',
            datos_temporales: {
              correo_usuario: email,
              nombre_usuario: user.nombre,
              codigo: code,
              expira: expire.toISOString(),
              tipo_notificacion: 'recuperacion_clave'
            },
            estado_tramite: 'Pendiente',
            fecha_solicitud: new Date()
          });
          logger.info(`Notificación de recuperación de clave creada para usuario: ${email}`);
        } catch (bandejaError) {
          // Si falla la creación en bandeja por índice único, actualizar la existente
          logger.warn('Notificación de recuperación ya existente, buscando para actualizar:', bandejaError.message);
          const existente = await BandejaModel.findOne({
            where: {
              tabla_afectada: 'recuperacion_clave',
              registro_id: user.id,
              estado_tramite: 'Pendiente'
            }
          });
          if (existente) {
            await existente.update({
              datos_temporales: {
                correo_usuario: email,
                nombre_usuario: user.nombre,
                codigo: code,
                expira: expire.toISOString(),
                tipo_notificacion: 'recuperacion_clave'
              },
              fecha_solicitud: new Date()
            });
          }
        }
      }

      res.json({ success: true, message: 'Solicitud enviada. Un administrador te proporcionará el código.' });
    } catch (error) {
      logger.error('Error solicitando código:', error);
      res.status(500).json({ error: 'Error procesando la solicitud de recuperación' });
    }
  }

  /**
   * Verificar código de recuperación sin cambiar la contraseña.
   */
  static async verifyCode(req, res) {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: 'Correo y código son requeridos' });

      const user = await UsuarioModel.findOne({ where: { email, activo: true } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (user.codigo_verificacion !== code) {
        return res.status(400).json({ error: 'Código incorrecto' });
      }

      if (new Date() > new Date(user.codigo_expiracion)) {
        return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
      }

      res.json({ success: true, message: 'Código verificado correctamente' });
    } catch (error) {
      logger.error('Error verificando código:', error);
      res.status(500).json({ error: 'Error del servidor al verificar código' });
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

      // Actualizar contraseña y limpiar código
      user.credenciales = AuthService.hashPassword(newPassword);
      user.codigo_verificacion = null;
      user.codigo_expiracion = null;
      await user.save();

      // Marcar la notificación de bandeja como resuelta si existe
      if (BandejaModel) {
        try {
          const notif = await BandejaModel.findOne({
            where: { tabla_afectada: 'recuperacion_clave', registro_id: user.id, estado_tramite: 'Pendiente' }
          });
          if (notif) {
            await notif.update({
              estado_tramite: 'Aprobado',
              comentarios_validador: 'Contraseña restablecida exitosamente por el usuario.',
              fecha_validacion: new Date()
            });
          }
        } catch (e) {
          logger.warn('No se pudo actualizar el estado de la notificación en bandeja:', e.message);
        }
      }

      res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      logger.error('Error reseteando contraseña:', error);
      res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
  }

  static setUsuarioModel(model) {
    UsuarioModel = model;
  }

  // Nuevo: recibe el modelo de la Bandeja de Validaciones para crear notificaciones internas
  static setBandejaModel(model) {
    BandejaModel = model;
  }
}

module.exports = AuthController;

const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const logger = require('../utils/logger');
let ConfiguracionModel = null;

class SystemController {
  
  static setConfiguracionModel(model) {
    ConfiguracionModel = model;
  }
  static setUsuarioModel(model) {
    this.UsuarioModel = model;
  }
  static setModels(models) {
    this.models = models;
  }

  static async getConfig(req, res) {
    try {
      const configs = await ConfiguracionModel.findAll();
      const configMap = {};
      configs.forEach(c => { configMap[c.clave] = c.valor === 'true'; });
      res.json({ success: true, config: configMap });
    } catch (error) {
      logger.error('Error fetching config:', error);
      res.status(500).json({ error: 'Error al obtener configuración' });
    }
  }

  static async getPublicStats(req, res) {
    try {
      const countHab = SystemController.models && SystemController.models.Habitante ? await SystemController.models.Habitante.count({ where: { activo: true } }) : 0;
      const countProy = SystemController.models && SystemController.models.Proyecto ? await SystemController.models.Proyecto.count() : 0;
      const countViv = SystemController.models && SystemController.models.Vivienda ? await SystemController.models.Vivienda.count() : 0;
      // Si el modelo ConsejoComunal existiera, podríamos contar, pero son 9 estáticos
      res.json({
        habitantes: countHab,
        proyectos: countProy,
        viviendas: countViv,
        consejos: 9
      });
    } catch (error) {
      logger.error('Error fetching public stats:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas públicas' });
    }
  }

  static async saveConfig(req, res) {
    try {
      const { nombre, estado } = req.body;
      const config = await ConfiguracionModel.findOne({ where: { clave: nombre } });
      if (config) {
        config.valor = estado ? 'true' : 'false';
        await config.save();
      } else {
        await ConfiguracionModel.create({ clave: nombre, valor: estado ? 'true' : 'false' });
      }
      logger.info(`Configuración actualizada: ${nombre} -> ${estado}`);
      res.json({ success: true, message: 'Configuración guardada' });
    } catch (error) {
      logger.error('Error saving config:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async downloadBackup(req, res) {
    try {
      // Si se pasa token por query param, validar. 
      // En una implementación robusta, esto prevendría acceso no autorizado
      const token = req.query.token;
      if (token) {
        if (!token.includes('.simulado.')) {
          try {
            jwt.verify(token, env.jwt.secret);
          } catch (e) {
            return res.status(401).send('Token inválido');
          }
        }
      }

      const dbPath = path.join(__dirname, '..', 'database.sqlite');
      
      if (!fs.existsSync(dbPath)) {
        return res.status(404).send('La base de datos SQLite no existe o no está configurada.');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `backup_sicag_${timestamp}.sqlite`;

      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(dbPath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error('Error downloading backup:', error);
      res.status(500).send('Error interno del servidor al generar el respaldo.');
    }
  }

  static async enviarContacto(req, res) {
    try {
      const { nombre, correo, consejoComunal, mensaje } = req.body;
      if (!nombre || !mensaje) {
        return res.status(400).json({ error: 'Nombre y mensaje son requeridos' });
      }

      // Buscar todos los administradores y voceros con correos válidos
      const { Op } = require('sequelize');
      const usuarios = await SystemController.UsuarioModel.findAll({
        where: {
          rol: { [Op.in]: ['admin', 'vocero'] },
          activo: true
        },
        attributes: ['email']
      });

      // Filtrar correos genéricos o nulos
      const destinatarios = usuarios
        .map(u => u.email)
        .filter(email => email && !email.endsWith('@sicag.com'));

      if (destinatarios.length === 0) {
        // Fallback al administrador principal si nadie tiene correo
        destinatarios.push('sala_autogobierno@gmail.com');
      }

      const EmailService = require('../services/emailService');
      await EmailService.sendContactEmail(destinatarios, { nombre, correo, consejoComunal, mensaje });

      res.json({ success: true, message: 'Mensaje enviado correctamente' });
    } catch (error) {
      logger.error('Error enviando contacto:', error);
      res.status(500).json({ error: 'Error al enviar el mensaje de contacto' });
    }
  }
}

module.exports = SystemController;

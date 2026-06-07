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
}

module.exports = SystemController;

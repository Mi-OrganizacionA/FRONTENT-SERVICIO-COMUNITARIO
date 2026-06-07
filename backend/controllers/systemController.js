const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const logger = require('../utils/logger');

// Memoria temporal para las configuraciones globales simuladas en backend
const globalConfig = {
  'Censo': true,
  'Aprobación Automática': false
};

class SystemController {
  
  static async saveConfig(req, res) {
    try {
      const { nombre, estado } = req.body;
      
      // Aquí se guardaría en una base de datos o archivo JSON. 
      // Por ahora lo guardamos en memoria.
      globalConfig[nombre] = estado;
      
      logger.info(`Configuración actualizada: ${nombre} -> ${estado}`);
      res.json({ success: true, config: globalConfig });
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
        try {
          jwt.verify(token, env.jwt.secret);
        } catch (e) {
          return res.status(401).send('Token inválido');
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

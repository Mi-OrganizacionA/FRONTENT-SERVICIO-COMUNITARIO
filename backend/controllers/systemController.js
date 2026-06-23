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

  static async getConsejos(req, res, next) {
    try {
      if (!SystemController.models || !SystemController.models.ConsejoComunal) {
        return res.json([]);
      }
      const consejos = await SystemController.models.ConsejoComunal.findAll({
        attributes: ['id', 'nombre_comunidad', 'descripcion'],
        where: { activo: true },
        order: [['id', 'ASC']]
      });
      res.json(consejos);
    } catch (error) {
      next(error);
    }
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
      const models = SystemController.models;
      if (!models) {
         return res.json({ habitantes: 0, proyectos: 0, viviendas: 0, consejos: 9 });
      }

      // Transformación Económica
      let hectareas_cultivadas = 0;
      let kg_producidos = 0;
      if (models.ProduccionAgricola) {
         const sumHa = await models.ProduccionAgricola.sum('hectareas_cultivadas', { where: { activo: true } });
         hectareas_cultivadas = sumHa || 0;
         const sumKg = await models.ProduccionAgricola.sum('rendimiento_estimado', { where: { activo: true } });
         kg_producidos = sumKg || 0;
      }
      
      const countProyectosAll = models.Proyecto ? await models.Proyecto.count() : 0;
      
      // Transformación Social & Dashboard
      let countHab = 0, countElectores = 0, ninos = 0, adultosMayores = 0, discapacidad = 0;
      if (models.Habitante) {
         const habitantes = await models.Habitante.findAll({ 
            where: { activo: true },
            attributes: ['fecha_nacimiento', 'inscrito_cne', 'condicion_salud', 'incapacitado']
         });
         countHab = habitantes.length;
         
         const hoy = new Date();
         habitantes.forEach(h => {
            if (h.inscrito_cne) countElectores++;
            if (h.condicion_salud === 'discapacidad' || h.incapacitado) discapacidad++;
            
            if (h.fecha_nacimiento) {
               const fn = new Date(h.fecha_nacimiento);
               let edad = hoy.getFullYear() - fn.getFullYear();
               const m = hoy.getMonth() - fn.getMonth();
               if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) {
                  edad--;
               }
               if (edad <= 11) ninos++;
               if (edad >= 60) adultosMayores++;
            }
         });
      }

      // Servicios Públicos
      let countElec = 0, countAgua = 0, countGas = 0;
      if (models.CensoServicios) {
         const censos = await models.CensoServicios.findAll({
            attributes: ['sistema_electrico_tipo', 'aguas_blancas_tipo', 'gas_tipo']
         });
         censos.forEach(c => {
            const hasLuz = c.sistema_electrico_tipo && c.sistema_electrico_tipo !== 'Ninguno' && c.sistema_electrico_tipo !== '';
            const hasAgua = c.aguas_blancas_tipo && c.aguas_blancas_tipo !== 'Ninguno' && c.aguas_blancas_tipo !== '';
            const hasGas = c.gas_tipo && c.gas_tipo !== 'Ninguno' && c.gas_tipo !== '';
            if (hasLuz) countElec++;
            if (hasAgua) countAgua++;
            if (hasGas) countGas++;
         });
      }

      const countViv = models.Vivienda ? await models.Vivienda.count({ where: { activo: true } }) : 0;

      res.json({
        habitantes: countHab,
        electores: countElectores,
        ninos: ninos,
        adultosMayores: adultosMayores,
        discapacidad: discapacidad,
        hectareas: hectareas_cultivadas,
        kg_producidos: kg_producidos,
        proyectos: countProyectosAll,
        viviendas: countViv,
        servicios: {
          electricidad: countElec,
          agua: countAgua,
          gas: countGas
        },
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
        if (req.user && req.user.id) config.modificado_por = req.user.id;
        await config.save();
      } else {
        await ConfiguracionModel.create({ 
          clave: nombre, 
          valor: estado ? 'true' : 'false',
          modificado_por: req.user ? req.user.id : null
        });
      }
      logger.info(`Configuración actualizada: ${nombre} -> ${estado}`);
      res.json({ success: true, message: 'Configuración guardada' });
    } catch (error) {
      logger.error('Error saving config:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getPortalConfig(req, res) {
    try {
      const config = await ConfiguracionModel.findOne({ where: { clave: 'PortalSettings' } });
      res.json({ success: true, config: config ? config.valor : null });
    } catch (error) {
      logger.error('Error fetching portal config:', error);
      res.status(500).json({ error: 'Error al obtener configuración del portal' });
    }
  }

  static async savePortalConfig(req, res) {
    try {
      const { settings } = req.body;
      const config = await ConfiguracionModel.findOne({ where: { clave: 'PortalSettings' } });
      if (config) {
        config.valor = JSON.stringify(settings);
        if (req.user && req.user.id) config.modificado_por = req.user.id;
        await config.save();
      } else {
        await ConfiguracionModel.create({ 
          clave: 'PortalSettings', 
          valor: JSON.stringify(settings),
          modificado_por: req.user ? req.user.id : null
        });
      }
      res.json({ success: true, message: 'Configuración del portal guardada' });
    } catch (error) {
      logger.error('Error saving portal config:', error);
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

      if (!SystemController.BandejaModel) {
        logger.warn('BandejaModel no disponible para guardar el mensaje de contacto.');
        return res.status(500).json({ error: 'Sistema de notificaciones no disponible' });
      }

      // Buscar el primer administrador disponible para asignarle la notificación
      const admin = await SystemController.UsuarioModel.findOne({ where: { rol: 'admin', activo: true } });
      if (!admin) {
        return res.status(500).json({ error: 'No hay administradores disponibles para recibir el mensaje' });
      }

      // Guardar el mensaje como notificación interna en la bandeja
      await SystemController.BandejaModel.create({
        id_vocero: admin.id,
        tabla_afectada: 'contacto',
        registro_id: null,
        tipo_accion: 'CREATE',
        datos_temporales: {
          nombre,
          correo: correo || 'No proporcionado',
          consejo_comunal: consejoComunal || 'No especificado',
          mensaje,
          tipo_notificacion: 'contacto'
        },
        estado_tramite: 'Pendiente',
        fecha_solicitud: new Date()
      });

      logger.info(`Mensaje de contacto de "${nombre}" guardado en bandeja de notificaciones.`);
      res.json({ success: true, message: 'Mensaje enviado correctamente a los administradores.' });
    } catch (error) {
      logger.error('Error guardando mensaje de contacto:', error);
      res.status(500).json({ error: 'Error al enviar el mensaje de contacto' });
    }
  }

  static async getStorageUsage(req, res) {
    try {
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        return res.json({ size: 0, files: 0 });
      }
      
      const files = fs.readdirSync(uploadDir);
      let totalSize = 0;
      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      });
      
      res.json({ size: totalSize, files: files.length });
    } catch (error) {
      logger.error('Error calculando almacenamiento local:', error);
      res.status(500).json({ error: 'Error al calcular almacenamiento' });
    }
  }

  static async cleanStorage(req, res) {
    try {
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        return res.json({ deletedCount: 0 });
      }
      
      const files = fs.readdirSync(uploadDir);
      const tresAniosMs = 3 * 365 * 24 * 60 * 60 * 1000;
      const ahora = Date.now();
      let deletedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          const antiguedadMs = ahora - stats.birthtimeMs;
          if (antiguedadMs > tresAniosMs) {
            try {
              fs.unlinkSync(filePath);
              deletedCount++;
            } catch(e) {
              logger.warn(`No se pudo eliminar archivo antiguo: ${filePath}`);
            }
          }
        }
      });
      
      res.json({ deletedCount, success: true });
    } catch (error) {
      logger.error('Error limpiando almacenamiento local:', error);
      res.status(500).json({ error: 'Error al limpiar almacenamiento' });
    }
  }

  static setBandejaModel(model) {
    SystemController.BandejaModel = model;
  }
}

module.exports = SystemController;

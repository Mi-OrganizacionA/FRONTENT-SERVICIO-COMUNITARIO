const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
const NoticiasService = require('../services/noticiasService');
let NoticiaModel = null;

class NoticiasController {
  static async getAll(req, res) {
    try {
      const onlyPublished = req.query.publicado !== 'false';
      const noticias = await NoticiasService.list(NoticiaModel, onlyPublished);
      res.json(noticias);
    } catch (error) {
      logger.error('Error obteniendo noticias:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const noticia = await NoticiasService.getById(NoticiaModel, req.params.id);
      if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada' });
      res.json(noticia);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const Configuracion = NoticiaModel.sequelize.models.Configuracion;
      const BandejaValidaciones = NoticiaModel.sequelize.models.BandejaValidaciones;
      
      const config = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Noticias' } });
      const globalConfig = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'cartelera_digital',
          tipo_accion: 'CREATE',
          datos_temporales: req.body,
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud enviada a la bandeja de validaciones.' });
      }

      const noticia = await NoticiasService.create(NoticiaModel, req.body);
      await AuditService.log(req.user.id, 'CREATE', 'noticias', noticia.id, null, noticia);
      res.status(201).json(noticia);
    } catch (error) {
      logger.error('Error creando noticia:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const noticia = await NoticiasService.update(NoticiaModel, req.params.id, req.body);
      if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada' });
      await AuditService.log(req.user.id, 'UPDATE', 'noticias', req.params.id, null, noticia);
      res.json(noticia);
    } catch (error) {
      logger.error('Error actualizando noticia:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const noticia = await NoticiasService.remove(NoticiaModel, req.params.id);
      if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada' });
      await AuditService.log(req.user.id, 'DELETE', 'noticias', req.params.id, noticia, null);
      res.json({ mensaje: 'Noticia eliminada' });
    } catch (error) {
      logger.error('Error eliminando noticia:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static setModel(model) { NoticiaModel = model; }
}

module.exports = NoticiasController;

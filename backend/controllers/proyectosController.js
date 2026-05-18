const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
const ProyectosService = require('../services/proyectosService');
let ProyectoModel = null;

class ProyectosController {
  static async getAll(req, res) {
    try {
      const filtros = {};
      if (req.query.consejo_id) filtros.consejo_comunal_id = req.query.consejo_id;
      const proyectos = await ProyectosService.list(ProyectoModel, filtros);
      res.json(proyectos);
    } catch (error) {
      logger.error('Error obteniendo proyectos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const proyecto = await ProyectosService.getById(ProyectoModel, req.params.id);
      if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
      res.json(proyecto);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const proyecto = await ProyectosService.create(ProyectoModel, req.body);
      await AuditService.log(req.user.id, 'CREATE', 'proyectos', proyecto.id, null, proyecto);
      res.status(201).json(proyecto);
    } catch (error) {
      logger.error('Error creando proyecto:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const proyecto = await ProyectosService.update(ProyectoModel, req.params.id, req.body);
      if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
      await AuditService.log(req.user.id, 'UPDATE', 'proyectos', req.params.id, null, proyecto);
      res.json(proyecto);
    } catch (error) {
      logger.error('Error actualizando proyecto:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const proyecto = await ProyectosService.remove(ProyectoModel, req.params.id);
      if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
      await AuditService.log(req.user.id, 'DELETE', 'proyectos', req.params.id, proyecto, null);
      res.json({ mensaje: 'Proyecto eliminado' });
    } catch (error) {
      logger.error('Error eliminando proyecto:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static setModel(model) { ProyectoModel = model; }
}

module.exports = ProyectosController;

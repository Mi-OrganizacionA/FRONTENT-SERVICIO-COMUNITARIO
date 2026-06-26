const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
const ProyectosService = require('../services/proyectosService');
let ProyectoModel = null;

class ProyectosController {
  static async getPublicos(req, res) {
    try {
      const { Op } = require('sequelize');
      // Solo mostrar proyectos que NO estén rechazados en el portal público
      const proyectos = await ProyectoModel.findAll({
        where: {
          estado: { [Op.notIn]: ['rechazado'] },
        },
        order: [['fecha_creacion', 'DESC']],
      });
      res.json(proyectos);
    } catch (error) {
      logger.error('Error obteniendo proyectos publicos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const filtros = {};
      // El campo real en la tabla proyectos es id_comunidad (no consejo_comunal_id)
      if (req.query.consejo_id) filtros.id_comunidad = parseInt(req.query.consejo_id);
      // Si es vocero, forzar filtro a su comunidad asignada (aislamiento de datos)
      if (req.user?.rol === 'vocero' && req.user.id_comunidad_asignada) {
        filtros.id_comunidad = req.user.id_comunidad_asignada;
      }
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
      const Configuracion = ProyectoModel.sequelize.models.Configuracion;
      const BandejaValidaciones = ProyectoModel.sequelize.models.BandejaValidaciones;
      
      const config = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Proyectos' } });
      const globalConfig = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'proyectos',
          tipo_accion: 'CREATE',
          datos_temporales: req.body,
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud enviada a la bandeja de validaciones.' });
      }

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

const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
const ProduccionAgricolaService = require('../services/produccionAgricolaService');
let ProduccionAgricolaModel = null;
let dbModels = null;

class ProduccionAgricolaController {
  static setModel(model) {
    ProduccionAgricolaModel = model;
  }
  static setModels(models) {
    dbModels = models;
  }

  // Obtener todas las producciones (con filtros opcionales)
  static async getAll(req, res) {
    try {
      const { consejo_comunal_id, id_habitante, tipo_cultivo } = req.query;
      
      const where = { activo: true };
      if (id_habitante) where.id_habitante = id_habitante;
      if (tipo_cultivo) where.tipo_cultivo = tipo_cultivo;

      // Si es vocero, filtrar solo producciones de su consejo comunal (aislamiento de datos)
      if (req.user?.rol === 'vocero' && req.user.id_comunidad_asignada) {
        where.consejo_comunal_id = req.user.id_comunidad_asignada;
      } else if (consejo_comunal_id) {
        where.consejo_comunal_id = consejo_comunal_id;
      }

      const producciones = await ProduccionAgricolaModel.findAll({
        where,
        order: [['fecha_registro', 'DESC']],
        limit: 100
      });

      res.json(producciones);
    } catch (error) {
      logger.error('Error obteniendo producciones:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener producción por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const produccion = await ProduccionAgricolaModel.findByPk(id);
      
      if (!produccion) {
        return res.status(404).json({ error: 'Producción no encontrada' });
      }

      res.json(produccion);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener producciones por habitante
  static async getPorHabitante(req, res) {
    try {
      const { habitanteId } = req.params;
      const producciones = await ProduccionAgricolaService.getPorHabitante(
        ProduccionAgricolaModel,
        habitanteId
      );
      res.json(producciones);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener resumen de producción por habitante
  static async getResumenPorHabitante(req, res) {
    try {
      const { habitanteId } = req.params;
      const resumen = await ProduccionAgricolaService.getResumenPorHabitante(
        ProduccionAgricolaModel,
        habitanteId
      );
      res.json(resumen);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener producciones por tipo de cultivo
  static async getPorTipoCultivo(req, res) {
    try {
      const { tipoCultivo } = req.params;
      const producciones = await ProduccionAgricolaService.getPorTipoCultivo(
        ProduccionAgricolaModel,
        tipoCultivo
      );
      res.json(producciones);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener estadísticas por consejo
  static async getEstadisticasPorConsejo(req, res) {
    try {
      const { consejoId } = req.params;
      
      // Utiliza dbModels inyectado
      const { Habitante } = dbModels;
      
      const estadisticas = await ProduccionAgricolaService.getEstadisticasPorConsejo(
        ProduccionAgricolaModel,
        Habitante,
        consejoId
      );
      
      res.json(estadisticas);
    } catch (error) {
      logger.error('Error getting estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Crear nueva producción
  static async crear(req, res) {
    try {
      const produccion = await ProduccionAgricolaService.crear(
        ProduccionAgricolaModel,
        {
          ...req.body,
          activo: true,
          fecha_registro: new Date()
        }
      );

      await AuditService.log(
        req.user?.id,
        'CREATE',
        'produccion_agricola',
        produccion.id,
        null,
        produccion.toJSON()
      );

      res.status(201).json({
        mensaje: 'Producción creada exitosamente',
        produccion
      });
    } catch (error) {
      logger.error('Error creando producción:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Actualizar producción
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      
      const produccionAntiguos = await ProduccionAgricolaModel.findByPk(id);
      if (!produccionAntiguos) {
        return res.status(404).json({ error: 'Producción no encontrada' });
      }

      const produccion = await ProduccionAgricolaService.actualizar(
        ProduccionAgricolaModel,
        id,
        req.body
      );

      await AuditService.log(
        req.user?.id,
        'UPDATE',
        'produccion_agricola',
        id,
        produccionAntiguos.toJSON(),
        produccion.toJSON()
      );

      res.json({
        mensaje: 'Producción actualizada',
        produccion
      });
    } catch (error) {
      logger.error('Error actualizando producción:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Eliminar producción (soft delete)
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const produccion = await ProduccionAgricolaModel.findByPk(id);
      if (!produccion) {
        return res.status(404).json({ error: 'Producción no encontrada' });
      }

      const produccionEliminada = await ProduccionAgricolaService.eliminar(
        ProduccionAgricolaModel,
        id
      );

      await AuditService.log(
        req.user?.id,
        'DELETE',
        'produccion_agricola',
        id,
        produccion.toJSON(),
        null
      );

      res.json({ mensaje: 'Producción eliminada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProduccionAgricolaController;

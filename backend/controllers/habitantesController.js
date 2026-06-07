const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
const HabitantesService = require('../services/habitantesService');
let HabitanteModel = null;

class HabitantesController {
  static setModel(model) {
    HabitanteModel = model;
  }

  /**
   * Obtener todos los habitantes con filtros
   */
  static async getAll(req, res) {
    try {
      const { consejo_id, condicion_salud, elector, nombre, page = 1, limit = 50 } = req.query;
      
      let where = { activo: true };
      
      // Restricción de acceso para voceros
      if (req.user?.rol === 'vocero') {
        where.id_comunidad = req.user.id_comunidad_asignada;
      } else if (consejo_id) {
        where.id_comunidad = consejo_id;
      }
      
      if (condicion_salud) where.condicion_salud = condicion_salud;
      if (nombre) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { nombre: { [Op.iLike]: `%${nombre}%` } },
          { apellido: { [Op.iLike]: `%${nombre}%` } },
          { cedula: nombre }
        ];
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const { count, rows } = await HabitanteModel.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['nombre', 'ASC']]
      });

      // Enriquecer con campos calculados
      const habitantes = rows.map(h => HabitantesService.enriquecerHabitante(h));

      res.json({
        total: count,
        habitantes,
        pagina: parseInt(page),
        porPagina: parseInt(limit)
      });
    } catch (error) {
      logger.error('Error obteniendo habitantes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener habitantes de un consejo
   */
  static async getPorConsejo(req, res) {
    try {
      const { consejoId } = req.params;
      const habitantes = await HabitantesService.getPorConsejo(HabitanteModel, consejoId);
      res.json(habitantes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener electores de un consejo
   */
  static async getElectores(req, res) {
    try {
      const { consejoId } = req.params;
      const electores = await HabitantesService.getElectoresPorConsejo(HabitanteModel, consejoId);
      res.json({
        total: electores.length,
        electores
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener menores de un consejo
   */
  static async getMenores(req, res) {
    try {
      const { consejoId } = req.params;
      const menores = await HabitantesService.getMenoresPorConsejo(HabitanteModel, consejoId);
      res.json({
        total: menores.length,
        menores
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener estadísticas demográficas
   */
  static async getEstadisticas(req, res) {
    try {
      const { consejoId } = req.params;
      const estadisticas = await HabitantesService.getEstadisticasPorConsejo(HabitanteModel, consejoId);
      res.json(estadisticas);
    } catch (error) {
      logger.error('Error getting estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Buscar habitantes
   */
  static async buscar(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Ingrese al menos 2 caracteres para buscar' });
      }
      
      const resultados = await HabitantesService.buscar(HabitanteModel, q);
      res.json(resultados);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener habitante por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const habitante = await HabitantesService.getById(HabitanteModel, id);
      if (!habitante) return res.status(404).json({ error: 'Habitante no encontrado' });
      res.json(habitante);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Crear habitante
   */
  static async create(req, res) {
    try {
      const { cedula, nombre, apellido, id_comunidad, ...data } = req.body;
      
      // Verificar que cédula sea única
      const existe = await HabitanteModel.findOne({ where: { cedula } });
      if (existe) return res.status(409).json({ error: 'Cédula ya registrada' });

      const habitante = await HabitantesService.crear(HabitanteModel, {
        cedula,
        nombre,
        apellido,
        id_comunidad,
        ...data,
        activo: true,
        fecha_creacion: new Date()
      });

      await AuditService.log(req.user?.id, 'CREATE', 'habitantes', habitante.id, null, habitante);
      
      res.status(201).json({
        mensaje: 'Habitante registrado exitosamente',
        habitante
      });
    } catch (error) {
      logger.error('Error creando habitante:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Actualizar habitante
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const habitanteAntiguos = await HabitanteModel.findByPk(id);
      if (!habitanteAntiguos) return res.status(404).json({ error: 'Habitante no encontrado' });

      const habitante = await HabitantesService.update(HabitanteModel, id, req.body);

      await AuditService.log(req.user?.id, 'UPDATE', 'habitantes', id, habitanteAntiguos.toJSON(), habitante);

      res.json({
        mensaje: 'Habitante actualizado',
        habitante
      });
    } catch (error) {
      logger.error('Error actualizando habitante:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Eliminar habitante (soft delete)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const habitante = await HabitanteModel.findByPk(id);
      if (!habitante) return res.status(404).json({ error: 'Habitante no encontrado' });

      const habitanteEliminado = await HabitantesService.remove(HabitanteModel, id);

      await AuditService.log(req.user?.id, 'DELETE', 'habitantes', id, habitante.toJSON(), null);

      res.json({ mensaje: 'Habitante eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Endpoint público para búsqueda de habitantes (información limitada)
   */
  static async getPublico(req, res) {
    try {
      const { consejo_id } = req.params;
      if (isNaN(consejo_id)) return res.status(400).json({ error: 'consejo_id inválido' });
      const { cedula, nombre } = req.query;
      
      let where = { activo: true, id_comunidad: consejo_id };
      if (cedula) where.cedula = cedula;
      if (nombre) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { nombre: { [Op.iLike]: `%${nombre}%` } }
        ];
      }

      const habitantes = await HabitanteModel.findAll({
        where,
        attributes: {
          exclude: ['direccion', 'email', 'telefono', 'foto_cedula_url', 'numero_hijos', 'estado_civil']
        },
        limit: 20,
        order: [['nombre', 'ASC']]
      });

      // Enriquecer con edad y estado electoral
      const habitantesEnriquecidos = habitantes.map(h => HabitantesService.enriquecerHabitante(h));

      res.json(habitantesEnriquecidos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = HabitantesController;

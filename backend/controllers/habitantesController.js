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
        where.consejo_comunal_id = req.user.id_comunidad_asignada;
      } else if (consejo_id) {
        where.consejo_comunal_id = consejo_id;
      }
      
      if (condicion_salud) where.condicion_salud = condicion_salud;
      if (nombre) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { nombres: { [Op.iLike]: `%${nombre}%` } },
          { apellidos: { [Op.iLike]: `%${nombre}%` } },
          { cedula: nombre }
        ];
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const ConsejoComunal = HabitanteModel.sequelize?.models?.ConsejoComunal;
      const { count, rows } = await HabitanteModel.findAndCountAll({
        where,
        include: ConsejoComunal ? [{
          model: ConsejoComunal,
          as: 'consejo',
          attributes: ['id', 'nombre_comunidad']
        }] : [],
        limit: parseInt(limit),
        offset,
        order: [['nombres', 'ASC']]
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
      const { cedula, nombres, apellidos, consejo_comunal_id, ...data } = req.body;
      
      // Verificar que cédula sea única
      const existe = await HabitanteModel.findOne({ where: { cedula } });
      if (existe) return res.status(409).json({ error: 'Cédula ya registrada' });

      // Lógica de Aprobación Automática
      const Configuracion = HabitanteModel.sequelize.models.Configuracion;
      const BandejaValidaciones = HabitanteModel.sequelize.models.BandejaValidaciones;
      
      const config = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Habitantes' } });
      const globalConfig = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'habitantes',
          tipo_accion: 'CREATE',
          datos_temporales: req.body,
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud de registro enviada a la bandeja de validaciones del administrador.' });
      }

      const habitante = await HabitantesService.crear(HabitanteModel, {
        cedula,
        nombres,
        apellidos,
        consejo_comunal_id,
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
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          error: 'Cédula ya registrada',
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      }
      if (error.name === 'SequelizeValidationError') {
        return res.status(422).json({
          error: 'Datos inválidos',
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      }
      res.status(500).json({ error: 'Error interno creando habitante' });
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

      if (req.body.cedula && req.body.cedula !== habitanteAntiguos.cedula) {
        const { Op } = require('sequelize');
        const existe = await HabitanteModel.findOne({
          where: {
            cedula: req.body.cedula,
            id: { [Op.ne]: id }
          }
        });
        if (existe) {
          return res.status(409).json({
            error: 'Cédula ya registrada',
            details: [{ field: 'cedula', message: 'La cédula ya se encuentra en uso' }]
          });
        }
      }

      // Lógica de Aprobación Automática
      const Configuracion = HabitanteModel.sequelize.models.Configuracion;
      const BandejaValidaciones = HabitanteModel.sequelize.models.BandejaValidaciones;
      
      const config = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Habitantes' } });
      const globalConfig = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'habitantes',
          registro_id: id,
          tipo_accion: 'UPDATE',
          datos_temporales: req.body,
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud de actualización enviada a la bandeja de validaciones del administrador.' });
      }

      const habitante = await HabitantesService.update(HabitanteModel, id, req.body);

      await AuditService.log(req.user?.id, 'UPDATE', 'habitantes', id, habitanteAntiguos.toJSON(), habitante);

      res.json({
        mensaje: 'Habitante actualizado',
        habitante
      });
    } catch (error) {
      logger.error('Error actualizando habitante:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          error: 'Cédula ya registrada',
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      }
      if (error.name === 'SequelizeValidationError') {
        return res.status(422).json({
          error: 'Datos inválidos',
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      }
      res.status(500).json({ error: 'Error interno actualizando habitante' });
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

      // Lógica de Aprobación Automática
      const Configuracion = HabitanteModel.sequelize.models.Configuracion;
      const BandejaValidaciones = HabitanteModel.sequelize.models.BandejaValidaciones;
      
      const config = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Habitantes' } });
      const globalConfig = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'habitantes',
          registro_id: id,
          tipo_accion: 'DELETE',
          datos_temporales: {},
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud de eliminación enviada a la bandeja de validaciones del administrador.' });
      }

      const habitanteEliminado = await HabitantesService.remove(HabitanteModel, id);

      await AuditService.log(req.user?.id, 'DELETE', 'habitantes', id, habitante.toJSON(), null);

      res.json({ mensaje: 'Habitante eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Búsqueda pública de habitantes (portal web, sin autenticación)
   */
  static async buscarPublico(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      const resultados = await HabitantesService.buscar(HabitanteModel, q.trim());
      const publicos = resultados.map(h => ({
        id: h.id,
        cedula: h.cedula,
        nombres: h.nombres,
        apellidos: h.apellidos,
        edad: h.edad,
        genero: h.genero,
        elector: h.elector,
        consejo: h.consejo || null
      }));

      res.json(publicos);
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
      
      let where = { activo: true, consejo_comunal_id: consejo_id };
      if (cedula) where.cedula = cedula;
      if (nombre) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { nombres: { [Op.iLike]: `%${nombre}%` } },
          { apellidos: { [Op.iLike]: `%${nombre}%` } }
        ];
      }

      const habitantes = await HabitanteModel.findAll({
        where,
        attributes: {
          exclude: ['direccion', 'email', 'telefono', 'fotografia_cedula_url']
        },
        limit: 20,
        order: [['nombres', 'ASC']]
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

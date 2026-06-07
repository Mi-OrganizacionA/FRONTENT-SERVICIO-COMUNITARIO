const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
let BandejaModel = null;

class BandejaValidacionesController {
  static setModel(model) {
    BandejaModel = model;
  }

  // Obtener todas las validaciones pendientes (para admin)
  static async getPendientes(req, res) {
    try {
      const validaciones = await BandejaModel.findAll({
        where: { estado_tramite: 'Pendiente' },
        order: [['fecha_solicitud', 'ASC']],
        limit: 100
      });
      res.json(validaciones);
    } catch (error) {
      logger.error('Error obteniendo validaciones pendientes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener validaciones por usuario
  static async getPorUsuario(req, res) {
    try {
      const { userId } = req.query;
      const validaciones = await BandejaModel.findAll({
        where: { id_vocero: userId || req.user.id },
        order: [['fecha_solicitud', 'DESC']],
        limit: 50
      });
      res.json(validaciones);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Crear solicitud de validación
  static async crear(req, res) {
    try {
      const { tabla_afectada, registro_id, tipo_accion, datos_temporales } = req.body;
      
      if (!tabla_afectada || !tipo_accion || !datos_temporales) {
        return res.status(400).json({ error: 'Campos requeridos: tabla_afectada, tipo_accion, datos_temporales' });
      }

      const validacion = await BandejaModel.create({
        id_vocero: req.user.id,
        tabla_afectada,
        registro_id: registro_id || null,
        tipo_accion,
        datos_temporales,
        estado_tramite: 'Pendiente',
        fecha_solicitud: new Date()
      });

      await AuditService.log(req.user.id, 'CREATE', 'bandeja_validaciones', validacion.id, null, validacion.toJSON());
      
      res.status(201).json({ 
        mensaje: 'Solicitud registrada y pendiente de aprobación',
        validacion 
      });
    } catch (error) {
      logger.error('Error creando solicitud de validación:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Aprobar validación (admin)
  static async aprobar(req, res) {
    try {
      const { id } = req.params;
      const { comentarios } = req.body;

      const validacion = await BandejaModel.findByPk(id);
      if (!validacion) return res.status(404).json({ error: 'Validación no encontrada' });
      if (validacion.estado_tramite !== 'Pendiente') return res.status(400).json({ error: 'La solicitud ya fue procesada' });

      const models = BandejaModel.sequelize.models;
      const tabla = validacion.tabla_afectada;
      const datos = validacion.datos_temporales;
      let nuevoRegistro;

      // Inserción en la tabla real según corresponda
      if (tabla === 'habitantes') {
        nuevoRegistro = await models.Habitante.create(datos);
      } else if (tabla === 'noticias') {
        nuevoRegistro = await models.Noticia.create(datos);
      } else if (tabla === 'proyectos') {
        nuevoRegistro = await models.Proyecto.create(datos);
      } else if (tabla === 'organizaciones_sociales') {
        nuevoRegistro = await models.OrganizacionSocial.create(datos);
      } else if (tabla === 'reportes_7t') {
        nuevoRegistro = await models.Reporte7T.create(datos);
      } else {
        throw new Error(`Tabla afectada desconocida o no soportada: ${tabla}`);
      }

      await validacion.update({
        estado_tramite: 'Aprobado',
        id_validador: req.user.id,
        comentarios_validador: comentarios,
        fecha_validacion: new Date(),
        registro_id: nuevoRegistro.id // Actualizamos con el ID real insertado
      });

      await AuditService.log(req.user.id, 'VALIDACION_APROBADA', 'bandeja_validaciones', id, 
        { estado: 'Pendiente' }, { estado: 'Aprobado', nuevoRegistroId: nuevoRegistro.id });

      res.json({ 
        mensaje: 'Solicitud aprobada e insertada en el sistema',
        validacion 
      });
    } catch (error) {
      logger.error('Error aprobando validación:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Rechazar validación (admin)
  static async rechazar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) return res.status(400).json({ error: 'Se requiere motivo del rechazo' });

      const validacion = await BandejaModel.findByPk(id);
      if (!validacion) return res.status(404).json({ error: 'Validación no encontrada' });

      await validacion.update({
        estado_tramite: 'Rechazado',
        id_validador: req.user.id,
        motivo_rechazo: motivo,
        fecha_validacion: new Date()
      });

      await AuditService.log(req.user.id, 'VALIDACION', 'bandeja_validaciones', id, 
        { estado: 'Pendiente' }, { estado: 'Rechazado', motivo });

      res.json({ 
        mensaje: 'Solicitud rechazada',
        validacion 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Obtener detalles de una validación
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const validacion = await BandejaModel.findByPk(id);
      if (!validacion) return res.status(404).json({ error: 'Validación no encontrada' });
      res.json(validacion);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = BandejaValidacionesController;

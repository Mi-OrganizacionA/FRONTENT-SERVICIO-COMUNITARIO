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
      
      // Mapear al formato esperado por el frontend en notificaciones.html
      const formatData = validaciones.map(v => {
        const temp = v.datos_temporales || {};
        return {
          id: v.id,
          tabla_afectada: v.tabla_afectada || 'desconocida',
          tipo_accion: v.tipo_accion,
          datos_temporales: temp,
          estado: 'pendiente', // Siempre 'pendiente' en esta ruta
          id_vocero: v.id_vocero,
          nombre_vocero: temp.nombre_usuario || temp.nombre || temp.vocero || `Vocero #${v.id_vocero}`,
          consejo_comunal: temp.consejo_comunal || temp.consejoComunal || '',
          fecha_solicitud: v.fecha_solicitud || new Date().toISOString(),
          comentarios: v.comentarios_validador || ''
        };
      });

      res.json(formatData);
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

      // Validar duplicidad para proteger contra reintentos de la Cola Offline
      const { Op } = require('sequelize');
      const hace5Minutos = new Date(Date.now() - 5 * 60 * 1000);
      const existente = await BandejaModel.findOne({
        where: {
          id_vocero: req.user.id,
          tabla_afectada,
          tipo_accion,
          estado_tramite: 'Pendiente',
          fecha_solicitud: { [Op.gte]: hace5Minutos }
        }
      });

      if (existente && JSON.stringify(existente.datos_temporales) === JSON.stringify(datos_temporales)) {
        logger.info(`Validación duplicada detectada y prevenida para vocero ${req.user.id}`);
        return res.status(200).json({ 
          mensaje: 'Solicitud ya estaba registrada (deduplicada exitosamente)',
          validacion: existente 
        });
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
        
        // Vincular la cédula y teléfono al usuario que envió la solicitud para que "perfil.html" pueda enlazarlo
        if (validacion.id_vocero) {
          const usuarioSolicitante = await models.Usuario.findByPk(validacion.id_vocero);
          if (usuarioSolicitante && !usuarioSolicitante.cedula) {
            await usuarioSolicitante.update({ 
              cedula: datos.cedula, 
              telefono: datos.telefono || usuarioSolicitante.telefono 
            });
          }
        }
      } else if (tabla === 'noticias') {
        nuevoRegistro = await models.Noticia.create(datos);
      } else if (tabla === 'proyectos') {
        nuevoRegistro = await models.Proyecto.create(datos);
      } else if (tabla === 'organizaciones_sociales') {
        nuevoRegistro = await models.OrganizacionSocial.create(datos);
      } else if (tabla === 'reportes_7t') {
        nuevoRegistro = await models.Reporte7T.create(datos);
      } else if (tabla === 'usuarios' && validacion.tipo_accion === 'UPDATE') {
        nuevoRegistro = await models.Usuario.findByPk(validacion.registro_id);
        if (!nuevoRegistro) throw new Error('El usuario a actualizar no existe');
        
        // El nuevo correo puede venir como "nuevo_correo" o "email" según el frontend
        const nuevoCorreo = datos.nuevo_correo || datos.email;
        if (!nuevoCorreo) throw new Error('No se especificó un nuevo correo en la solicitud');
        
        await nuevoRegistro.update({ email: nuevoCorreo });
      } else if (tabla === 'recuperacion_clave' || tabla === 'contacto') {
        // Estas notificaciones no requieren inserción en tablas maestras, solo se archivan.
        nuevoRegistro = { id: validacion.registro_id };
      } else {
        throw new Error(`Tabla afectada o tipo de acción desconocida: ${tabla} - ${validacion.tipo_accion}`);
      }

      await validacion.update({
        estado_tramite: 'Aprobado',
        id_validador: req.user ? req.user.id : null,
        comentarios_validador: comentarios,
        fecha_validacion: new Date(),
        registro_id: nuevoRegistro && nuevoRegistro.id ? nuevoRegistro.id : validacion.registro_id
      });

      await AuditService.log(req.user ? req.user.id : 0, 'VALIDACION_APROBADA', 'bandeja_validaciones', id, 
        { estado: 'Pendiente' }, { estado: 'Aprobado', nuevoRegistroId: nuevoRegistro ? nuevoRegistro.id : null });

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

const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
let CarteleraModel = null;

class CarteleraDigitalController {
  static setModel(model) {
    CarteleraModel = model;
  }

  // Obtener publicaciones activas
  static async getActivas(req, res) {
    try {
      const publicaciones = await CarteleraModel.findAll({
        where: { activo: true },
        order: [['fecha_publicacion', 'DESC']],
        limit: 50
      });
      res.json(publicaciones);
    } catch (error) {
      logger.error('Error obteniendo publicaciones activas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener publicaciones por tipo
  static async getPorTipo(req, res) {
    try {
      const { tipo } = req.query;
      if (!['noticia', 'anuncio', 'encuesta'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de publicación no válido' });
      }

      const publicaciones = await CarteleraModel.findAll({
        where: { tipo_publicacion: tipo, activo: true },
        order: [['fecha_publicacion', 'DESC']],
        limit: 30
      });
      res.json(publicaciones);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Crear publicación
  static async crear(req, res) {
    try {
      const { tipo_publicacion, titulo, contenido } = req.body;

      if (!['noticia', 'anuncio', 'encuesta'].includes(tipo_publicacion)) {
        return res.status(400).json({ error: 'Tipo de publicación no válido' });
      }

      if (!titulo || !contenido) {
        return res.status(400).json({ error: 'Título y contenido son requeridos' });
      }

      const publicacion = await CarteleraModel.create({
        id_autor: req.user.id,
        tipo_publicacion,
        titulo,
        contenido,
        fecha_publicacion: new Date(),
        activo: true
      });

      await AuditService.log(req.user.id, 'CREATE', 'cartelera_digital', publicacion.id, null, publicacion.toJSON());

      res.status(201).json({
        mensaje: 'Publicación creada exitosamente',
        publicacion
      });
    } catch (error) {
      logger.error('Error creando publicación:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Actualizar publicación
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { titulo, contenido, activo } = req.body;

      const publicacion = await CarteleraModel.findByPk(id);
      if (!publicacion) return res.status(404).json({ error: 'Publicación no encontrada' });

      const datosAntiguos = publicacion.toJSON();
      await publicacion.update({
        titulo: titulo || publicacion.titulo,
        contenido: contenido || publicacion.contenido,
        activo: activo !== undefined ? activo : publicacion.activo
      });

      await AuditService.log(req.user.id, 'UPDATE', 'cartelera_digital', id, datosAntiguos, publicacion.toJSON());

      res.json({
        mensaje: 'Publicación actualizada',
        publicacion
      });
    } catch (error) {
      logger.error('Error actualizando publicación:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Eliminar publicación (soft delete)
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const publicacion = await CarteleraModel.findByPk(id);
      if (!publicacion) return res.status(404).json({ error: 'Publicación no encontrada' });

      await publicacion.update({ activo: false });
      await AuditService.log(req.user.id, 'DELETE', 'cartelera_digital', id, publicacion.toJSON(), null);

      res.json({ mensaje: 'Publicación eliminada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener una publicación
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const publicacion = await CarteleraModel.findByPk(id);
      if (!publicacion) return res.status(404).json({ error: 'Publicación no encontrada' });
      res.json(publicacion);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CarteleraDigitalController;

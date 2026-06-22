const { Op } = require('sequelize');
const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
let CarteleraModel = null;

const TIPOS_VALIDOS = ['noticia', 'anuncio', 'encuesta', 'convocatoria', 'aviso'];

class CarteleraDigitalController {
  static setModel(model) {
    CarteleraModel = model;
  }

  static getModel() {
    return CarteleraModel;
  }

  static _mapPublicacion(pub) {
    if (!pub) return null;
    const data = pub.toJSON ? pub.toJSON() : pub;
    return {
      ...data,
      autor: data.autor?.nombre || 'Sala de Autogobierno'
    };
  }

  static _whereActivas() {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    return {
      activo: true,
      [Op.or]: [
        { fecha_cierre: null },
        { fecha_cierre: { [Op.gte]: hoy } }
      ]
    };
  }

  static async getActivas(req, res) {
    try {
      if (!CarteleraModel) return res.status(500).json({ error: 'Modelo no inicializado' });
      const Usuario = CarteleraModel.sequelize?.models?.Usuario;
      const publicaciones = await CarteleraModel.findAll({
        where: CarteleraDigitalController._whereActivas(),
        include: Usuario ? [{ model: Usuario, as: 'autor', attributes: ['id', 'nombre'] }] : [],
        order: [['destacada', 'DESC'], ['fecha_publicacion', 'DESC']],
        limit: 50
      });
      res.json(publicaciones.map(p => CarteleraDigitalController._mapPublicacion(p)));
    } catch (error) {
      logger.error('Error obteniendo publicaciones activas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getPorTipo(req, res) {
    try {
      const { tipo } = req.query;
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de publicación no válido' });
      }

      const Usuario = CarteleraModel.sequelize?.models?.Usuario;
      const publicaciones = await CarteleraModel.findAll({
        where: { ...CarteleraDigitalController._whereActivas(), tipo_publicacion: tipo },
        include: Usuario ? [{ model: Usuario, as: 'autor', attributes: ['id', 'nombre'] }] : [],
        order: [['fecha_publicacion', 'DESC']],
        limit: 30
      });
      res.json(publicaciones.map(p => CarteleraDigitalController._mapPublicacion(p)));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async crear(req, res) {
    try {
      const { tipo_publicacion, titulo, contenido, enlace_extra, fecha_cierre, destacada, fecha_publicacion } = req.body;

      if (!TIPOS_VALIDOS.includes(tipo_publicacion)) {
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
        enlace_extra: enlace_extra || null,
        fecha_cierre: fecha_cierre || null,
        destacada: !!destacada,
        fecha_publicacion: fecha_publicacion ? new Date(fecha_publicacion) : new Date(),
        activo: true
      });

      await AuditService.log(req.user.id, 'CREATE', 'cartelera_digital', publicacion.id, null, publicacion.toJSON());

      res.status(201).json({
        mensaje: 'Publicación creada exitosamente',
        publicacion: CarteleraDigitalController._mapPublicacion(publicacion)
      });
    } catch (error) {
      logger.error('Error creando publicación:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { titulo, contenido, activo, enlace_extra, fecha_cierre, destacada, tipo_publicacion, fecha_publicacion } = req.body;

      const publicacion = await CarteleraModel.findByPk(id);
      if (!publicacion) return res.status(404).json({ error: 'Publicación no encontrada' });

      const isAdmin = req.user?.rol === 'admin' || req.user?.rol === 'admin_principal';
      if (!isAdmin && publicacion.id_autor !== req.user?.id) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta publicación.' });
      }

      const datosAntiguos = publicacion.toJSON();
      await publicacion.update({
        titulo: titulo ?? publicacion.titulo,
        contenido: contenido ?? publicacion.contenido,
        activo: activo !== undefined ? activo : publicacion.activo,
        enlace_extra: enlace_extra !== undefined ? enlace_extra : publicacion.enlace_extra,
        fecha_cierre: fecha_cierre !== undefined ? fecha_cierre : publicacion.fecha_cierre,
        destacada: destacada !== undefined ? !!destacada : publicacion.destacada,
        tipo_publicacion: tipo_publicacion && TIPOS_VALIDOS.includes(tipo_publicacion) ? tipo_publicacion : publicacion.tipo_publicacion,
        fecha_publicacion: fecha_publicacion ? new Date(fecha_publicacion) : publicacion.fecha_publicacion
      });

      await AuditService.log(req.user.id, 'UPDATE', 'cartelera_digital', id, datosAntiguos, publicacion.toJSON());

      res.json({
        mensaje: 'Publicación actualizada',
        publicacion: CarteleraDigitalController._mapPublicacion(publicacion)
      });
    } catch (error) {
      logger.error('Error actualizando publicación:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const publicacion = await CarteleraModel.findByPk(id);
      if (!publicacion) return res.status(404).json({ error: 'Publicación no encontrada' });

      const isAdmin = req.user?.rol === 'admin' || req.user?.rol === 'admin_principal';
      if (!isAdmin && publicacion.id_autor !== req.user?.id) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta publicación.' });
      }

      await publicacion.update({ activo: false });
      await AuditService.log(req.user.id, 'DELETE', 'cartelera_digital', id, publicacion.toJSON(), null);

      res.json({ mensaje: 'Publicación eliminada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const Usuario = CarteleraModel.sequelize?.models?.Usuario;
      const publicacion = await CarteleraModel.findByPk(id, {
        include: Usuario ? [{ model: Usuario, as: 'autor', attributes: ['id', 'nombre'] }] : []
      });
      if (!publicacion) return res.status(404).json({ error: 'Publicación no encontrada' });
      res.json(CarteleraDigitalController._mapPublicacion(publicacion));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CarteleraDigitalController;

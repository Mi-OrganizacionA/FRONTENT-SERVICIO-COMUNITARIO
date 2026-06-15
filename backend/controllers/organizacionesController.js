const logger = require("../utils/logger");
const AuditService = require("../services/auditService");
const PersonaGrupoSocialController = require("./personaGrupoSocialController");

let OrganizacionSocial;

class OrganizacionesController {
  static setModel(model) {
    OrganizacionSocial = model;
  }

  static async getAll(req, res, next) {
    try {
      const { tipo_organizacion } = req.query;
      const where = {};
      if (tipo_organizacion) where.tipo_organizacion = tipo_organizacion;
      const data = await OrganizacionSocial.findAll({ where });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async getById(req, res, next) {
    try {
      const data = await OrganizacionSocial.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Organizacin no encontrada" });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async create(req, res, next) {
    try {
      // Los administradores siempre guardan directo, sin pasar por la bandeja
      const esAdmin = req.user?.rol === 'admin';

      if (!esAdmin) {
        // Solo para voceros: verificar configuración de aprobación
        const Configuracion = OrganizacionSocial.sequelize.models.Configuracion;
        const BandejaValidaciones = OrganizacionSocial.sequelize.models.BandejaValidaciones;

        const config = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Organizaciones' } }).catch(() => null);
        const globalConfig = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } }).catch(() => null);

        const autoApprove = (globalConfig && globalConfig.valor === 'true') ||
                            (config && config.valor === 'true');

        if (!autoApprove) {
          await BandejaValidaciones.create({
            id_vocero: req.user.id,
            tabla_afectada: 'organizaciones_sociales',
            tipo_accion: 'CREATE',
            datos_temporales: req.body,
            estado_tramite: 'Pendiente'
          });
          return res.status(202).json({ mensaje: 'Solicitud enviada a la bandeja de validaciones.' });
        }
      }

      const organizacion = await OrganizacionSocial.create(req.body);
      await AuditService.log(req.user?.id, 'CREATE', 'organizaciones', organizacion.id, null, organizacion);
      res.status(201).json(organizacion);
    } catch (error) {
      logger.error('Error creando organización:', error);
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const data = await OrganizacionSocial.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Organizacin no encontrada" });
      const datosAntiguos = data.toJSON();
      await data.update(req.body);
      if (req.user) {
        await AuditService.log(req.user.id, "UPDATE", "organizaciones_sociales", data.id, datosAntiguos, data.toJSON());
      }
      res.json(data);
    } catch (error) { next(error); }
  }

  static async remove(req, res, next) {
    try {
      const data = await OrganizacionSocial.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Organizaci�n no encontrada" });
      const datosAntiguos = data.toJSON();
      await data.update({ activo: false }); 
      if (req.user) {
        await AuditService.log(req.user.id, "DELETE", "organizaciones_sociales", data.id, datosAntiguos, data.toJSON());
      }
      res.json({ success: true, message: "Organizaci�n eliminada (soft delete)" });
    } catch (error) { next(error); }
  }

  static async getPorConsejo(req, res, next) {
    try {
      const { consejoId } = req.params;
      const organizaciones = await OrganizacionSocial.findAll({
        where: { id_comunidad: consejoId, activo: true },
        include: [{
          model: require("../models").PersonaGrupoSocial,
          as: "miembros",
          where: { fecha_salida: null, activo: true },
          required: false
        }]
      });

      const resultado = organizaciones.map(org => {
        const orgJSON = org.toJSON();
        orgJSON.totalMiembros = orgJSON.miembros ? orgJSON.miembros.length : 0;
        delete orgJSON.miembros;
        return orgJSON;
      });

      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }

  static async getMiembros(req, res, next) {
    try {
      const { id } = req.params;
      const org = await OrganizacionSocial.findByPk(id);
      if (!org) return res.status(404).json({ error: "Organizaci�n no encontrada" });

      const miembros = await require("../models").PersonaGrupoSocial.findAll({
        where: { id_organizacion: id, activo: true, fecha_salida: null },
        include: [{
          model: require("../models").Habitante,
          as: "habitante",
          attributes: ["id", "nombres", "apellidos", "cedula", "genero", "fecha_nacimiento"]
        }]
      });

      res.json(miembros);
    } catch (error) {
      next(error);
    }
  }

  static async getEstadisticas(req, res, next) {
    try {
      const { id } = req.params;
      const org = await OrganizacionSocial.findByPk(id);
      if (!org) return res.status(404).json({ error: "Organizaci�n no encontrada" });

      const miembros = await require("../models").PersonaGrupoSocial.findAll({
        where: { id_organizacion: id, activo: true, fecha_salida: null },
        include: [{
          model: require("../models").Habitante,
          as: "habitante"
        }]
      });

      const totalMiembros = miembros.length;
      const miembrosPorRol = {};
      const generoMiembros = { M: 0, F: 0, Otro: 0 };
      const condicionSalud = {};

      miembros.forEach(m => {
        miembrosPorRol[m.rol_en_grupo] = (miembrosPorRol[m.rol_en_grupo] || 0) + 1;
        
        if (m.habitante && m.habitante.genero) {
          const gen = m.habitante.genero.toUpperCase();
          if (["M", "F"].includes(gen)) {
            generoMiembros[gen]++;
          } else {
            generoMiembros["Otro"]++;
          }
        } else {
          generoMiembros["Otro"]++;
        }

        if (m.habitante && m.habitante.condicion_salud) {
          condicionSalud[m.habitante.condicion_salud] = (condicionSalud[m.habitante.condicion_salud] || 0) + 1;
        }
      });

      res.json({
        totalMiembros,
        miembrosPorRol,
        generoMiembros,
        condicionSalud
      });
    } catch (error) {
      next(error);
    }
  }

  static async agregarMiembro(req, res, next) {
    try {
      req.body.id_organizacion = req.params.id;
      await PersonaGrupoSocialController.agregarMiembro(req, res);
    } catch (error) {
      next(error);
    }
  }

  static async removerMiembro(req, res, next) {
    try {
      req.params.id = req.params.membresia_id;
      await PersonaGrupoSocialController.removerMiembro(req, res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizacionesController;
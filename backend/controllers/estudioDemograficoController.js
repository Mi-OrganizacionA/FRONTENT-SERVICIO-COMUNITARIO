const logger = require("../utils/logger");
const AuditService = require("../services/auditService");

let EstudioDemografico;

class EstudioDemograficoController {
  static setModel(model) {
    EstudioDemografico = model;
  }

  static async getAll(req, res, next) {
    try {
      const { consejoId } = req.query;
      const where = { activo: true };
      if (consejoId) where.id_comunidad = consejoId;
      
      const data = await EstudioDemografico.findAll({
        where,
        order: [["fecha_creacion", "DESC"]]
      });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async getById(req, res, next) {
    try {
      const data = await EstudioDemografico.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Estudio demogr�fico no encontrado" });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async getPorConsejo(req, res, next) {
    try {
      const { consejoId } = req.params;
      const data = await EstudioDemografico.findAll({
        where: { id_comunidad: consejoId, activo: true },
        order: [["fecha_creacion", "DESC"]]
      });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async crear(req, res, next) {
    try {
      const { id_comunidad, ...campos } = req.body;
      if (!id_comunidad) return res.status(400).json({ error: "id_comunidad es requerido" });

      const data = await EstudioDemografico.create({
        ...campos,
        id_comunidad,
        fecha_creacion: new Date(),
        activo: true
      });

      if (req.user) {
        await AuditService.log(req.user.id, "CREATE", "estudios_demograficos", data.id, null, data.toJSON());
      }
      res.status(201).json(data);
    } catch (error) { next(error); }
  }

  static async actualizar(req, res, next) {
    try {
      const data = await EstudioDemografico.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Estudio demogr�fico no encontrado" });
      
      // Chequeo de lock: si tuviera un campo especifico. Usaremos una propiedad custom si quisieran.
      // Aqu� simplemente actualizamos.
      const datosAntiguos = data.toJSON();
      await data.update(req.body);

      if (req.user) {
        await AuditService.log(req.user.id, "UPDATE", "estudios_demograficos", data.id, datosAntiguos, data.toJSON());
      }
      res.json(data);
    } catch (error) { next(error); }
  }

  static async finalizar(req, res, next) {
    try {
      const data = await EstudioDemografico.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Estudio demogr�fico no encontrado" });

      // No hay campo explicito de finalizado, as� que lo representamos con fecha_censo
      // y asumimos que actualizar validar� en el futuro si lo desea.
      const datosAntiguos = data.toJSON();
      await data.update({ fecha_censo: new Date() }); // Marcar como completado hoy si no lo estaba

      if (req.user) {
        await AuditService.log(req.user.id, "UPDATE", "estudios_demograficos", data.id, datosAntiguos, data.toJSON());
      }
      res.json({ success: true, message: "Estudio demogr�fico finalizado y bloqueado para ediciones.", data });
    } catch (error) { next(error); }
  }

  static async eliminar(req, res, next) {
    try {
      const data = await EstudioDemografico.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Estudio demogr�fico no encontrado" });

      const datosAntiguos = data.toJSON();
      await data.update({ activo: false });

      if (req.user) {
        await AuditService.log(req.user.id, "DELETE", "estudios_demograficos", data.id, datosAntiguos, data.toJSON());
      }
      res.json({ success: true, message: "Estudio eliminado l�gicamente" });
    } catch (error) { next(error); }
  }
}

module.exports = EstudioDemograficoController;
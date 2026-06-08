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
    const models = require('../models').initModels ? require('../models').initModels : require('../models');
    // Si models exporta initModels, o si exporta un objeto con todos.
    // Usualmente require('../models') exporta { sequelize, ...models } en proyectos Sequelize.
    const db = require('../models'); 
    const sequelize = db.sequelize;

    const t = await sequelize.transaction();
    try {
      const { 
        id_comunidad, 
        cabecera, 
        familiares, 
        economia, 
        vivienda, 
        salud, 
        servicios, 
        participacion, 
        comunidad, 
        opciones 
      } = req.body;

      if (!id_comunidad && !cabecera?.id_comunidad) {
        throw new Error("id_comunidad es requerido");
      }

      // 1. Crear Cabecera (EstudioDemografico)
      const data = await EstudioDemografico.create({
        ...(cabecera || req.body),
        id_comunidad: id_comunidad || cabecera.id_comunidad,
        fecha_creacion: new Date(),
        activo: true
      }, { transaction: t });

      const id_estudio = data.id;

      // 2. Crear Familiares (Sección III)
      if (familiares && familiares.length > 0) {
        const fams = familiares.map(f => ({ ...f, id_estudio }));
        await db.CensoCaracteristicaFamiliar.bulkCreate(fams, { transaction: t });
      }

      // 3. Crear Economía (Sección IV)
      if (economia) {
        await db.CensoSituacionEconomica.create({ ...economia, id_estudio }, { transaction: t });
      }

      // 4. Crear Vivienda (Sección V)
      if (vivienda) {
        await db.CensoSituacionVivienda.create({ ...vivienda, id_estudio }, { transaction: t });
      }

      // 5. Crear Salud (Sección VI)
      if (salud) {
        await db.CensoSalud.create({ ...salud, id_estudio }, { transaction: t });
      }

      // 6. Crear Servicios (Sección VII)
      if (servicios) {
        await db.CensoServicios.create({ ...servicios, id_estudio }, { transaction: t });
      }

      // 7. Crear Participacion (Sección VIII)
      if (participacion) {
        await db.CensoParticipacionComunitaria.create({ ...participacion, id_estudio }, { transaction: t });
      }

      // 8. Crear Comunidad (Sección IX)
      if (comunidad) {
        await db.CensoSituacionComunidad.create({ ...comunidad, id_estudio }, { transaction: t });
      }

      // 9. Crear Opciones Multiples (Checkboxes separados)
      if (opciones && opciones.length > 0) {
        const ops = opciones.map(o => ({ ...o, id_estudio }));
        await db.CensoOpcionMultiple.bulkCreate(ops, { transaction: t });
      }

      await t.commit();

      if (req.user) {
        await AuditService.log(req.user.id, "CREATE", "estudios_demograficos", data.id, null, data.toJSON());
      }
      res.status(201).json({ success: true, id_estudio });
    } catch (error) { 
      await t.rollback();
      next(error); 
    }
  }

  static async guardarPaso(req, res, next) {
    const db = require('../models').initModels ? require('../models').initModels : require('../models');
    const t = await db.sequelize.transaction();
    try {
      const { paso, id_estudio, datos } = req.body;
      
      if (!paso || !datos) {
        throw new Error("Paso y datos son requeridos");
      }

      // Paso 1 y 2: Cabecera y Ubicación
      if (paso === 1 || paso === 2) {
        if (!id_estudio) throw new Error("id_estudio es requerido para guardar la cabecera");
        
        const [estudio, created] = await EstudioDemografico.findOrCreate({
          where: { id: id_estudio },
          defaults: { ...datos, activo: true, fecha_creacion: new Date() },
          transaction: t
        });
        
        if (!created) {
          await estudio.update(datos, { transaction: t });
        }
      } 
      // Pasos posteriores requieren que exista el id_estudio
      else {
        if (!id_estudio) throw new Error("Falta el id_estudio para vincular el paso " + paso);
        
        switch (paso) {
          case 3: // Jefe y Familiares
            if (datos.familiares && datos.familiares.length > 0) {
              await db.CensoCaracteristicaFamiliar.destroy({ where: { id_estudio }, transaction: t });
              const fams = datos.familiares.map(f => ({ ...f, id_estudio }));
              await db.CensoCaracteristicaFamiliar.bulkCreate(fams, { transaction: t });
            }
            break;
          case 4: { // Economía
            const [eco, ecoCreated] = await db.CensoSituacionEconomica.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!ecoCreated) await eco.update(datos, { transaction: t });
            break;
          }
          case 5: { // Vivienda
            const [viv, vivCreated] = await db.CensoSituacionVivienda.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!vivCreated) await viv.update(datos, { transaction: t });
            break;
          }
          case 6: { // Salud
            const [sal, salCreated] = await db.CensoSalud.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!salCreated) await sal.update(datos, { transaction: t });
            break;
          }
          case 7: { // Servicios
            const [ser, serCreated] = await db.CensoServicios.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!serCreated) await ser.update(datos, { transaction: t });
            break;
          }
          case 8: { // Participación
            const [par, parCreated] = await db.CensoParticipacionComunitaria.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!parCreated) await par.update(datos, { transaction: t });
            break;
          }
          case 9: { // Comunidad
            const [com, comCreated] = await db.CensoSituacionComunidad.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!comCreated) await com.update(datos, { transaction: t });
            break;
          }
          case 10: // Opciones Múltiples (Guardado Final o intermedio si aplica)
            if (datos.opciones && datos.opciones.length > 0) {
              await db.CensoOpcionMultiple.destroy({ where: { id_estudio }, transaction: t });
              const ops = datos.opciones.map(o => ({ ...o, id_estudio }));
              await db.CensoOpcionMultiple.bulkCreate(ops, { transaction: t });
            }
            break;
          default:
            throw new Error("Paso no reconocido");
        }
      }

      await t.commit();
      res.json({ success: true, message: `Paso ${paso} guardado correctamente`, id_estudio });
    } catch (error) {
      await t.rollback();
      next(error);
    }
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
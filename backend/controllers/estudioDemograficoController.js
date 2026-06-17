const logger = require("../utils/logger");
const AuditService = require("../services/auditService");

let EstudioDemografico;
let models;

class EstudioDemograficoController {
  static setModel(model) {
    EstudioDemografico = model;
  }
  
  static setModels(m) {
    models = m;
  }

  static async getAll(req, res, next) {
    try {
      const { consejoId } = req.query;
      const where = { activo: true };
      if (consejoId) where.id_comunidad = consejoId;
      
      const db = models;
      const data = await EstudioDemografico.findAll({
        where,
        order: [["fecha_creacion", "DESC"]],
        include: [
          { model: db.CensoCaracteristicaFamiliar, as: 'familiares' },
          { model: db.CensoSituacionVivienda, as: 'situacion_vivienda' },
          { model: db.CensoSalud, as: 'salud' },
          { model: db.CensoServicios, as: 'servicios' }
        ]
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
      const db = models;
      const data = await EstudioDemografico.findAll({
        where: { id_comunidad: consejoId, activo: true },
        order: [["fecha_creacion", "DESC"]],
        include: [
          { model: db.CensoCaracteristicaFamiliar, as: 'familiares' },
          { model: db.CensoSituacionVivienda, as: 'situacion_vivienda' },
          { model: db.CensoSalud, as: 'salud' },
          { model: db.CensoServicios, as: 'servicios' }
        ]
      });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async crear(req, res, next) {
    const db = models; 
    // Asegurar que obtenemos la instancia de sequelize correctamente
    const sequelize = (db && db.sequelize) || (EstudioDemografico && EstudioDemografico.sequelize);

    if (!sequelize) {
      return next(new Error('Sequelize instance no disponible para transacciones en crear'));
    }

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
        opciones,
        id_estudio_borrador
      } = req.body;

      // Si se envió un id_estudio_borrador, significa que el wizard guardó progresivamente.
      // Para asegurar la integridad total de los datos según el envío final, eliminamos el borrador
      // y lo recreamos completamente con el payload final.
      if (id_estudio_borrador) {
        await EstudioDemografico.destroy({ where: { id: id_estudio_borrador }, transaction: t });
      }

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
    const db = models;
    // db may be an object with models or a function; derive sequelize instance reliably
    const sequelize = db && db.sequelize ? db.sequelize : (EstudioDemografico && EstudioDemografico.sequelize);
    if (!sequelize) {
      throw new Error('Sequelize instance no disponible para transacciones');
    }
    const t = await sequelize.transaction();
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
          // Los borradores se crean inactivos para no mostrarse en getAll hasta ser aprobados
          defaults: { ...datos, activo: false, fecha_creacion: new Date() },
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
          case 3: // Jefe
          case 4: // Otros Familiares
            if (datos.familiares && datos.familiares.length > 0) {
              if (paso === 3) {
                await db.CensoCaracteristicaFamiliar.destroy({ where: { id_estudio, es_jefe_familia: true }, transaction: t });
              } else {
                await db.CensoCaracteristicaFamiliar.destroy({ where: { id_estudio, es_jefe_familia: false }, transaction: t });
              }
              const fams = datos.familiares.map(f => ({ ...f, id_estudio }));
              await db.CensoCaracteristicaFamiliar.bulkCreate(fams, { transaction: t });
            }
            break;
          case 5: { // Economía
            const [eco, ecoCreated] = await db.CensoSituacionEconomica.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!ecoCreated) await eco.update(datos, { transaction: t });
            break;
          }
          case 6: { // Vivienda
            const [viv, vivCreated] = await db.CensoSituacionVivienda.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!vivCreated) await viv.update(datos, { transaction: t });
            break;
          }
          case 7: { // Servicios
            const [ser, serCreated] = await db.CensoServicios.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!serCreated) await ser.update(datos, { transaction: t });
            break;
          }
          case 8: { // Salud
            const [sal, salCreated] = await db.CensoSalud.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!salCreated) await sal.update(datos, { transaction: t });
            break;
          }
          case 9: { // Participación
            const [par, parCreated] = await db.CensoParticipacionComunitaria.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!parCreated) await par.update(datos, { transaction: t });
            break;
          }
          case 10: { // Comunidad
            const [com, comCreated] = await db.CensoSituacionComunidad.findOrCreate({ where: { id_estudio }, defaults: { ...datos }, transaction: t });
            if (!comCreated) await com.update(datos, { transaction: t });
            break;
          }
          default:
            throw new Error("Paso no reconocido");
        }

        // Manejar opciones múltiples independientemente del paso (ya que varios pasos tienen opciones)
        if (datos.opciones && datos.opciones.length > 0) {
          const categoriasEnPaso = [...new Set(datos.opciones.map(o => o.categoria))];
          await db.CensoOpcionMultiple.destroy({ 
            where: { id_estudio, categoria: categoriasEnPaso }, 
            transaction: t 
          });
          const ops = datos.opciones.map(o => ({ ...o, id_estudio }));
          await db.CensoOpcionMultiple.bulkCreate(ops, { transaction: t });
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
      res.json({ success: true, message: "Estudio eliminado lógicamente" });
    } catch (error) { next(error); }
  }

  static async exportarPdf(req, res, next) {
    try {
      const { id } = req.params;
      const db = models;
      const PdfGeneradorViviendas = require('../services/pdfGeneradorViviendas');

      // Cargar el estudio demográfico con TODAS sus relaciones
      const estudio = await EstudioDemografico.findByPk(id, {
        include: [
          { model: db.CensoCaracteristicaFamiliar,  as: 'familiares'    },
          { model: db.CensoSituacionVivienda,        as: 'situacion_vivienda' },
          { model: db.CensoSalud,                    as: 'salud'         },
          { model: db.CensoServicios,                as: 'servicios'     },
          { model: db.CensoParticipacionComunitaria, as: 'participacion_comunitaria' },
          { model: db.CensoSituacionEconomica,       as: 'situacion_economica' },
          { model: db.CensoSituacionComunidad,       as: 'situacion_comunidad' },
          { model: db.ConsejoComunal,                as: 'consejo'       }
        ]
      });

      if (!estudio) return res.status(404).json({ error: 'Estudio demográfico no encontrado' });

      const pdfBuffer = await PdfGeneradorViviendas.generarPdfEstudio(estudio.toJSON());

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=censo_demografico_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error exportando PDF del estudio demográfico:', error);
      res.status(500).json({ error: 'Error generando el PDF: ' + error.message });
    }
  }
}

module.exports = EstudioDemograficoController;
let Vivienda;
let models;

module.exports = {
  setModel: (model) => { Vivienda = model; },
  setModels: (m) => { models = m; },

  getAll: async (req, res, next) => {
    try {
      const { consejo_comunal_id } = req.query;
      const where = {};
      if (consejo_comunal_id) where.consejo_comunal_id = consejo_comunal_id;
      
      const db = models;
      const data = await Vivienda.findAll({ 
        where,
        include: [
          { model: db.Habitante, as: 'jefe', attributes: ['cedula', 'nombres', 'apellidos'] },
          { model: db.ConsejoComunal, as: 'consejo', attributes: ['nombre_comunidad'] }
        ]
      });

      // Mapear al formato esperado por el frontend
      const mappedData = data.map(v => {
        const raw = v.toJSON();
        return {
          ...raw,
          cedula: raw.jefe ? raw.jefe.cedula : null,
          sector: raw.consejo ? raw.consejo.nombre_comunidad : null,
          habitantes: raw.cantidad_habitaciones || 0, // Placeholder, idealmente contar desde Habitantes
          tipo: raw.tipo_vivienda,
          condicion: raw.condiciones_salubridad,
          gas: raw.enseres_vivienda?.gas || 'No posee', // Usar campo enseres
          agua: raw.enseres_vivienda?.agua || 'No tiene'
        };
      });

      res.json(mappedData);
    } catch (error) { next(error); }
  },

  create: async (req, res, next) => {
    try {
      // Validar unicidad del jefe de familia: un habitante solo puede ser jefe en UNA vivienda
      if (req.body.id_jefe_familia) {
        const existente = await Vivienda.findOne({
          where: { id_jefe_familia: req.body.id_jefe_familia }
        });
        if (existente) {
          return res.status(409).json({
            error: 'Este habitante ya tiene una vivienda registrada como jefe de familia. Una cédula solo puede ser jefe de una vivienda.'
          });
        }
      }

      const db = models;
      
      // Validar si el Censo está abierto
      const censoConfig = await db.Configuracion.findOne({ where: { clave: 'Censo' } });
      if (req.user?.rol !== 'admin' && censoConfig && censoConfig.valor === 'false') {
        return res.status(403).json({ error: 'El Censo Comunitario está cerrado. No se permiten registrar nuevas viviendas.' });
      }

      // Lógica de Aprobación Automática
      const config = await db.Configuracion.findOne({ where: { clave: 'Aprobación Automática Habitantes' } });
      const globalConfig = await db.Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await db.BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'viviendas',
          tipo_accion: 'CREATE',
          datos_temporales: req.body,
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud de registro enviada a la bandeja de validaciones.' });
      }

      const data = await Vivienda.create(req.body);
      res.status(201).json(data);
    } catch (error) { next(error); }
  },

  update: async (req, res, next) => {
    try {
      const db = models;
      const data = await Vivienda.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: 'Vivienda no encontrada' });

      // Lógica de Aprobación Automática
      const config = await db.Configuracion.findOne({ where: { clave: 'Aprobación Automática Habitantes' } });
      const globalConfig = await db.Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await db.BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'viviendas',
          tipo_accion: 'UPDATE',
          datos_temporales: { id: req.params.id, ...req.body },
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud de edición enviada a la bandeja de validaciones.' });
      }

      await data.update(req.body);
      res.json(data);
    } catch (error) { next(error); }
  },

  remove: async (req, res, next) => {
    try {
      const db = models;
      const data = await Vivienda.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: 'Vivienda no encontrada' });

      // Lógica de Aprobación Automática
      const config = await db.Configuracion.findOne({ where: { clave: 'Aprobación Automática Habitantes' } });
      const globalConfig = await db.Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
      
      const autoApprove = (globalConfig && globalConfig.valor === 'true') || 
                          (config && config.valor === 'true') || 
                          req.user?.rol === 'admin';

      if (!autoApprove) {
        await db.BandejaValidaciones.create({
          id_vocero: req.user.id,
          tabla_afectada: 'viviendas',
          tipo_accion: 'DELETE',
          datos_temporales: { id: req.params.id },
          estado_tramite: 'Pendiente'
        });
        return res.status(202).json({ mensaje: 'Solicitud de eliminación enviada a la bandeja de validaciones.' });
      }

      await data.destroy();
      res.json({ success: true });
    } catch (error) { next(error); }
  },

  exportarPdfCenso: async (req, res, next) => {
    try {
      const { id } = req.params;
      const db = models;
      const PdfGeneradorViviendas = require('../services/pdfGeneradorViviendas');
      
      const vivienda = await db.Vivienda.findByPk(id, {
        include: [{ model: db.ConsejoComunal, as: 'consejo' }]
      });
      if (!vivienda) return res.status(404).json({ error: 'Vivienda no encontrada' });

      const jefe = await db.Habitante.findByPk(vivienda.id_jefe_familia);
      if (jefe) {
        jefe.es_jefe_familia = true;
      }
      const habitantes = jefe ? [jefe] : [];

      const pdfBuffer = await PdfGeneradorViviendas.generarPdf(
        vivienda.toJSON(),
        habitantes.map(h => h.toJSON()),
        vivienda.consejo ? vivienda.consejo.toJSON() : {}
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=censo_vivienda_${id}.pdf`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) { 
      console.error("Error exportando PDF:", error);
      res.status(500).json({ error: "Error generando PDF" });
    }
  }
};

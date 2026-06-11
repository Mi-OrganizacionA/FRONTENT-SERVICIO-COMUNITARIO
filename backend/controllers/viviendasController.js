let Vivienda;

module.exports = {
  setModel: (model) => { Vivienda = model; },

  getAll: async (req, res, next) => {
    try {
      const { consejo_comunal_id } = req.query;
      const where = {};
      if (consejo_comunal_id) where.consejo_comunal_id = consejo_comunal_id;
      const data = await Vivienda.findAll({ where });
      res.json(data);
    } catch (error) { next(error); }
  },

  create: async (req, res, next) => {
    try {
      const data = await Vivienda.create(req.body);
      res.status(201).json(data);
    } catch (error) { next(error); }
  },

  update: async (req, res, next) => {
    try {
      const data = await Vivienda.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: 'Vivienda no encontrada' });
      await data.update(req.body);
      res.json(data);
    } catch (error) { next(error); }
  },

  remove: async (req, res, next) => {
    try {
      const data = await Vivienda.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: 'Vivienda no encontrada' });
      await data.destroy();
      res.json({ success: true });
    } catch (error) { next(error); }
  },

  exportarPdfCenso: async (req, res, next) => {
    try {
      const { id } = req.params;
      const db = require('../models');
      const PdfGeneradorViviendas = require('../services/pdfGeneradorViviendas');
      
      const vivienda = await db.Vivienda.findByPk(id, {
        include: [{ model: db.ConsejoComunal, as: 'consejo' }]
      });
      if (!vivienda) return res.status(404).json({ error: 'Vivienda no encontrada' });

      const habitantes = await db.Habitante.findAll({
        where: { vivienda_id: id },
        order: [['es_jefe_familia', 'DESC'], ['fecha_nacimiento', 'ASC']]
      });

      const pdfBuffer = await PdfGeneradorViviendas.generarPdf(
        vivienda.toJSON(),
        habitantes.map(h => h.toJSON()),
        vivienda.consejo ? vivienda.consejo.toJSON() : {}
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=censo_vivienda_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) { 
      console.error("Error exportando PDF:", error);
      res.status(500).json({ error: "Error generando PDF" });
    }
  }
};

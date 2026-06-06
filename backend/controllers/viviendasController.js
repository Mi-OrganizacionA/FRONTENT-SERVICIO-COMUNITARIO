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
  }
};

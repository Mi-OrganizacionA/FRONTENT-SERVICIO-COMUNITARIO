let OrganizacionSocial;

module.exports = {
  setModel: (model) => { OrganizacionSocial = model; },

  getAll: async (req, res, next) => {
    try {
      const { tipo_organizacion } = req.query;
      const where = {};
      if (tipo_organizacion) where.tipo_organizacion = tipo_organizacion;
      const data = await OrganizacionSocial.findAll({ where });
      res.json(data);
    } catch (error) { next(error); }
  },

  create: async (req, res, next) => {
    try {
      const data = await OrganizacionSocial.create(req.body);
      res.status(201).json(data);
    } catch (error) { next(error); }
  },

  update: async (req, res, next) => {
    try {
      const data = await OrganizacionSocial.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: 'Organización no encontrada' });
      await data.update(req.body);
      res.json(data);
    } catch (error) { next(error); }
  },

  remove: async (req, res, next) => {
    try {
      const data = await OrganizacionSocial.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: 'Organización no encontrada' });
      await data.destroy();
      res.json({ success: true });
    } catch (error) { next(error); }
  }
};

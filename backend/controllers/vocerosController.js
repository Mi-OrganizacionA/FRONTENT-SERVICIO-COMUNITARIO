let Usuario;

module.exports = {
  setModel: (model) => { Usuario = model; },

  getAll: async (req, res, next) => {
    try {
      const data = await Usuario.findAll({ where: { rol: 'vocero' } });
      res.json(data);
    } catch (error) { next(error); }
  },

  create: async (req, res, next) => {
    try {
      // Para un vocero, usamos la cédula como nombre de usuario por defecto
      const data = await Usuario.create({
        nombre_usuario: req.body.cedula,
        contrasena: 'vocero123', // Contraseña por defecto
        rol: 'vocero',
        ...req.body
      });
      res.status(201).json(data);
    } catch (error) { next(error); }
  },

  remove: async (req, res, next) => {
    try {
      const data = await Usuario.findByPk(req.params.id);
      if (!data || data.rol !== 'vocero') return res.status(404).json({ error: 'Vocero no encontrado' });
      await data.destroy();
      res.json({ success: true });
    } catch (error) { next(error); }
  }
};

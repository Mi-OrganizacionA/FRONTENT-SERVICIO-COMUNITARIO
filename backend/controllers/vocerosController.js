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
      const bcrypt = require('bcryptjs');
      const ConsejoComunal = Usuario.sequelize.models.ConsejoComunal;
      let id_comunidad_asignada = req.body.comunidad_id || null;

      if (!id_comunidad_asignada && req.body.comunidad && ConsejoComunal) {
        const consejo = await ConsejoComunal.findOne({ where: { nombre_comunidad: req.body.comunidad } });
        if (consejo) id_comunidad_asignada = consejo.id;
      }

      // Para un vocero, usamos la cédula y nombre, con un correo genérico si no lo hay
      const data = await Usuario.create({
        nombre: req.body.nombre || `Vocero ${req.body.cedula}`,
        email: req.body.email || `vocero_${req.body.cedula}@sicag.com`,
        telefono: req.body.telefono || null,
        cedula: req.body.cedula,
        credenciales: bcrypt.hashSync('vocero123', 10), // Contraseña por defecto
        rol: 'vocero',
        id_comunidad_asignada: id_comunidad_asignada
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

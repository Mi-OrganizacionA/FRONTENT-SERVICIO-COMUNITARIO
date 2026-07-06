let Usuario;

module.exports = {
  setModel: (model) => { Usuario = model; },

  getAll: async (req, res, next) => {
    try {
      const ConsejoComunal = Usuario.sequelize?.models?.ConsejoComunal;
      const include = ConsejoComunal ? [{ model: ConsejoComunal, as: 'consejo', attributes: ['id', 'nombre_comunidad'] }] : [];
      const data = await Usuario.findAll({
        where: { rol: 'vocero' },
        attributes: { exclude: ['credenciales'] },
        include
      });
      res.json(data);
    } catch (error) { next(error); }
  },

  create: async (req, res, next) => {
    try {
      if (req.user?.rol !== 'admin') {
        // Un no-admin no puede crear voceros directamente
        return res.status(403).json({
          error: 'Solo el administrador puede registrar voceros directamente.'
        });
      }

      const bcrypt = require('bcryptjs');
      const ConsejoComunal = Usuario.sequelize.models.ConsejoComunal;
      let id_comunidad_asignada = req.body.comunidad_id || null;

      if (!id_comunidad_asignada && req.body.comunidad && ConsejoComunal) {
        const consejo = await ConsejoComunal.findOne({ where: { nombre_comunidad: req.body.comunidad } });
        if (consejo) id_comunidad_asignada = consejo.id;
      }

      // Verificar si ya existe un usuario con esa cédula o correo
      const { Op } = require('sequelize');
      const existente = await Usuario.findOne({
        where: {
          [Op.or]: [
            { cedula: req.body.cedula },
            { email: req.body.email }
          ]
        }
      });
      if (existente) {
        return res.status(409).json({ error: 'Ya existe un usuario con esa cédula o correo electrónico.' });
      }

      const passwordPlano = req.body.password || 'vocero123';
      const data = await Usuario.create({
        nombre: req.body.nombre || `Vocero ${req.body.cedula}`,
        email: req.body.email || `vocero_${req.body.cedula}@sicag.com`,
        telefono: req.body.telefono || null,
        cedula: req.body.cedula,
        credenciales: bcrypt.hashSync(passwordPlano, 10),
        rol: 'vocero',
        activo: true,
        id_comunidad_asignada: id_comunidad_asignada
      });
      
      // No devolver credenciales en la respuesta
      const resultado = data.toJSON();
      delete resultado.credenciales;
      res.status(201).json(resultado);
    } catch (error) { next(error); }
  },

  update: async (req, res, next) => {
    try {
      if (req.user?.rol !== 'admin') {
        return res.status(403).json({
          error: 'Solo el administrador puede modificar voceros.'
        });
      }

      const bcrypt = require('bcryptjs');
      const vocero = await Usuario.findByPk(req.params.id);
      if (!vocero || vocero.rol !== 'vocero') {
        return res.status(404).json({ error: 'Vocero no encontrado' });
      }

      const ConsejoComunal = Usuario.sequelize?.models?.ConsejoComunal;
      let id_comunidad_asignada = vocero.id_comunidad_asignada;

      if (req.body.comunidad !== undefined) {
        if (req.body.comunidad === null || req.body.comunidad === '') {
          id_comunidad_asignada = null;
        } else if (ConsejoComunal) {
          const consejo = await ConsejoComunal.findOne({ where: { nombre_comunidad: req.body.comunidad } });
          if (consejo) id_comunidad_asignada = consejo.id;
        }
      }

      // Actualizar campos permitidos
      if (req.body.email !== undefined) vocero.email = req.body.email;
      if (req.body.telefono !== undefined) vocero.telefono = req.body.telefono;
      if (req.body.activo !== undefined) vocero.activo = req.body.activo;
      if (req.body.password) vocero.credenciales = bcrypt.hashSync(req.body.password, 10);
      vocero.id_comunidad_asignada = id_comunidad_asignada;

      await vocero.save();
      
      const resultado = vocero.toJSON();
      delete resultado.credenciales;
      res.json(resultado);
    } catch (error) { next(error); }
  },

  remove: async (req, res, next) => {
    try {
      const data = await Usuario.findByPk(req.params.id);
      if (!data || data.rol !== 'vocero') return res.status(404).json({ error: 'Vocero no encontrado' });
      
      // Eliminar registros dependientes en bandeja_validaciones y log_auditoria
      const Bandeja = Usuario.sequelize.models.BandejaValidacion;
      const Log = Usuario.sequelize.models.LogAuditoria;
      
      if (Bandeja) await Bandeja.destroy({ where: { id_vocero: req.params.id } });
      if (Log) await Log.destroy({ where: { id_usuario: req.params.id } });
      
      await data.destroy();
      res.json({ success: true });
    } catch (error) { next(error); }
  }
};

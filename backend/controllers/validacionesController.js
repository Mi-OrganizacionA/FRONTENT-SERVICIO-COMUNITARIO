let BandejaValidaciones;

module.exports = {
  setModel: (model) => { BandejaValidaciones = model; },

  getAll: async (req, res, next) => {
    try {
      const data = await BandejaValidaciones.findAll();
      // Mapear al formato esperado por el frontend
      const formatData = data.map(v => {
        const temp = v.datos_temporales || {};
        return {
          id: v.id,
          tipo: v.tipo_accion,
          titulo: temp.titulo || 'Solicitud de Validación',
          mensaje: temp.mensaje || '',
          status: v.estado_tramite,
          vocero: temp.vocero || '',
          consejoComunal: temp.consejoComunal || '',
          fechaSolicitud: v.fecha_solicitud || new Date().toISOString(),
          datosHabitante: temp.datosHabitante || {},
          nota: v.comentarios_validador || ''
        };
      });
      res.json(formatData);
    } catch (error) { next(error); }
  },

  create: async (req, res, next) => {
    try {
      const { tipo, titulo, mensaje, status, vocero, consejoComunal, fechaSolicitud, datosHabitante, nota } = req.body;
      const data = await BandejaValidaciones.create({
        tipo_accion: tipo || 'registro_habitante',
        estado_tramite: status || 'pendiente',
        comentarios_validador: nota || '',
        fecha_solicitud: fechaSolicitud || new Date(),
        datos_temporales: { titulo, mensaje, vocero, consejoComunal, datosHabitante }
      });
      res.status(201).json({ id: data.id, ...req.body });
    } catch (error) { next(error); }
  },

  update: async (req, res, next) => {
    try {
      const data = await BandejaValidaciones.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: 'Notificación no encontrada' });
      
      const updateData = {};
      if (req.body.status) updateData.estado_tramite = req.body.status;
      if (req.body.nota !== undefined) updateData.comentarios_validador = req.body.nota;
      if (req.body.status !== 'pendiente') updateData.fecha_validacion = new Date();

      await data.update(updateData);
      
      res.json({ id: data.id, status: data.estado_tramite, nota: data.comentarios_validador });
    } catch (error) { next(error); }
  }
};

const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
let HabitanteModel = null;

class HabitantesController {
  static async getAll(req, res) {
    try {
      const { consejo_id, clasificacion, elector, nombre } = req.query;
      let where = { activo: true };
      if (req.user.rol === 'vocero') {
        where.consejo_comunal_id = req.user.consejo_comunal_id;
      } else if (consejo_id) {
        where.consejo_comunal_id = consejo_id;
      }
      if (clasificacion) where.clasificacion = clasificacion;
      if (elector !== undefined) where.elector = elector === 'true';
      if (nombre) {
        where[require('sequelize').Op.or] = [
          { nombre: { [require('sequelize').Op.iLike]: `%${nombre}%` } },
          { cedula: nombre }
        ];
      }
      const habitantes = await HabitanteModel.findAll({ where, order: [['nombre','ASC']], limit: 100 });
      res.json(habitantes);
    } catch (error) {
      logger.error('Error obteniendo habitantes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const habitante = await HabitanteModel.findByPk(id);
      if (!habitante) return res.status(404).json({ error: 'Habitante no encontrado' });
      res.json(habitante);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { cedula, nombre, apellido, consejo_comunal_id, ...data } = req.body;
      const existe = await HabitanteModel.findOne({ where: { cedula } });
      if (existe) return res.status(400).json({ error: 'Cédula ya registrada' });
      const habitante = await HabitanteModel.create({ cedula, nombre, apellido, consejo_comunal_id, ...data, fecha_registro: new Date() });
      await AuditService.log(req.user.id, 'CREATE', 'habitantes', habitante.id, null, habitante);
      res.status(201).json(habitante);
    } catch (error) {
      logger.error('Error creando habitante:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const habitante = await HabitanteModel.findByPk(id);
      if (!habitante) return res.status(404).json({ error: 'Habitante no encontrado' });
      const datosAntiguos = habitante.toJSON();
      await habitante.update(req.body);
      const datosNuevos = habitante.toJSON();
      await AuditService.log(req.user.id, 'UPDATE', 'habitantes', id, datosAntiguos, datosNuevos);
      res.json(habitante);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const habitante = await HabitanteModel.findByPk(id);
      if (!habitante) return res.status(404).json({ error: 'Habitante no encontrado' });
      await habitante.update({ activo: false });
      await AuditService.log(req.user.id, 'DELETE', 'habitantes', id, habitante.toJSON(), null);
      res.json({ mensaje: 'Habitante eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPublico(req, res) {
    try {
      const { consejo_id } = req.params;
      const { cedula, nombre } = req.query;
      let where = { activo: true, consejo_comunal_id: consejo_id };
      if (cedula) where.cedula = cedula;
      if (nombre) {
        where[require('sequelize').Op.or] = [ { nombre: { [require('sequelize').Op.iLike]: `%${nombre}%` } } ];
      }
      const habitantes = await HabitanteModel.findAll({ where, attributes: { exclude: ['direccion','email','telefono','foto_cedula_url'] }, limit: 10 });
      res.json(habitantes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static setModel(model) { HabitanteModel = model; }
}

module.exports = HabitantesController;

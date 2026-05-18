const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
const ReportesService = require('../services/reportesService');
let ReporteModel = null;

class ReportesController {
  static async getAll(req, res) {
    try {
      const filtros = {};
      if (req.query.consejo_id) filtros.consejo_comunal_id = req.query.consejo_id;
      const reportes = await ReportesService.list(ReporteModel, filtros);
      res.json(reportes);
    } catch (error) {
      logger.error('Error obteniendo reportes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const reporte = await ReportesService.getById(ReporteModel, req.params.id);
      if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
      res.json(reporte);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const reporte = await ReportesService.create(ReporteModel, req.body);
      await AuditService.log(req.user.id, 'CREATE', 'reportes', reporte.id, null, reporte);
      res.status(201).json(reporte);
    } catch (error) {
      logger.error('Error creando reporte:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const reporte = await ReportesService.update(ReporteModel, req.params.id, req.body);
      if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
      await AuditService.log(req.user.id, 'UPDATE', 'reportes', req.params.id, null, reporte);
      res.json(reporte);
    } catch (error) {
      logger.error('Error actualizando reporte:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const reporte = await ReportesService.remove(ReporteModel, req.params.id);
      if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
      await AuditService.log(req.user.id, 'DELETE', 'reportes', req.params.id, reporte, null);
      res.json({ mensaje: 'Reporte eliminado' });
    } catch (error) {
      logger.error('Error eliminando reporte:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static setModel(model) { ReporteModel = model; }
}

module.exports = ReportesController;

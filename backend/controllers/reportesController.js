const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
const ReportesService = require('../services/reportesService');
let ReporteModel = null;

class ReportesController {
  static async getAll(req, res) {
    try {
      const filtros = {};
      if (req.query.consejo_id) filtros.consejo_comunal_id = req.query.consejo_id;
      // Si es vocero, forzar filtro a su comunidad asignada (aislamiento de datos)
      if (req.user?.rol === 'vocero' && req.user.id_comunidad_asignada) {
        filtros.consejo_comunal_id = req.user.id_comunidad_asignada;
      }
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
      const { id_comunidad, ...data } = req.body;
      const Configuracion = ReporteModel.sequelize.models.Configuracion;
      const BandejaValidaciones = ReporteModel.sequelize.models.BandejaValidaciones;

      // Lógica de aprobación: aplica a todos los reportes de voceros,
      // no solo a los inter-comunales
      if (req.user?.rol === 'vocero') {
        const config = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Reportes' } });
        const globalConfig = await Configuracion.findOne({ where: { clave: 'Aprobación Automática Global' } });
        const autoApprove = (globalConfig?.valor === 'true') || (config?.valor === 'true');

        if (!autoApprove) {
          await BandejaValidaciones.create({
            id_vocero: req.user.id,
            tabla_afectada: 'reportes',
            tipo_accion: 'CREATE',
            datos_temporales: req.body,
            estado_tramite: 'Pendiente'
          });
          return res.status(202).json({ mensaje: 'Solicitud de reporte enviada a la bandeja de validaciones del administrador.' });
        }
      }

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

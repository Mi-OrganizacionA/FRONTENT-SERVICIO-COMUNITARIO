const logger = require('../utils/logger');
const AuditService = require('../services/auditService');

class AuditController {
  
  // Obtener logs de auditoría (admin only)
  static async getLogs(req, res) {
    try {
      const { userId, action, table, recordId, startDate, endDate, limit = 100, offset = 0 } = req.query;

      const filters = {};
      if (userId) filters.userId = parseInt(userId);
      if (action) filters.action = action;
      if (table) filters.table = table;
      if (recordId) filters.recordId = parseInt(recordId);
      if (startDate || endDate) {
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);
      }

      const logs = await AuditService.getLogs(filters, Math.min(parseInt(limit), 500), parseInt(offset));
      res.json(logs);
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener resumen de actividad
  static async getResumen(req, res) {
    try {
      // En una implementación real, esto sería una consulta agregada
      const resumenes = {
        mensaje: 'Resumen de auditoría disponible mediante análisis de logs'
      };
      res.json(resumenes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Exportar logs a CSV (admin only)
  static async exportLogs(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const filters = {};
      if (startDate || endDate) {
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);
      }

      const logs = await AuditService.getLogs(filters, 10000, 0);
      
      // Generar CSV
      let csv = 'ID,Usuario,Acción,Tabla,Registro,Fecha,IP,Navegador\n';
      logs.forEach(log => {
        csv += `${log.id},${log.id_usuario},"${log.accion}","${log.tabla_afectada}",${log.registro_id},"${log.fecha}","${log.ip_address}","${log.user_agent}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      res.send(csv);
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Limpiar logs antiguos (admin only)
  static async cleanOldLogs(req, res) {
    try {
      const { monthsOld = 24 } = req.body;

      const deleted = await AuditService.cleanOldLogs(parseInt(monthsOld));
      
      res.json({
        mensaje: `Se eliminaron ${deleted} registros de auditoría con antigüedad mayor a ${monthsOld} meses`
      });
    } catch (error) {
      logger.error('Error cleaning audit logs:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuditController;

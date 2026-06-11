const logger = require('../utils/logger');
let LogAuditoriaModel = null;

class AuditService {
  static setModel(model) {
    LogAuditoriaModel = model;
  }

  static async log(userId, action, tableAffected, recordId, changesBefore = null, changesAfter = null, ipAddress = null, userAgent = null) {
    try {
      if (!LogAuditoriaModel) {
        logger.warn('LogAuditoria model not initialized, logging to console only');
        this._logToConsole(userId, action, tableAffected, recordId, changesBefore, changesAfter);
        return;
      }

      const currentDate = new Date();
      const mesAno = currentDate.toISOString().substring(0, 7); // Formato YYYY-MM

      const logEntry = await LogAuditoriaModel.create({
        id_usuario: userId,
        accion: action,
        tabla_afectada: tableAffected,
        registro_id: recordId,
        cambios_antes: changesBefore,
        cambios_despues: changesAfter,
        ip_address: ipAddress || 'UNKNOWN',
        user_agent: userAgent || 'UNKNOWN',
        mes_ano: mesAno
      });

      logger.info(`[AUDIT] ${action} on ${tableAffected}:${recordId} by user ${userId}`);
      return logEntry;
    } catch (error) {
      logger.error('[AUDIT ERROR]', error);
      // No lanzar error para no bloquear operaciones normales
      this._logToConsole(userId, action, tableAffected, recordId, changesBefore, changesAfter);
    }
  }

  static _logToConsole(userId, action, tableAffected, recordId, changesBefore, changesAfter) {
    const entry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      tableAffected,
      recordId,
      before: changesBefore,
      after: changesAfter
    };
    logger.info('[AUDIT-CONSOLE] ' + JSON.stringify(entry));
  }

  static async getLogs(filters = {}, limit = 100, offset = 0) {
    try {
      if (!LogAuditoriaModel) return [];
      
      const where = {};
      if (filters.userId) where.id_usuario = filters.userId;
      if (filters.action) where.accion = filters.action;
      if (filters.table) where.tabla_afectada = filters.table;
      if (filters.recordId) where.registro_id = filters.recordId;
      if (filters.startDate && filters.endDate) {
        where.fecha = {
          [require('sequelize').Op.between]: [filters.startDate, filters.endDate]
        };
      }

      const logs = await LogAuditoriaModel.findAll({
        where,
        limit,
        offset,
        order: [['fecha', 'DESC']]
      });

      return logs;
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      return [];
    }
  }

  static async cleanOldLogs(monthsOld = 24) {
    try {
      if (!LogAuditoriaModel) return 0;

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

      const deleted = await LogAuditoriaModel.destroy({
        where: {
          fecha: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      logger.info(`[AUDIT-CLEANUP] Deleted ${deleted} old logs older than ${monthsOld} months`);
      return deleted;
    } catch (error) {
      logger.error('Error cleaning old audit logs:', error);
      return 0;
    }
  }
}

module.exports = AuditService;

const logger = require('../utils/logger');

class AuditService {
  static async log(userId, action, resource, resourceId = null, before = null, after = null) {
    // Implementación simple: escribir en logs. En producción, persistir en BD.
    const entry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      resourceId,
      before,
      after
    };

    logger.info('[AUDIT] ' + JSON.stringify(entry));
    return entry;
  }
}

module.exports = AuditService;

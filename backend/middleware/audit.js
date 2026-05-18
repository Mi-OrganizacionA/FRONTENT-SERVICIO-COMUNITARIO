const AuditService = require('../services/auditService');

module.exports = async (req, res, next) => {
  res.on('finish', async () => {
    try {
      const userId = req.user?.id || null;
      await AuditService.log(userId, req.method, req.path, null, null, { status: res.statusCode });
    } catch (err) {
      // no bloquear petición por fallas en auditoría
    }
  });
  next();
};

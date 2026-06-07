const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Todos los endpoints de auditoría requieren ser admin
router.use(verifyToken, requireRole(['admin']));

// Obtener logs de auditoría con filtros
router.get('/logs', auditController.getLogs);

// Obtener resumen de actividad
router.get('/resumen', auditController.getResumen);

// Exportar logs a CSV
router.get('/export/csv', auditController.exportLogs);

// Limpiar logs antiguos
router.post('/mantenimiento/limpiar-antiguos', auditController.cleanOldLogs);

module.exports = router;

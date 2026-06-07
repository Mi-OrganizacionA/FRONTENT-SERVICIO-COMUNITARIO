const express = require('express');
const router = express.Router();
const CensoReportesController = require('../controllers/censoReportesController');

// Las rutas deben ir protegidas por authMiddleware si fuera un entorno 100% de prod, 
// pero por ahora para poder descargar mediante window.open() es preferible usar tokens en la URL 
// o mantener la ruta pública de lectura (solo datos anónimos estadísticos).

// Obtener KPIs generales del dashboard de reportes
router.get('/kpis', CensoReportesController.getKpis);

// Obtener la tabla de resumen detallado por consejo comunal
router.get('/resumen', CensoReportesController.getResumen);

// Exportar reportes (PDF / Excel)
router.get('/exportar', CensoReportesController.exportarReporte);

module.exports = router;

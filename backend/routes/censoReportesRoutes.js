const express = require('express');
const router = express.Router();
const CensoReportesController = require('../controllers/censoReportesController');
const { verifyToken } = require('../middleware/auth');

// Las rutas deben ir protegidas por authMiddleware si fuera un entorno 100% de prod, 
// pero por ahora para poder descargar mediante window.open() es preferible usar tokens en la URL 
// o mantener la ruta pública de lectura (solo datos anónimos estadísticos).
// ACTUALIZADO: Ya que se implementó el paso del token por query string, podemos protegerlas.

// Obtener la fecha del primer registro del sistema
router.get('/fecha-minima', verifyToken, CensoReportesController.getFechaMinima);

// Obtener KPIs generales del dashboard de reportes
router.get('/kpis', verifyToken, CensoReportesController.getKpis);

// Obtener la tabla de resumen detallado por consejo comunal
router.get('/resumen', verifyToken, CensoReportesController.getResumen);

// Exportar reportes (PDF / Excel)
router.get('/exportar', verifyToken, CensoReportesController.exportarReporte);

module.exports = router;

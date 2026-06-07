const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccionAgricolaController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { idParamSchema, produccionAgricolaSchema } = require('../utils/validators');

// Obtener todas las producciones
router.get('/', verifyToken, produccionController.getAll);

// Obtener estadísticas por consejo
router.get('/consejo/:consejoId', verifyToken, requireRole(['admin']), produccionController.getEstadisticasPorConsejo);

// Obtener producciones por habitante
router.get('/habitante/:habitanteId', verifyToken, produccionController.getPorHabitante);

// Obtener resumen de producción por habitante
router.get('/habitante/:habitanteId/resumen', verifyToken, produccionController.getResumenPorHabitante);

// Obtener producciones por tipo de cultivo
router.get('/cultivo/:tipoCultivo', verifyToken, produccionController.getPorTipoCultivo);

// Obtener una producción
router.get('/:id', validate({ params: idParamSchema }), verifyToken, produccionController.getById);

// Crear nueva producción
router.post('/', validate({ body: produccionAgricolaSchema }), verifyToken, requireRole(['vocero', 'admin']), produccionController.crear);

// Actualizar producción
router.put('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero', 'admin']), produccionController.actualizar);

// Eliminar producción (soft delete)
router.delete('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero', 'admin']), produccionController.eliminar);

module.exports = router;

const express = require('express');
const router = express.Router();
const habitantesController = require('../controllers/habitantesController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { habitanteCreateSchema, habitanteUpdateSchema, idParamSchema, paginationSchema } = require('../utils/validators');

// Endpoints públicos (portal web, sin autenticación)
router.get('/publico/buscar', habitantesController.buscarPublico);
router.get('/publico/:consejo_id', habitantesController.getPublico);

// Obtener todos los habitantes (con paginación y filtros)
router.get('/', validate({ query: paginationSchema }), verifyToken, habitantesController.getAll);

// Búsqueda rápida
router.get('/buscar/rapido', verifyToken, habitantesController.buscar);

// Endpoints por consejo
router.get('/consejo/:consejoId/todos', verifyToken, habitantesController.getPorConsejo);
router.get('/consejo/:consejoId/electores', verifyToken, habitantesController.getElectores);
router.get('/consejo/:consejoId/menores', verifyToken, habitantesController.getMenores);
router.get('/consejo/:consejoId/estadisticas', verifyToken, requireRole(['admin', 'vocero']), habitantesController.getEstadisticas);

// Obtener habitante por ID
router.get('/:id', validate({ params: idParamSchema }), verifyToken, habitantesController.getById);

// Crear habitante
router.post('/', validate({ body: habitanteCreateSchema }), verifyToken, requireRole(['vocero', 'admin']), habitantesController.create);

// Actualizar habitante
router.put('/:id', validate({ params: idParamSchema }), validate({ body: habitanteUpdateSchema }), verifyToken, requireRole(['vocero', 'admin']), habitantesController.update);

// Eliminar habitante (soft delete)
router.delete('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['admin']), habitantesController.delete);

module.exports = router;

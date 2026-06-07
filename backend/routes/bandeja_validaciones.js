const express = require('express');
const router = express.Router();
const bandejaValidacionesController = require('../controllers/bandejaValidacionesController');
const { verifyToken, requireRole, restrictToConsejo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { idParamSchema } = require('../utils/validators');

// Obtener validaciones pendientes (admin)
router.get('/pendientes', verifyToken, requireRole(['admin']), bandejaValidacionesController.getPendientes);

// Obtener validaciones del usuario actual (vocero)
router.get('/mis-solicitudes', verifyToken, bandejaValidacionesController.getPorUsuario);

// Crear nueva solicitud de validación
router.post('/', verifyToken, bandejaValidacionesController.crear);

// Obtener detalles de una validación
router.get('/:id', validate({ params: idParamSchema }), verifyToken, bandejaValidacionesController.getById);

// Aprobar validación (admin)
router.put('/:id/aprobar', validate({ params: idParamSchema }), verifyToken, requireRole(['admin']), bandejaValidacionesController.aprobar);

// Rechazar validación (admin)
router.put('/:id/rechazar', validate({ params: idParamSchema }), verifyToken, requireRole(['admin']), bandejaValidacionesController.rechazar);

module.exports = router;

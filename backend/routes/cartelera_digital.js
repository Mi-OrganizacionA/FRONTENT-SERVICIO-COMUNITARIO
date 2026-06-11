const express = require('express');
const router = express.Router();
const carteleraDigitalController = require('../controllers/carteleraDigitalController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { idParamSchema } = require('../utils/validators');

// Obtener publicaciones activas (público)
router.get('/publico/activas', carteleraDigitalController.getActivas);

// Obtener publicaciones por tipo (público)
router.get('/publico/tipo', carteleraDigitalController.getPorTipo);

// Obtener una publicación (público)
router.get('/publico/:id', validate({ params: idParamSchema }), carteleraDigitalController.getById);

// Crear nueva publicación (vocero/admin)
router.post('/', verifyToken, requireRole(['vocero', 'admin']), carteleraDigitalController.crear);

// Actualizar publicación (vocero/admin que la creó, o admin)
router.put('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero', 'admin']), carteleraDigitalController.actualizar);

// Eliminar publicación (vocero/admin que la creó, o admin)
router.delete('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero', 'admin']), carteleraDigitalController.eliminar);

module.exports = router;

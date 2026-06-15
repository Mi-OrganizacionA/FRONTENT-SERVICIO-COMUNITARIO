const express = require('express');
const router = express.Router();
const organizacionesController = require('../controllers/organizacionesController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, organizacionesController.getAll);
router.post('/', verifyToken, organizacionesController.create);
router.put('/:id', verifyToken, organizacionesController.update);
router.delete('/:id', verifyToken, organizacionesController.remove);

// Nuevas rutas
router.get('/consejo/:consejoId', verifyToken, organizacionesController.getPorConsejo);
router.get('/:id/miembros', verifyToken, organizacionesController.getMiembros);
router.get('/:id/estadisticas', verifyToken, organizacionesController.getEstadisticas);
router.post('/:id/miembros', verifyToken, organizacionesController.agregarMiembro);
router.put('/:id/miembros/:membresia_id', verifyToken, organizacionesController.removerMiembro);

module.exports = router;

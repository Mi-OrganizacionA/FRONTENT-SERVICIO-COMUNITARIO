const express = require('express');
const router = express.Router();
const organizacionesController = require('../controllers/organizacionesController');

router.get('/', organizacionesController.getAll);
router.post('/', organizacionesController.create);
router.put('/:id', organizacionesController.update);
router.delete('/:id', organizacionesController.remove);

// Nuevas rutas
router.get('/consejo/:consejoId', organizacionesController.getPorConsejo);
router.get('/:id/miembros', organizacionesController.getMiembros);
router.get('/:id/estadisticas', organizacionesController.getEstadisticas);
router.post('/:id/miembros', organizacionesController.agregarMiembro);
router.put('/:id/miembros/:membresia_id', organizacionesController.removerMiembro);

module.exports = router;

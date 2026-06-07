const express = require('express');
const router = express.Router();
const estudioDemograficoController = require('../controllers/estudioDemograficoController');
const { verifyToken, requireRole } = require('../middleware/auth');

// IMPORTANTE: Las rutas específicas deben ir ANTES que las rutas con parámetros dinámicos (:id)
// de lo contrario Express captura 'consejo' como un valor de :id
router.get('/consejo/:consejoId', verifyToken, estudioDemograficoController.getPorConsejo);

router.get('/', verifyToken, estudioDemograficoController.getAll);
router.get('/:id', verifyToken, estudioDemograficoController.getById);

router.post('/', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.crear);
router.put('/:id/finalizar', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.finalizar);
router.put('/:id', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.actualizar);
router.delete('/:id', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.eliminar);

module.exports = router;
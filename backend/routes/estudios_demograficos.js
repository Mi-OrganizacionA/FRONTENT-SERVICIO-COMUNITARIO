const express = require('express');
const router = express.Router();
const estudioDemograficoController = require('../controllers/estudioDemograficoController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, estudioDemograficoController.getAll);
router.get('/:id', verifyToken, estudioDemograficoController.getById);
router.get('/consejo/:consejoId', verifyToken, estudioDemograficoController.getPorConsejo);

router.post('/', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.crear);
router.put('/:id', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.actualizar);
router.put('/:id/finalizar', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.finalizar);
router.delete('/:id', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.eliminar);

module.exports = router;
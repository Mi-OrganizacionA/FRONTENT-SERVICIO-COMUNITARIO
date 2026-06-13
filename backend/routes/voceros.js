const express = require('express');
const router = express.Router();
const vocerosController = require('../controllers/vocerosController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Solo admin puede gestionar voceros
router.get('/',       verifyToken, requireRole(['admin']), vocerosController.getAll);
router.post('/',      verifyToken, requireRole(['admin']), vocerosController.create);
router.put('/:id',    verifyToken, requireRole(['admin']), vocerosController.update);
router.delete('/:id', verifyToken, requireRole(['admin']), vocerosController.remove);

module.exports = router;

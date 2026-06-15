const express = require('express');
const router = express.Router();
const viviendasController = require('../controllers/viviendasController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, viviendasController.getAll);
router.post('/', verifyToken, viviendasController.create);
router.put('/:id', verifyToken, viviendasController.update);
router.delete('/:id', verifyToken, viviendasController.remove);
router.get('/:id/exportar-pdf', verifyToken, viviendasController.exportarPdfCenso);

module.exports = router;

const express = require('express');
const router = express.Router();
const viviendasController = require('../controllers/viviendasController');

router.get('/', viviendasController.getAll);
router.post('/', viviendasController.create);
router.put('/:id', viviendasController.update);
router.delete('/:id', viviendasController.remove);
router.get('/:id/exportar-pdf', viviendasController.exportarPdfCenso);

module.exports = router;

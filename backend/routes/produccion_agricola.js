const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccionAgricolaController');

router.get('/', produccionController.getAll);
router.post('/', produccionController.create);
router.put('/:id', produccionController.update);
router.delete('/:id', produccionController.remove);

module.exports = router;

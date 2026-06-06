const express = require('express');
const router = express.Router();
const validacionesController = require('../controllers/validacionesController');

router.get('/', validacionesController.getAll);
router.post('/', validacionesController.create);
router.put('/:id', validacionesController.update);

module.exports = router;

const express = require('express');
const router = express.Router();
const organizacionesController = require('../controllers/organizacionesController');

router.get('/', organizacionesController.getAll);
router.post('/', organizacionesController.create);
router.put('/:id', organizacionesController.update);
router.delete('/:id', organizacionesController.remove);

module.exports = router;

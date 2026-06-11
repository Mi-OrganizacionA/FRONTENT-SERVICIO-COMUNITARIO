const express = require('express');
const router = express.Router();
const vocerosController = require('../controllers/vocerosController');

router.get('/', vocerosController.getAll);
router.post('/', vocerosController.create);
router.delete('/:id', vocerosController.remove);

module.exports = router;

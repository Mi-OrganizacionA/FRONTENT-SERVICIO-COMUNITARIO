const express = require('express');
const router = express.Router();
const votacionesController = require('../controllers/votacionesController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { votacionSchema, idParamSchema, consejoParamSchema, votacionParamSchema, paginationSchema } = require('../utils/validators');

router.get('/abiertas/:consejo_id', validate({ params: consejoParamSchema }), votacionesController.getAbiertas);
router.post('/:votacion_id/votar', validate({ params: votacionParamSchema }), verifyToken, votacionesController.registrarVoto);
router.get('/', validate({ query: paginationSchema }), verifyToken, votacionesController.getAll);
router.post('/', verifyToken, requireRole(['vocero']), validate(votacionSchema), votacionesController.create);
router.get('/:id/resultado', validate({ params: idParamSchema }), votacionesController.getResultado);

module.exports = router;

const express = require('express');
const router = express.Router();
const proyectosController = require('../controllers/proyectosController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { proyectoSchema, idParamSchema, paginationSchema } = require('../utils/validators');

router.get('/', validate({ query: paginationSchema }), verifyToken, proyectosController.getAll);
router.get('/:id', validate({ params: idParamSchema }), verifyToken, proyectosController.getById);
router.post('/', verifyToken, requireRole(['vocero','admin']), validate(proyectoSchema), proyectosController.create);
router.put('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero','admin']), validate(proyectoSchema), proyectosController.update);
router.delete('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['admin']), proyectosController.delete);

module.exports = router;

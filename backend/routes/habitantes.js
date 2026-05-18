const express = require('express');
const router = express.Router();
const habitantesController = require('../controllers/habitantesController');
const { verifyToken, requireRole, restrictToConsejo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { habitanteCreateSchema, habitanteUpdateSchema, idParamSchema, consejoParamSchema, paginationSchema } = require('../utils/validators');

router.get('/publico/:consejo_id', validate({ params: consejoParamSchema }), habitantesController.getPublico);
router.get('/', validate({ query: paginationSchema }), verifyToken, habitantesController.getAll);
router.get('/:id', validate({ params: idParamSchema }), verifyToken, restrictToConsejo('consejo_id'), habitantesController.getById);
router.post('/', verifyToken, requireRole(['vocero']), validate(habitanteCreateSchema), habitantesController.create);
router.put('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero']), restrictToConsejo('consejo_id'), validate(habitanteUpdateSchema), habitantesController.update);
router.delete('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['admin']), habitantesController.delete);

module.exports = router;

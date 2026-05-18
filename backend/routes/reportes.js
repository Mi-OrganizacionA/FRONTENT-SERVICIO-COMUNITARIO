const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { reporteSchema, idParamSchema, paginationSchema } = require('../utils/validators');

router.get('/', validate({ query: paginationSchema }), verifyToken, reportesController.getAll);
router.get('/:id', validate({ params: idParamSchema }), verifyToken, reportesController.getById);
router.post('/', verifyToken, requireRole(['vocero','admin']), validate(reporteSchema), reportesController.create);
router.put('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero','admin']), validate(reporteSchema), reportesController.update);
router.delete('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['admin']), reportesController.delete);

module.exports = router;

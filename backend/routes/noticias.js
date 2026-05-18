const express = require('express');
const router = express.Router();
const noticiasController = require('../controllers/noticiasController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { noticiaSchema, idParamSchema, paginationSchema } = require('../utils/validators');

router.get('/', validate({ query: paginationSchema }), noticiasController.getAll);
router.get('/:id', validate({ params: idParamSchema }), noticiasController.getById);
router.post('/', verifyToken, requireRole(['vocero','admin']), validate(noticiaSchema), noticiasController.create);
router.put('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero','admin']), validate(noticiaSchema), noticiasController.update);
router.delete('/:id', validate({ params: idParamSchema }), verifyToken, requireRole(['admin']), noticiasController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const estudioDemograficoController = require('../controllers/estudioDemograficoController');
const { verifyToken, requireRole } = require('../middleware/auth');

// IMPORTANTE: Las rutas específicas deben ir ANTES que las rutas con parámetros dinámicos (:id)
// de lo contrario Express captura 'consejo' como un valor de :id
router.get('/consejo/:consejoId', verifyToken, estudioDemograficoController.getPorConsejo);

router.get('/verificar-habitante/:cedula', verifyToken, estudioDemograficoController.verificarHabitanteCensado);

router.get('/', verifyToken, estudioDemograficoController.getAll);
router.get('/:id', verifyToken, estudioDemograficoController.getById);

router.post('/paso', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.guardarPaso);

router.post('/', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.crear);
router.put('/:id/finalizar', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.finalizar);
router.put('/:id', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.actualizar);
router.delete('/:id', verifyToken, requireRole(['vocero', 'admin']), estudioDemograficoController.eliminar);

// Exportar PDF del censo completo
// El token puede venir como query param (?token=...) para soportar window.open()
router.get('/:id/exportar-pdf',
  (req, res, next) => {
    // Inyectar token desde query param al header si no viene en Authorization
    if (req.query.token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
  },
  verifyToken,
  estudioDemograficoController.exportarPdf
);

module.exports = router;
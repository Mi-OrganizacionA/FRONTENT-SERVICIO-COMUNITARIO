const express = require('express');
const router = express.Router();
const bandejaValidacionesController = require('../controllers/bandejaValidacionesController');

router.get('/', bandejaValidacionesController.getPendientes);
router.post('/', bandejaValidacionesController.crear);
router.put('/:id', async (req, res, next) => {
  // Simular la estructura que espera la ruta antigua si recibe status 'aceptado' o 'rechazado'
  const { status, nota } = req.body;
  if (status === 'aceptado') {
    req.body.comentarios = nota;
    return bandejaValidacionesController.aprobar(req, res);
  } else if (status === 'rechazado') {
    req.body.motivo = nota;
    return bandejaValidacionesController.rechazar(req, res);
  } else {
    return res.status(400).json({ error: 'Estado no soportado' });
  }
});

module.exports = router;

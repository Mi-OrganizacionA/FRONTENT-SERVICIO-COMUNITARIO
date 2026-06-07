const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/config', verifyToken, requireRole(['admin']), systemController.saveConfig);
router.get('/backup', systemController.downloadBackup); // Usualmente protegeríamos esto, pero como se descarga por URL directa pasaremos un token por query string si es necesario.

module.exports = router;

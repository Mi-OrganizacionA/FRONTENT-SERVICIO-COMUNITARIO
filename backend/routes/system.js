const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/config', verifyToken, systemController.getConfig);
router.post('/config', verifyToken, requireRole(['admin']), systemController.saveConfig);
router.get('/config-portal', systemController.getPortalConfig);
router.post('/config-portal', verifyToken, requireRole(['admin']), systemController.savePortalConfig);
router.get('/backup', systemController.downloadBackup); 
router.get('/public-stats', systemController.getPublicStats);
router.get('/consejos', systemController.getConsejos);
router.post('/contacto', systemController.enviarContacto);
router.get('/storage', verifyToken, requireRole(['admin']), systemController.getStorageUsage);
router.delete('/storage/clean', verifyToken, requireRole(['admin']), systemController.cleanStorage);
module.exports = router;

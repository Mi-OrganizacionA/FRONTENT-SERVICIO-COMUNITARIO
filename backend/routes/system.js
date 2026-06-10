const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/config', verifyToken, systemController.getConfig);
router.post('/config', verifyToken, requireRole(['admin']), systemController.saveConfig);
router.get('/backup', systemController.downloadBackup); 
router.get('/public-stats', systemController.getPublicStats);

module.exports = router;

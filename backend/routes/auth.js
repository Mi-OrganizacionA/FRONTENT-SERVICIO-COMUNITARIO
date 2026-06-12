const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authLoginSchema } = require('../utils/validators');

router.post('/login', validate(authLoginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);
router.get('/perfil', verifyToken, authController.getPerfil);
router.post('/verify-password', verifyToken, authController.verifyPassword);
router.put('/password', verifyToken, authController.changePassword);
router.put('/email', verifyToken, authController.changeEmail);

router.post('/request-code', authController.requestCode);
router.post('/reset-password', authController.resetPasswordWithCode);

module.exports = router;

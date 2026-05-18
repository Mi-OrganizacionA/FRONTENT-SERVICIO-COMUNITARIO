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

module.exports = router;

const express = require('express');
const router = express.Router();
const personaGrupoSocialController = require('../controllers/personaGrupoSocialController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { idParamSchema } = require('../utils/validators');

// Obtener membresías de un habitante
router.get('/habitante/:habitanteId', verifyToken, personaGrupoSocialController.getMembresiasPorHabitante);

// Obtener miembros de una organización
router.get('/organizacion/:organizacionId', verifyToken, personaGrupoSocialController.getMiembrosOrganizacion);

// Obtener detalles de una membresía
router.get('/:id', validate({ params: idParamSchema }), verifyToken, personaGrupoSocialController.getById);

// Agregar persona a organización
router.post('/', verifyToken, requireRole(['vocero', 'admin']), personaGrupoSocialController.agregarMiembro);

// Actualizar rol
router.put('/:id/rol', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero', 'admin']), personaGrupoSocialController.actualizarRol);

// Remover persona de organización
router.put('/:id/salida', validate({ params: idParamSchema }), verifyToken, requireRole(['vocero', 'admin']), personaGrupoSocialController.removerMiembro);

module.exports = router;

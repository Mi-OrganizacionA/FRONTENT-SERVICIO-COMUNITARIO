const logger = require('../utils/logger');
const AuditService = require('../services/auditService');
let PersonaGrupoSocialModel = null;

class PersonaGrupoSocialController {
  static setModel(model) {
    PersonaGrupoSocialModel = model;
  }

  // Obtener membresías de una persona
  static async getMembresiasPorHabitante(req, res) {
    try {
      const { habitanteId } = req.params;
      
      const membresias = await PersonaGrupoSocialModel.findAll({
        where: { id_habitante: habitanteId },
        include: ['Organizacion'],
        order: [['fecha_incorporacion', 'DESC']]
      });

      res.json({
        total: membresias.length,
        membresias
      });
    } catch (error) {
      logger.error('Error obteniendo membresías:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener miembros de una organización
  static async getMiembrosOrganizacion(req, res) {
    try {
      const { organizacionId } = req.params;

      const miembros = await PersonaGrupoSocialModel.findAll({
        where: { id_organizacion: organizacionId },
        include: ['Habitante'],
        order: [['fecha_incorporacion', 'DESC']]
      });

      res.json({
        total: miembros.length,
        miembros
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Agregar persona a organización
  static async agregarMiembro(req, res) {
    try {
      const { id_habitante, id_organizacion, rol_en_grupo } = req.body;

      if (!id_habitante || !id_organizacion || !rol_en_grupo) {
        return res.status(400).json({ 
          error: 'Se requieren: id_habitante, id_organizacion, rol_en_grupo' 
        });
      }

      // Verificar que no exista membresía activa
      const existente = await PersonaGrupoSocialModel.findOne({
        where: { 
          id_habitante, 
          id_organizacion,
          fecha_salida: null // Solo activas (sin fecha de salida)
        }
      });

      if (existente) {
        return res.status(409).json({ error: 'La persona ya es miembro activo de esta organización' });
      }

      const miembro = await PersonaGrupoSocialModel.create({
        id_habitante,
        id_organizacion,
        rol_en_grupo,
        fecha_incorporacion: new Date()
      });

      await AuditService.log(req.user.id, 'CREATE', 'persona_grupo_social', miembro.id, null, miembro.toJSON());

      res.status(201).json({
        mensaje: 'Persona agregada a la organización exitosamente',
        miembro
      });
    } catch (error) {
      logger.error('Error agregando miembro:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Actualizar rol de persona en organización
  static async actualizarRol(req, res) {
    try {
      const { id } = req.params;
      const { rol_en_grupo } = req.body;

      if (!rol_en_grupo) {
        return res.status(400).json({ error: 'Se requiere el nuevo rol' });
      }

      const miembro = await PersonaGrupoSocialModel.findByPk(id);
      if (!miembro) return res.status(404).json({ error: 'Membresía no encontrada' });

      const datosAntiguos = miembro.toJSON();
      await miembro.update({ rol_en_grupo });

      await AuditService.log(req.user.id, 'UPDATE', 'persona_grupo_social', id, datosAntiguos, miembro.toJSON());

      res.json({
        mensaje: 'Rol actualizado',
        miembro
      });
    } catch (error) {
      logger.error('Error actualizando rol:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Remover persona de organización (soft delete)
  static async removerMiembro(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const miembro = await PersonaGrupoSocialModel.findByPk(id);
      if (!miembro) return res.status(404).json({ error: 'Membresía no encontrada' });

      if (miembro.fecha_salida) {
        return res.status(409).json({ error: 'La persona ya no es miembro de esta organización' });
      }

      const datosAntiguos = miembro.toJSON();
      await miembro.update({
        fecha_salida: new Date(),
        motivo_salida: motivo || null
      });

      await AuditService.log(req.user.id, 'UPDATE', 'persona_grupo_social', id, datosAntiguos, miembro.toJSON());

      res.json({
        mensaje: 'Persona removida de la organización',
        miembro
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener detalles de una membresía
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const miembro = await PersonaGrupoSocialModel.findByPk(id, {
        include: ['Habitante', 'Organizacion']
      });
      
      if (!miembro) return res.status(404).json({ error: 'Membresía no encontrada' });
      res.json(miembro);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PersonaGrupoSocialController;

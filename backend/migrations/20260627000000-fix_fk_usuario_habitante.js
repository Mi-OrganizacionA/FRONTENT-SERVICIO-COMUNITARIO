'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Intentar eliminar la constraint huérfana en múltiples variantes de nombre
    const variantes = [
      'fk_usuario_habitante',
      'usuarios_habitante_id_fkey',
      'usuarios_cedula_fkey',
      'fk_usuarios_habitante',
    ];

    for (const nombre of variantes) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS "${nombre}";`
        );
        console.log(`[Migration] Constraint "${nombre}" eliminada (o no existía).`);
      } catch (e) {
        // Ignorar errores individuales: la constraint puede no existir
        console.warn(`[Migration] No se pudo eliminar "${nombre}":`, e.message);
      }
    }

    // Verificar que la columna 'cedula' en usuarios sea solo VARCHAR sin FK
    try {
      const tableInfo = await queryInterface.describeTable('usuarios');
      if (!tableInfo.cedula) {
        await queryInterface.addColumn('usuarios', 'cedula', {
          type: Sequelize.STRING(20),
          allowNull: true,
        });
        console.log('[Migration] Columna cedula añadida a usuarios.');
      } else {
        console.log('[Migration] Columna cedula ya existe en usuarios. Sin cambios.');
      }
    } catch (e) {
      console.warn('[Migration] Error verificando columna cedula:', e.message);
    }

    console.log('[Migration] fix_fk_usuario_habitante completada.');
  },

  down: async (queryInterface, Sequelize) => {
    // No se puede revertir la eliminación de una constraint huérfana de forma segura
    console.log('[Migration] Down: no-op (no se restaura la constraint huérfana).');
  },
};

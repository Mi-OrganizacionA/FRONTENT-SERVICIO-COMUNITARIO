'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('produccion_agricola');

    // Solo ejecutar si aún existe habitante_id (columna vieja)
    if (tableInfo.habitante_id) {
      // Copiar datos de habitante_id → id_habitante donde sea null
      await queryInterface.sequelize.query(`
        UPDATE produccion_agricola
        SET id_habitante = habitante_id
        WHERE id_habitante IS NULL AND habitante_id IS NOT NULL;
      `);

      // Eliminar la columna vieja
      await queryInterface.removeColumn('produccion_agricola', 'habitante_id');
      console.log('[Migration] produccion_agricola.habitante_id eliminada. Solo queda id_habitante.');
    } else {
      console.log('[Migration] produccion_agricola.habitante_id ya no existe. Sin cambios.');
    }

    // Insertar clave de configuración faltante
    await queryInterface.sequelize.query(`
      INSERT INTO configuracion (clave, valor, descripcion)
      VALUES ('Aprobación Automática Produccion', 'false', 'Auto aprobar registros de producción agrícola.')
      ON CONFLICT (clave) DO NOTHING;
    `);

    console.log('[Migration] fix_produccion_agricola_duplicate_column completada.');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-agregar habitante_id como alias de id_habitante (no crítico para rollback)
    const tableInfo = await queryInterface.describeTable('produccion_agricola');
    if (!tableInfo.habitante_id) {
      await queryInterface.addColumn('produccion_agricola', 'habitante_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'habitantes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },
};

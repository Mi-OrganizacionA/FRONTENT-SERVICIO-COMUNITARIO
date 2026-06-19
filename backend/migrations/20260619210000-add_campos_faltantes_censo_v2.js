'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── CensoSituacionVivienda ──
    const colsViv = await queryInterface.describeTable('censo_situacion_vivienda').catch(() => ({}));
    if (!colsViv.cantidad_banos)     await queryInterface.addColumn('censo_situacion_vivienda', 'cantidad_banos',     { type: Sequelize.INTEGER, defaultValue: 0 });
    if (!colsViv.ambientes_vivienda) await queryInterface.addColumn('censo_situacion_vivienda', 'ambientes_vivienda', { type: Sequelize.STRING(300), allowNull: true });
    
    // Eliminar cotiza_politica_habitacional
    if (colsViv.cotiza_politica_habitacional) {
      await queryInterface.removeColumn('censo_situacion_vivienda', 'cotiza_politica_habitacional');
    }

    // ── CensoServicios ──
    const colsSer = await queryInterface.describeTable('censo_servicios').catch(() => ({}));
    if (!colsSer.cantidad_cilindros_gas) await queryInterface.addColumn('censo_servicios', 'cantidad_cilindros_gas', { type: Sequelize.INTEGER, defaultValue: 0 });

    // ── CensoSalud ──
    const colsSal = await queryInterface.describeTable('censo_salud').catch(() => ({}));
    if (colsSal.exclusion_indigentes_cant)    await queryInterface.removeColumn('censo_salud', 'exclusion_indigentes_cant');
    if (colsSal.exclusion_enfermos_term_cant) await queryInterface.removeColumn('censo_salud', 'exclusion_enfermos_term_cant');
    if (colsSal.exclusion_otros)              await queryInterface.removeColumn('censo_salud', 'exclusion_otros');
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir CensoSituacionVivienda
    await queryInterface.removeColumn('censo_situacion_vivienda', 'cantidad_banos').catch(() => {});
    await queryInterface.removeColumn('censo_situacion_vivienda', 'ambientes_vivienda').catch(() => {});
    await queryInterface.addColumn('censo_situacion_vivienda', 'cotiza_politica_habitacional', { type: Sequelize.BOOLEAN, defaultValue: false }).catch(() => {});

    // Revertir CensoServicios
    await queryInterface.removeColumn('censo_servicios', 'cantidad_cilindros_gas').catch(() => {});

    // Revertir CensoSalud
    await queryInterface.addColumn('censo_salud', 'exclusion_indigentes_cant', { type: Sequelize.INTEGER, defaultValue: 0 }).catch(() => {});
    await queryInterface.addColumn('censo_salud', 'exclusion_enfermos_term_cant', { type: Sequelize.INTEGER, defaultValue: 0 }).catch(() => {});
    await queryInterface.addColumn('censo_salud', 'exclusion_otros', { type: Sequelize.TEXT, allowNull: true }).catch(() => {});
  }
};

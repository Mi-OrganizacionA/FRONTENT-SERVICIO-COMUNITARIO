'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfoVivienda = await queryInterface.describeTable('censo_situacion_vivienda').catch(() => ({}));
    const tableInfoServicios = await queryInterface.describeTable('censo_servicios').catch(() => ({}));
    const tableInfoPartComu = await queryInterface.describeTable('censo_participacion_comunitaria').catch(() => ({}));
    const tableInfoSitComu = await queryInterface.describeTable('censo_situacion_comunidad').catch(() => ({}));

    // censo_situacion_vivienda
    if (!tableInfoVivienda.cantidad_banos) {
      await queryInterface.addColumn('censo_situacion_vivienda', 'cantidad_banos', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }
    if (!tableInfoVivienda.ambientes_vivienda) {
      await queryInterface.addColumn('censo_situacion_vivienda', 'ambientes_vivienda', {
        type: Sequelize.STRING(300),
        allowNull: true
      });
    }

    // censo_servicios
    if (!tableInfoServicios.cantidad_cilindros_gas) {
      await queryInterface.addColumn('censo_servicios', 'cantidad_cilindros_gas', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }

    // censo_participacion_comunitaria
    if (!tableInfoPartComu.misiones) {
      await queryInterface.addColumn('censo_participacion_comunitaria', 'misiones', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
    }

    // censo_situacion_comunidad
    if (!tableInfoSitComu.observaciones) {
      await queryInterface.addColumn('censo_situacion_comunidad', 'observaciones', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfoVivienda = await queryInterface.describeTable('censo_situacion_vivienda').catch(() => ({}));
    const tableInfoServicios = await queryInterface.describeTable('censo_servicios').catch(() => ({}));
    const tableInfoPartComu = await queryInterface.describeTable('censo_participacion_comunitaria').catch(() => ({}));
    const tableInfoSitComu = await queryInterface.describeTable('censo_situacion_comunidad').catch(() => ({}));

    if (tableInfoVivienda.cantidad_banos) await queryInterface.removeColumn('censo_situacion_vivienda', 'cantidad_banos');
    if (tableInfoVivienda.ambientes_vivienda) await queryInterface.removeColumn('censo_situacion_vivienda', 'ambientes_vivienda');
    
    if (tableInfoServicios.cantidad_cilindros_gas) await queryInterface.removeColumn('censo_servicios', 'cantidad_cilindros_gas');
    
    if (tableInfoPartComu.misiones) await queryInterface.removeColumn('censo_participacion_comunitaria', 'misiones');
    
    if (tableInfoSitComu.observaciones) await queryInterface.removeColumn('censo_situacion_comunidad', 'observaciones');
  }
};

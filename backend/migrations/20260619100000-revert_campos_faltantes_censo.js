'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfoVivienda = await queryInterface.describeTable('censo_situacion_vivienda').catch(() => ({}));
    const tableInfoServicios = await queryInterface.describeTable('censo_servicios').catch(() => ({}));
    const tableInfoPartComu = await queryInterface.describeTable('censo_participacion_comunitaria').catch(() => ({}));
    const tableInfoSitComu = await queryInterface.describeTable('censo_situacion_comunidad').catch(() => ({}));

    if (tableInfoVivienda.cantidad_banos) await queryInterface.removeColumn('censo_situacion_vivienda', 'cantidad_banos');
    if (tableInfoVivienda.ambientes_vivienda) await queryInterface.removeColumn('censo_situacion_vivienda', 'ambientes_vivienda');
    
    if (tableInfoServicios.cantidad_cilindros_gas) await queryInterface.removeColumn('censo_servicios', 'cantidad_cilindros_gas');
    
    if (tableInfoPartComu.misiones) await queryInterface.removeColumn('censo_participacion_comunitaria', 'misiones');
    
    if (tableInfoSitComu.observaciones) await queryInterface.removeColumn('censo_situacion_comunidad', 'observaciones');
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse logic if needed in the future
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add ventas_de to censo_situacion_economica
    await queryInterface.addColumn('censo_situacion_economica', 'ventas_de', {
      type: Sequelize.STRING(255),
      allowNull: true
    }).catch(e => console.log('ventas_de ya existe o error', e.message));

    // Add mecanismos_informacion and servicios_comunales to censo_servicios
    await queryInterface.addColumn('censo_servicios', 'mecanismos_informacion', {
      type: Sequelize.STRING(300),
      allowNull: true
    }).catch(e => console.log('mecanismos_informacion ya existe o error', e.message));

    await queryInterface.addColumn('censo_servicios', 'servicios_comunales', {
      type: Sequelize.STRING(500),
      allowNull: true
    }).catch(e => console.log('servicios_comunales ya existe o error', e.message));

    // Add area_trabajo_interes to censo_participacion_comunitaria
    await queryInterface.addColumn('censo_participacion_comunitaria', 'area_trabajo_interes', {
      type: Sequelize.STRING(255),
      allowNull: true
    }).catch(e => console.log('area_trabajo_interes ya existe o error', e.message));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('censo_situacion_economica', 'ventas_de').catch(() => {});
    await queryInterface.removeColumn('censo_servicios', 'mecanismos_informacion').catch(() => {});
    await queryInterface.removeColumn('censo_servicios', 'servicios_comunales').catch(() => {});
    await queryInterface.removeColumn('censo_participacion_comunitaria', 'area_trabajo_interes').catch(() => {});
  }
};

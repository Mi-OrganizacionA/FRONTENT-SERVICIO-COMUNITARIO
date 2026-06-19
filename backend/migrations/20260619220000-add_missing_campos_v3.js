'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── CensoCaracteristicasFamiliar ──
    const colsFam = await queryInterface.describeTable('censo_caracteristicas_familiar').catch(() => ({}));
    if (!colsFam.discapacidad_tipo) await queryInterface.addColumn('censo_caracteristicas_familiar', 'discapacidad_tipo', { type: Sequelize.STRING(100), allowNull: true });

    // ── CensoSalud ──
    const colsSal = await queryInterface.describeTable('censo_salud').catch(() => ({}));
    if (!colsSal.exclusion_ninos_calle_cant) await queryInterface.addColumn('censo_salud', 'exclusion_ninos_calle_cant', { type: Sequelize.INTEGER, defaultValue: 0 });
    if (!colsSal.exclusion_discapacitados_cant) await queryInterface.addColumn('censo_salud', 'exclusion_discapacitados_cant', { type: Sequelize.INTEGER, defaultValue: 0 });
    if (!colsSal.exclusion_tercera_edad_cant) await queryInterface.addColumn('censo_salud', 'exclusion_tercera_edad_cant', { type: Sequelize.INTEGER, defaultValue: 0 });

    // ── CensoParticipacionComunitaria ──
    const colsPar = await queryInterface.describeTable('censo_participacion_comunitaria').catch(() => ({}));
    if (!colsPar.acuerdo_pueblo_protagonismo_presupuesto) await queryInterface.addColumn('censo_participacion_comunitaria', 'acuerdo_pueblo_protagonismo_presupuesto', { type: Sequelize.BOOLEAN, defaultValue: false });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'discapacidad_tipo').catch(() => {});
    await queryInterface.removeColumn('censo_salud', 'exclusion_ninos_calle_cant').catch(() => {});
    await queryInterface.removeColumn('censo_salud', 'exclusion_discapacitados_cant').catch(() => {});
    await queryInterface.removeColumn('censo_salud', 'exclusion_tercera_edad_cant').catch(() => {});
    await queryInterface.removeColumn('censo_participacion_comunitaria', 'acuerdo_pueblo_protagonismo_presupuesto').catch(() => {});
  }
};

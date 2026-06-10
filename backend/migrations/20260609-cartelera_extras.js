'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('cartelera_digital');
    if (!table.enlace_extra) {
      await queryInterface.addColumn('cartelera_digital', 'enlace_extra', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!table.fecha_cierre) {
      await queryInterface.addColumn('cartelera_digital', 'fecha_cierre', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!table.destacada) {
      await queryInterface.addColumn('cartelera_digital', 'destacada', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cartelera_digital', 'enlace_extra').catch(() => {});
    await queryInterface.removeColumn('cartelera_digital', 'fecha_cierre').catch(() => {});
    await queryInterface.removeColumn('cartelera_digital', 'destacada').catch(() => {});
  }
};

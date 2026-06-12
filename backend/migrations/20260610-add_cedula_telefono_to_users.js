module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('usuarios');
    if (!tableInfo.telefono) {
      await queryInterface.addColumn('usuarios', 'telefono', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!tableInfo.cedula) {
      await queryInterface.addColumn('usuarios', 'cedula', { type: Sequelize.STRING(20), allowNull: true });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('usuarios', 'telefono');
    await queryInterface.removeColumn('usuarios', 'cedula');
  }
};

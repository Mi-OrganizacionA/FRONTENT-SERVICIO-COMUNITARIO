module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('usuarios');
    if (!tableInfo.codigo_verificacion) {
      await queryInterface.addColumn('usuarios', 'codigo_verificacion', { type: Sequelize.STRING(10), allowNull: true });
    }
    if (!tableInfo.codigo_expiracion) {
      await queryInterface.addColumn('usuarios', 'codigo_expiracion', { type: Sequelize.DATE, allowNull: true });
    }
    if (!tableInfo.ultimo_login) {
      await queryInterface.addColumn('usuarios', 'ultimo_login', { type: Sequelize.DATE, allowNull: true });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('usuarios', 'codigo_verificacion');
    await queryInterface.removeColumn('usuarios', 'codigo_expiracion');
    await queryInterface.removeColumn('usuarios', 'ultimo_login');
  }
};
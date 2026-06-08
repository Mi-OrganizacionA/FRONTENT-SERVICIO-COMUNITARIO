const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('configuracion', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      clave: { type: DataTypes.STRING(50), unique: true, allowNull: false },
      valor: { type: DataTypes.TEXT, allowNull: false },
      descripcion: { type: DataTypes.STRING(255), allowNull: true }
    });

    // Insertar valores por defecto
    await queryInterface.bulkInsert('configuracion', [
      {
        clave: 'Aprobación Automática Habitantes',
        valor: 'false',
        descripcion: 'Define si el registro de habitantes por voceros se aprueba automáticamente o pasa a bandeja.'
      },
      {
        clave: 'Aprobación Automática Global',
        valor: 'false',
        descripcion: 'Define si todos los registros en el sistema se aprueban automáticamente.'
      }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('configuracion');
  }
};

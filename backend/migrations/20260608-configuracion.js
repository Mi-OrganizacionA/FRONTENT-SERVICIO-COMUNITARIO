const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('configuracion', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        clave: { type: DataTypes.STRING(50), unique: true, allowNull: false },
        valor: { type: DataTypes.TEXT, allowNull: false },
        descripcion: { type: DataTypes.STRING(255), allowNull: true }
      });
    } catch (error) {
      console.log('La tabla configuracion posiblemente ya existe, omitiendo createTable:', error.message);
    }

    // Insertar valores por defecto (evitar duplicados)
    try {
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
      ], { ignoreDuplicates: true });
    } catch (error) {
      console.log('Las filas de configuracion ya existen, omitiendo insert:', error.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('configuracion');
  }
};

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Añadimos el campo imagen_portada a la tabla proyectos
    await queryInterface.addColumn('proyectos', 'imagen_portada', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revertimos la creación del campo
    await queryInterface.removeColumn('proyectos', 'imagen_portada');
  }
};

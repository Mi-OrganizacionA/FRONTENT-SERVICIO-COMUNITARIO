const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('proyectos');
    
    if (!tableInfo.avance) {
      await queryInterface.addColumn('proyectos', 'avance', {
        type: DataTypes.INTEGER,
        defaultValue: 0
      });
    }
    if (!tableInfo.tipo_proyecto) {
      await queryInterface.addColumn('proyectos', 'tipo_proyecto', {
        type: DataTypes.STRING(50)
      });
    }
    if (!tableInfo.responsable) {
      await queryInterface.addColumn('proyectos', 'responsable', {
        type: DataTypes.STRING(150)
      });
    }
    if (!tableInfo.observaciones) {
      await queryInterface.addColumn('proyectos', 'observaciones', {
        type: DataTypes.TEXT
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('proyectos');
    if (tableInfo.avance) await queryInterface.removeColumn('proyectos', 'avance');
    if (tableInfo.tipo_proyecto) await queryInterface.removeColumn('proyectos', 'tipo_proyecto');
    if (tableInfo.responsable) await queryInterface.removeColumn('proyectos', 'responsable');
    if (tableInfo.observaciones) await queryInterface.removeColumn('proyectos', 'observaciones');
  }
};

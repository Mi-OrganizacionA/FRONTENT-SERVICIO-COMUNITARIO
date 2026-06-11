const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reporte7T = sequelize.define('Reporte7T', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_comunidad: { 
      type: DataTypes.INTEGER, 
      references: { model: 'consejos_comunales', key: 'id' }, 
      allowNull: false 
    },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    contenido: DataTypes.TEXT,
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'reportes_7t', timestamps: false });

  return Reporte7T;
};

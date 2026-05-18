const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reporte7T = sequelize.define('Reporte7T', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: DataTypes.STRING(200),
    contenido: DataTypes.TEXT,
    consejo_comunal_id: DataTypes.INTEGER,
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'reportes_7t', timestamps: false });

  return Reporte7T;
};

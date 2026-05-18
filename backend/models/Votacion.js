const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Votacion = sequelize.define('Votacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    descripcion: DataTypes.TEXT,
    consejo_comunal_id: DataTypes.INTEGER,
    fecha_inicio: DataTypes.DATE,
    fecha_fin: DataTypes.DATE,
    activa: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'votaciones', timestamps: false });

  return Votacion;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vivienda = sequelize.define('Vivienda', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    direccion: DataTypes.TEXT,
    consejo_comunal_id: DataTypes.INTEGER,
    tipo: DataTypes.STRING(50),
    tamaño_m2: DataTypes.FLOAT
  }, { tableName: 'viviendas', timestamps: false });

  return Vivienda;
};

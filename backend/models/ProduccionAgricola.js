const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProduccionAgricola = sequelize.define('ProduccionAgricola', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rubro: DataTypes.STRING(150),
    hectareas_cultivadas: DataTypes.FLOAT,
    tipo_cultivo: DataTypes.STRING(150),
    ubicacion_cultivo: DataTypes.STRING(200),
    latitud: DataTypes.STRING(50),
    longitud: DataTypes.STRING(50),
    rendimiento_estimado: DataTypes.STRING(100),
    productos_secundarios: DataTypes.STRING(250),
    fecha_inicio_cultivo: DataTypes.DATE,
    observaciones: DataTypes.TEXT
  }, { tableName: 'produccion_agricola', timestamps: false });

  return ProduccionAgricola;
};

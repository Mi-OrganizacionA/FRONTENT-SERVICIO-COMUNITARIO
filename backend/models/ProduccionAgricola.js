const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProduccionAgricola = sequelize.define('ProduccionAgricola', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_habitante: { 
      type: DataTypes.INTEGER, 
      references: { model: 'habitantes', key: 'id' }, 
      allowNull: false 
    },
    rubro: { type: DataTypes.STRING(150), allowNull: false },
    hectareas_cultivadas: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tipo_cultivo: { 
      type: DataTypes.ENUM('orgánico', 'convencional', 'agroforestal', 'otro'), 
      allowNull: false 
    },
    ubicacion_cultivo: DataTypes.TEXT,
    latitud: DataTypes.DECIMAL(10, 8), // Coordenadas para geolocalización
    longitud: DataTypes.DECIMAL(11, 8),
    rendimiento_estimado: DataTypes.DECIMAL(12, 2),
    productos_secundarios: DataTypes.JSON, // ej: {"maíz": "forraje", "frijol": "consumo"}
    fecha_inicio_cultivo: DataTypes.DATE,
    observaciones: DataTypes.TEXT,
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'produccion_agricola', timestamps: false });

  return ProduccionAgricola;
};

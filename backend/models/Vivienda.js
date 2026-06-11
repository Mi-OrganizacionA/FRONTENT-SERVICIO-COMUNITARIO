const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vivienda = sequelize.define('Vivienda', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_comunidad: { 
      type: DataTypes.INTEGER, 
      references: { model: 'consejos_comunales', key: 'id' }, 
      allowNull: false 
    },
    id_jefe_familia: { 
      type: DataTypes.INTEGER, 
      references: { model: 'habitantes', key: 'id' }, 
      allowNull: true 
    },
    direccion: DataTypes.TEXT,
    tipo_vivienda: DataTypes.STRING(100),
    tamaño_m2: DataTypes.DECIMAL(10, 2),
    cantidad_habitaciones: DataTypes.INTEGER,
    tipo_paredes: DataTypes.STRING(100),
    tipo_techo: DataTypes.STRING(100),
    condiciones_salubridad: DataTypes.TEXT,
    requiere_ayuda_mejora: DataTypes.STRING(100),
    enseres_vivienda: DataTypes.JSON,
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'viviendas', timestamps: false });

  return Vivienda;
};

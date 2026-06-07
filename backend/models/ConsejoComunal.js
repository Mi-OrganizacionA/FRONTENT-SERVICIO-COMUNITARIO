const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsejoComunal = sequelize.define('ConsejoComunal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_comunidad: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    descripcion: DataTypes.TEXT,
    ubicacion: DataTypes.TEXT,
    responsable: DataTypes.STRING(150),
    habitantes_count: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    }, // Actualizado automáticamente por triggers
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'consejos_comunales',
    timestamps: false
  });

  return ConsejoComunal;
};

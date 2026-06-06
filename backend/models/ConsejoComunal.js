const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsejoComunal = sequelize.define('ConsejoComunal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    descripcion: DataTypes.TEXT,
    direccion: DataTypes.TEXT,
    telefono: DataTypes.STRING(20),
    email: DataTypes.STRING(100),
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'consejos_comunales',
    timestamps: false
  });

  return ConsejoComunal;
};

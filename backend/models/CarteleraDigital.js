const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CarteleraDigital = sequelize.define('CarteleraDigital', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo_publicacion: DataTypes.STRING(50),
    titulo: DataTypes.STRING(250),
    contenido: DataTypes.TEXT,
    fecha_publicacion: DataTypes.DATE,
    publicado: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'cartelera_digital', timestamps: false });

  return CarteleraDigital;
};

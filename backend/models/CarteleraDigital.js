const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CarteleraDigital = sequelize.define('CarteleraDigital', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_autor: { 
      type: DataTypes.INTEGER, 
      references: { model: 'usuarios', key: 'id' }, 
      allowNull: false 
    },
    tipo_publicacion: { 
      type: DataTypes.ENUM('noticia', 'anuncio', 'encuesta'), 
      allowNull: false 
    },
    titulo: { type: DataTypes.STRING(250), allowNull: false },
    contenido: { type: DataTypes.TEXT, allowNull: false },
    fecha_publicacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'cartelera_digital', timestamps: false });

  return CarteleraDigital;
};

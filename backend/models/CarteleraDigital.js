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
      type: DataTypes.STRING(50), 
      allowNull: false 
    },
    titulo: { type: DataTypes.STRING(250), allowNull: false },
    contenido: { type: DataTypes.TEXT, allowNull: false },
    enlace_extra: DataTypes.TEXT,
    fecha_cierre: DataTypes.DATE,
    destacada: { type: DataTypes.BOOLEAN, defaultValue: false },
    fecha_publicacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'cartelera_digital', timestamps: false });

  return CarteleraDigital;
};

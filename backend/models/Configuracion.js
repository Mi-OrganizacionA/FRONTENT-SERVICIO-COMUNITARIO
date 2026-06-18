const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Configuracion = sequelize.define('Configuracion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clave: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    valor: { type: DataTypes.TEXT, allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
    modificado_por: { 
      type: DataTypes.INTEGER, 
      references: { model: 'usuarios', key: 'id' }, 
      allowNull: true 
    }
  }, { tableName: 'configuracion', timestamps: false });

  return Configuracion;
};

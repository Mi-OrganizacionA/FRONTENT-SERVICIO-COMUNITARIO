const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Votacion = sequelize.define('Votacion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_comunidad: { 
      type: DataTypes.INTEGER, 
      references: { model: 'consejos_comunales', key: 'id' }, 
      allowNull: false 
    },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    descripcion: DataTypes.TEXT,
    fecha_inicio: DataTypes.DATE,
    fecha_fin: DataTypes.DATE,
    activa: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'votaciones', timestamps: false });

  return Votacion;
};

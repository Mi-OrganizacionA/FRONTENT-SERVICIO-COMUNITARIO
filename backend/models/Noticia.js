const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Noticia = sequelize.define('Noticia', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    contenido: DataTypes.TEXT,
    id_autor: { 
      type: DataTypes.INTEGER, 
      references: { model: 'usuarios', key: 'id' }, 
      allowNull: true 
    },
    publicado: { type: DataTypes.BOOLEAN, defaultValue: false },
    fecha_publicacion: DataTypes.DATE,
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'noticias', timestamps: false });

  return Noticia;
};

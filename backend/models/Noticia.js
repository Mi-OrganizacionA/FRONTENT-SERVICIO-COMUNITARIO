const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Noticia = sequelize.define('Noticia', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    contenido: DataTypes.TEXT,
    publicado: { type: DataTypes.BOOLEAN, defaultValue: false },
    fecha_publicacion: DataTypes.DATE
  }, { tableName: 'noticias', timestamps: false });

  return Noticia;
};

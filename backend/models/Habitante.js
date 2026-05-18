const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Habitante = sequelize.define('Habitante', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cedula: { type: DataTypes.STRING(8), unique: true, allowNull: false },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    apellido: { type: DataTypes.STRING(100), allowNull: false },
    edad: DataTypes.INTEGER,
    genero: { type: DataTypes.ENUM('M','F','Otro'), allowNull: false },
    email: DataTypes.STRING(100),
    telefono: DataTypes.STRING(20),
    direccion: DataTypes.TEXT,
    consejo_comunal_id: { type: DataTypes.INTEGER, references: { model: 'consejos_comunales', key: 'id' }, allowNull: false },
    clasificacion: { type: DataTypes.ENUM('adulto','niño','adulto_mayor','discapacitado','encamado') },
    elector: { type: DataTypes.BOOLEAN, defaultValue: true },
    foto_cedula_url: DataTypes.STRING(500),
    centro_electoral: DataTypes.STRING(100),
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'habitantes', timestamps: false });

  return Habitante;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    contraseña: { type: DataTypes.STRING(255), allowNull: false },
    rol: { type: DataTypes.ENUM('admin','vocero'), allowNull: false },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    email: DataTypes.STRING(100),
    consejo_comunal_id: { type: DataTypes.INTEGER, references: { model: 'consejos_comunales', key: 'id' } },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ultimo_login: DataTypes.DATE
  }, { tableName: 'usuarios', timestamps: false });

  return Usuario;
};

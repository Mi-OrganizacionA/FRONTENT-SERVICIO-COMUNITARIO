const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    cedula: { type: DataTypes.STRING(20), allowNull: true },
    credenciales: { type: DataTypes.STRING(255), allowNull: false }, // contraseña hasheada
    rol: { type: DataTypes.ENUM('admin','vocero'), allowNull: false },
    id_comunidad_asignada: { 
      type: DataTypes.INTEGER, 
      references: { model: 'consejos_comunales', key: 'id' },
      allowNull: true // NULL si es admin
    },
    codigo_verificacion: { type: DataTypes.STRING(10), allowNull: true },
    codigo_expiracion: { type: DataTypes.DATE, allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ultimo_login: DataTypes.DATE,
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'usuarios', timestamps: false });

  return Usuario;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrganizacionSocial = sequelize.define('OrganizacionSocial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_organizacion: DataTypes.STRING(200),
    tipo_organizacion: DataTypes.STRING(100),
    mision: DataTypes.TEXT,
    contacto_telefono: DataTypes.STRING(50),
    contacto_email: DataTypes.STRING(150)
  }, { tableName: 'organizaciones_sociales', timestamps: false });

  return OrganizacionSocial;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrganizacionSocial = sequelize.define('OrganizacionSocial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_comunidad: { 
      type: DataTypes.INTEGER, 
      references: { model: 'consejos_comunales', key: 'id' }, 
      allowNull: true 
    },
    id_habitante_responsable: { 
      type: DataTypes.INTEGER, 
      references: { model: 'habitantes', key: 'id' }, 
      allowNull: true 
    },
    nombre_organizacion: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    tipo_organizacion: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: DataTypes.TEXT,
    mision: DataTypes.TEXT,
    contacto_telefono: DataTypes.STRING(50),
    contacto_email: DataTypes.STRING(150),
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'organizaciones_sociales', timestamps: false });

  return OrganizacionSocial;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PersonaGrupoSocial = sequelize.define('PersonaGrupoSocial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rol_en_grupo: DataTypes.STRING(100),
    fecha_ingreso: DataTypes.DATE,
    fecha_salida: DataTypes.DATE
  }, { tableName: 'persona_grupo_social', timestamps: false });

  return PersonaGrupoSocial;
};

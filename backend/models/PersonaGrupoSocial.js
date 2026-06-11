const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PersonaGrupoSocial = sequelize.define('PersonaGrupoSocial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_habitante: { 
      type: DataTypes.INTEGER, 
      references: { model: 'habitantes', key: 'id' }, 
      allowNull: false 
    },
    id_organizacion: { 
      type: DataTypes.INTEGER, 
      references: { model: 'organizaciones_sociales', key: 'id' }, 
      allowNull: false 
    },
    rol_en_grupo: { type: DataTypes.STRING(100), allowNull: false }, // CRÍTICO para evitar recursividad
    fecha_ingreso: { type: DataTypes.DATE, allowNull: false },
    fecha_salida: DataTypes.DATE, // NULL si sigue activo
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { 
    tableName: 'persona_grupo_social', 
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['id_habitante', 'id_organizacion']
      }
    ]
  });

  return PersonaGrupoSocial;
};

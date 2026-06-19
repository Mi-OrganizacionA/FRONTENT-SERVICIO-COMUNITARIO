const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoSituacionVivienda = sequelize.define('CensoSituacionVivienda', {
    id_estudio: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
    condiciones_terreno: DataTypes.STRING(200),
    forma_tenencia: DataTypes.STRING(100),
    tipo_vivienda: DataTypes.STRING(100),
    cantidad_habitaciones: { type: DataTypes.INTEGER, defaultValue: 0 },
    cantidad_banos: { type: DataTypes.INTEGER, defaultValue: 0 },
    ambientes_vivienda: DataTypes.STRING(300),
    pertenece_ocv: { type: DataTypes.BOOLEAN, defaultValue: false },
    terreno_propio: { type: DataTypes.BOOLEAN, defaultValue: false },
    tipo_paredes: DataTypes.STRING(100),
    tipo_techo: DataTypes.STRING(100),
    inscrita_sivih: { type: DataTypes.BOOLEAN, defaultValue: false },
    condiciones_salubridad: DataTypes.TEXT,
    requiere_ayuda_mejora: DataTypes.STRING(100),
    presencia_insectos_roedores: { type: DataTypes.BOOLEAN, defaultValue: false },
    tiene_animales_domesticos: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'censo_situacion_vivienda', timestamps: false });

  return CensoSituacionVivienda;
};

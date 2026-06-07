const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoSituacionEconomica = sequelize.define('CensoSituacionEconomica', {
    id_estudio: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
    trabaja: { type: DataTypes.BOOLEAN, defaultValue: false },
    donde_trabaja: DataTypes.STRING(200),
    ingreso_familiar_rango: DataTypes.STRING(100),
    actividad_comercial_vivienda: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'censo_situacion_economica', timestamps: false });

  return CensoSituacionEconomica;
};

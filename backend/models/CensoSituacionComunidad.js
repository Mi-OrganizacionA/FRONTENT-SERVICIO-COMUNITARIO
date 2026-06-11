const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoSituacionComunidad = sequelize.define('CensoSituacionComunidad', {
    id_estudio: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
    principales_potencialidades_ventajas: DataTypes.TEXT,
    principales_problemas_debilidades: DataTypes.TEXT
  }, { tableName: 'censo_situacion_comunidad', timestamps: false });

  return CensoSituacionComunidad;
};

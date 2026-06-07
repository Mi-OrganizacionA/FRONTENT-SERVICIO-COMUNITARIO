const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoSalud = sequelize.define('CensoSalud', {
    id_estudio: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
    necesita_ayuda_especial: { type: DataTypes.BOOLEAN, defaultValue: false },
    cual_ayuda_especial: DataTypes.TEXT,
    exclusion_ninos_calle_cant: { type: DataTypes.INTEGER, defaultValue: 0 },
    exclusion_indigentes_cant: { type: DataTypes.INTEGER, defaultValue: 0 },
    exclusion_enfermos_term_cant: { type: DataTypes.INTEGER, defaultValue: 0 },
    exclusion_discapacitados_cant: { type: DataTypes.INTEGER, defaultValue: 0 },
    exclusion_tercera_edad_cant: { type: DataTypes.INTEGER, defaultValue: 0 },
    exclusion_otros: DataTypes.TEXT
  }, { tableName: 'censo_salud', timestamps: false });

  return CensoSalud;
};

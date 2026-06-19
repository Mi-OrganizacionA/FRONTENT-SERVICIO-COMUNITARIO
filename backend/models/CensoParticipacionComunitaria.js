const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoParticipacionComunitaria = sequelize.define('CensoParticipacionComunitaria', {
    id_estudio: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
    existen_org_comunitarias: { type: DataTypes.BOOLEAN, defaultValue: false },
    cuales_org_comunitarias: DataTypes.STRING(255),
    participa_usted: { type: DataTypes.BOOLEAN, defaultValue: false },
    participa_familiar: { type: DataTypes.BOOLEAN, defaultValue: false },
    dispuesto_apoyar_consejo: { type: DataTypes.BOOLEAN, defaultValue: false },
    asiste_asambleas_ciudadanos: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'censo_participacion_comunitaria', timestamps: false });

  return CensoParticipacionComunitaria;
};

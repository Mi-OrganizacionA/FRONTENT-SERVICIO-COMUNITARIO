const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoParticipacionComunitaria = sequelize.define('CensoParticipacionComunitaria', {
    id_estudio: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
    existen_org_comunitarias: { type: DataTypes.BOOLEAN, defaultValue: false },
    cuales_org_comunitarias: DataTypes.STRING(255),
    participa_usted: { type: DataTypes.BOOLEAN, defaultValue: false },
    participa_familiar: { type: DataTypes.BOOLEAN, defaultValue: false },
    cree_pueblo_interviene_decisiones: { type: DataTypes.BOOLEAN, defaultValue: false },
    acuerdo_pueblo_protagonismo_presupuesto: { type: DataTypes.BOOLEAN, defaultValue: false },
    dispuesto_apoyar_consejo: { type: DataTypes.BOOLEAN, defaultValue: false },
    asiste_asambleas_ciudadanos: { type: DataTypes.BOOLEAN, defaultValue: false },
    porque_no_asiste: DataTypes.TEXT,
    como_resolver_problemas_sector: DataTypes.TEXT,
    quien_resolver_problemas: DataTypes.STRING(200),
    tipo_proyectos_deseados: DataTypes.TEXT,
    como_apoyaria_proyectos: DataTypes.TEXT,
    compromiso_con_sector: DataTypes.TEXT,
    opinion_censo_energetico: DataTypes.TEXT
  }, { tableName: 'censo_participacion_comunitaria', timestamps: false });

  return CensoParticipacionComunitaria;
};

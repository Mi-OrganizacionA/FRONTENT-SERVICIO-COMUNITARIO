const logger = require('../utils/logger');

async function initModels(sequelize) {
  const Usuario = require('./Usuario')(sequelize);
  const Habitante = require('./Habitante')(sequelize);
  const Proyecto = require('./Proyecto')(sequelize);
  const Votacion = require('./Votacion')(sequelize);
  const Vivienda = require('./Vivienda')(sequelize);
  const Reporte7T = require('./Reporte7T')(sequelize);
  const ConsejoComunal = require('./ConsejoComunal')(sequelize);

  // Nuevos modelos del MER
  const EstudioDemografico = require('./EstudioDemografico')(sequelize);
  const ProduccionAgricola = require('./ProduccionAgricola')(sequelize);
  const OrganizacionSocial = require('./OrganizacionSocial')(sequelize);
  const PersonaGrupoSocial = require('./PersonaGrupoSocial')(sequelize);
  const BandejaValidaciones = require('./BandejaValidaciones')(sequelize);
  const CarteleraDigital = require('./CarteleraDigital')(sequelize);
  const LogAuditoria = require('./LogAuditoria')(sequelize);
  const Configuracion = require('./Configuracion')(sequelize);

  // Modelos del Censo Desglosados
  const CensoCaracteristicaFamiliar = require('./CensoCaracteristicaFamiliar')(sequelize);
  const CensoSituacionEconomica = require('./CensoSituacionEconomica')(sequelize);
  const CensoSituacionVivienda = require('./CensoSituacionVivienda')(sequelize);
  const CensoSalud = require('./CensoSalud')(sequelize);
  const CensoServicios = require('./CensoServicios')(sequelize);
  const CensoParticipacionComunitaria = require('./CensoParticipacionComunitaria')(sequelize);
  const CensoSituacionComunidad = require('./CensoSituacionComunidad')(sequelize);
  const CensoOpcionMultiple = require('./CensoOpcionMultiple')(sequelize);

  // Definir relaciones para que los modelos con consejo_comunal_id queden enlazados
  Usuario.belongsTo(ConsejoComunal, { foreignKey: 'id_comunidad_asignada', as: 'consejo' });
  Habitante.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });
  Proyecto.belongsTo(ConsejoComunal, { foreignKey: 'id_comunidad', as: 'consejo' });
  Votacion.belongsTo(ConsejoComunal, { foreignKey: 'id_comunidad', as: 'consejo' });
  Vivienda.belongsTo(ConsejoComunal, { foreignKey: 'id_comunidad', as: 'consejo' });
  Reporte7T.belongsTo(ConsejoComunal, { foreignKey: 'id_comunidad', as: 'consejo' });
  EstudioDemografico.belongsTo(ConsejoComunal, { foreignKey: 'id_comunidad', as: 'consejo' });
  ProduccionAgricola.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });

  // Relaciones específicas
  ProduccionAgricola.belongsTo(Habitante, { foreignKey: 'habitante_id', as: 'productor' });
  Habitante.hasMany(ProduccionAgricola, { foreignKey: 'habitante_id', as: 'producciones' });

  Vivienda.belongsTo(Habitante, { foreignKey: 'id_jefe_familia', as: 'jefe' });
  Habitante.hasOne(Vivienda, { foreignKey: 'id_jefe_familia', as: 'vivienda_liderada' });

  OrganizacionSocial.belongsTo(Habitante, { foreignKey: 'id_habitante_responsable', as: 'responsable' });
  OrganizacionSocial.hasMany(PersonaGrupoSocial, { foreignKey: 'id_organizacion', as: 'miembros' });
  PersonaGrupoSocial.belongsTo(OrganizacionSocial, { foreignKey: 'id_organizacion', as: 'organizacion' });
  PersonaGrupoSocial.belongsTo(Habitante, { foreignKey: 'id_habitante', as: 'habitante' });

  ConsejoComunal.hasMany(Usuario, { foreignKey: 'id_comunidad_asignada', as: 'usuarios' });
  ConsejoComunal.hasMany(Habitante, { foreignKey: 'consejo_comunal_id', as: 'habitantes' });
  ConsejoComunal.hasMany(Proyecto, { foreignKey: 'id_comunidad', as: 'proyectos' });
  ConsejoComunal.hasMany(Votacion, { foreignKey: 'id_comunidad', as: 'votaciones' });
  ConsejoComunal.hasMany(Vivienda, { foreignKey: 'id_comunidad', as: 'viviendas' });
  ConsejoComunal.hasMany(Reporte7T, { foreignKey: 'id_comunidad', as: 'reportes' });
  ConsejoComunal.hasMany(EstudioDemografico, { foreignKey: 'id_comunidad', as: 'estudios' });
  ConsejoComunal.hasMany(ProduccionAgricola, { foreignKey: 'consejo_comunal_id', as: 'producciones' });

  Configuracion.belongsTo(Usuario, { foreignKey: 'modificado_por', as: 'editor' });
  Usuario.hasMany(Configuracion, { foreignKey: 'modificado_por', as: 'configuraciones_editadas' });

  // Vinculaciones con usuarios y validaciones
  BandejaValidaciones.belongsTo(Usuario, { foreignKey: 'id_vocero', as: 'vocero' });
  BandejaValidaciones.belongsTo(Usuario, { foreignKey: 'id_validador', as: 'validador' });
  CarteleraDigital.belongsTo(Usuario, { foreignKey: 'id_autor', as: 'autor' });

  // Relaciones del Censo de Viviendas

  EstudioDemografico.hasMany(CensoCaracteristicaFamiliar, { foreignKey: 'id_estudio', as: 'familiares' });
  CensoCaracteristicaFamiliar.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  EstudioDemografico.hasOne(CensoSituacionEconomica, { foreignKey: 'id_estudio', as: 'situacion_economica' });
  CensoSituacionEconomica.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  EstudioDemografico.hasOne(CensoSituacionVivienda, { foreignKey: 'id_estudio', as: 'situacion_vivienda' });
  CensoSituacionVivienda.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  EstudioDemografico.hasOne(CensoSalud, { foreignKey: 'id_estudio', as: 'salud' });
  CensoSalud.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  EstudioDemografico.hasOne(CensoServicios, { foreignKey: 'id_estudio', as: 'servicios' });
  CensoServicios.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  EstudioDemografico.hasOne(CensoParticipacionComunitaria, { foreignKey: 'id_estudio', as: 'participacion_comunitaria' });
  CensoParticipacionComunitaria.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  EstudioDemografico.hasOne(CensoSituacionComunidad, { foreignKey: 'id_estudio', as: 'situacion_comunidad' });
  CensoSituacionComunidad.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  EstudioDemografico.hasMany(CensoOpcionMultiple, { foreignKey: 'id_estudio', as: 'opciones_multiples' });
  CensoOpcionMultiple.belongsTo(EstudioDemografico, { foreignKey: 'id_estudio' });

  return {
    Usuario, Habitante, Proyecto, Votacion, Vivienda, Reporte7T, ConsejoComunal,
    EstudioDemografico, ProduccionAgricola, OrganizacionSocial, PersonaGrupoSocial,
    BandejaValidaciones, CarteleraDigital, LogAuditoria,
    CensoCaracteristicaFamiliar, CensoSituacionEconomica, CensoSituacionVivienda,
    CensoSalud, CensoServicios, CensoParticipacionComunitaria, CensoSituacionComunidad,
    CensoOpcionMultiple, Configuracion
  };
}

module.exports = { initModels };

const logger = require('../utils/logger');

async function initModels(sequelize) {
  const Usuario = require('./Usuario')(sequelize);
  const Habitante = require('./Habitante')(sequelize);
  const Proyecto = require('./Proyecto')(sequelize);
  const Votacion = require('./Votacion')(sequelize);
  const Noticia = require('./Noticia')(sequelize);
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

  // Definir relaciones para que los modelos con consejo_comunal_id queden enlazados
  Usuario.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });
  Habitante.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });
  Proyecto.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });
  Votacion.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });
  Vivienda.belongsTo(ConsejoComunal, { foreignKey: 'id_comunidad', as: 'consejo' });
  Reporte7T.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });
  EstudioDemografico.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });
  ProduccionAgricola.belongsTo(ConsejoComunal, { foreignKey: 'consejo_comunal_id', as: 'consejo' });

  // Relaciones específicas
  ProduccionAgricola.belongsTo(Habitante, { foreignKey: 'habitante_id', as: 'productor' });
  Habitante.hasMany(ProduccionAgricola, { foreignKey: 'habitante_id', as: 'producciones' });

  OrganizacionSocial.belongsTo(Habitante, { foreignKey: 'id_habitante_responsable', as: 'responsable' });
  OrganizacionSocial.hasMany(PersonaGrupoSocial, { foreignKey: 'id_organizacion', as: 'miembros' });
  PersonaGrupoSocial.belongsTo(OrganizacionSocial, { foreignKey: 'id_organizacion', as: 'organizacion' });
  PersonaGrupoSocial.belongsTo(Habitante, { foreignKey: 'id_habitante', as: 'habitante' });

  ConsejoComunal.hasMany(Usuario, { foreignKey: 'consejo_comunal_id', as: 'usuarios' });
  ConsejoComunal.hasMany(Habitante, { foreignKey: 'consejo_comunal_id', as: 'habitantes' });
  ConsejoComunal.hasMany(Proyecto, { foreignKey: 'consejo_comunal_id', as: 'proyectos' });
  ConsejoComunal.hasMany(Votacion, { foreignKey: 'consejo_comunal_id', as: 'votaciones' });
  ConsejoComunal.hasMany(Vivienda, { foreignKey: 'id_comunidad', as: 'viviendas' });
  ConsejoComunal.hasMany(Reporte7T, { foreignKey: 'consejo_comunal_id', as: 'reportes' });
  ConsejoComunal.hasMany(EstudioDemografico, { foreignKey: 'consejo_comunal_id', as: 'estudios' });
  ConsejoComunal.hasMany(ProduccionAgricola, { foreignKey: 'consejo_comunal_id', as: 'producciones' });

  // Vinculaciones con usuarios y validaciones
  BandejaValidaciones.belongsTo(Usuario, { foreignKey: 'id_vocero', as: 'vocero' });
  BandejaValidaciones.belongsTo(Usuario, { foreignKey: 'id_validador', as: 'validador' });
  CarteleraDigital.belongsTo(Usuario, { foreignKey: 'id_autor', as: 'autor' });

  return {
    Usuario, Habitante, Proyecto, Votacion, Noticia, Vivienda, Reporte7T, ConsejoComunal,
    EstudioDemografico, ProduccionAgricola, OrganizacionSocial, PersonaGrupoSocial,
    BandejaValidaciones, CarteleraDigital, LogAuditoria
  };
}

module.exports = { initModels };

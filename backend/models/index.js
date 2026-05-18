const logger = require('../utils/logger');

async function initModels(sequelize) {
  const Usuario = require('./Usuario')(sequelize);
  const Habitante = require('./Habitante')(sequelize);
  const Proyecto = require('./Proyecto')(sequelize);
  const Votacion = require('./Votacion')(sequelize);
  const Noticia = require('./Noticia')(sequelize);
  const Vivienda = require('./Vivienda')(sequelize);
  const Reporte7T = require('./Reporte7T')(sequelize);

  // Aquí puede definir relaciones si es necesario
  // Ejemplo: Usuario.belongsTo(Consejo, { foreignKey: 'consejo_comunal_id' });

  return { Usuario, Habitante, Proyecto, Votacion, Noticia, Vivienda, Reporte7T };
}

module.exports = { initModels };

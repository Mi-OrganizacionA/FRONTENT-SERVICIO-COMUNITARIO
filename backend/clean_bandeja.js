require('dotenv').config();
const { initSQLite } = require('./config/database');
const { initModels } = require('./models');

async function run() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  
  // Ver solicitudes en la bandeja
  const [bandeja] = await sequelize.query("SELECT * FROM bandeja_validaciones WHERE tabla_afectada = 'organizaciones' OR tabla_afectada = 'organizaciones_sociales';");
  console.log('Solicitudes en bandeja:', JSON.stringify(bandeja, null, 2));
  
  // Limpiarlas
  const deleted = await models.BandejaValidaciones.destroy({ 
    where: { tabla_afectada: ['organizaciones', 'organizaciones_sociales'] }
  });
  console.log('Solicitudes eliminadas de la bandeja:', deleted);
  
  process.exit(0);
}
run();

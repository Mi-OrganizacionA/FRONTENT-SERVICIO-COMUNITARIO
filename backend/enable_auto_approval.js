require('dotenv').config();
const { initSQLite } = require('./config/database');
const { initModels } = require('./models');

async function run() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  
  // Activar aprobación automática global y para organizaciones
  await models.Configuracion.update(
    { valor: 'true' },
    { where: { clave: 'Aprobación Automática Global' } }
  );
  await models.Configuracion.update(
    { valor: 'true' },
    { where: { clave: 'Aprobación Automática Organizaciones' } }
  );
  
  // Verificar
  const configs = await models.Configuracion.findAll({ raw: true });
  console.log('Configuraciones actualizadas:', JSON.stringify(configs, null, 2));
  
  process.exit(0);
}
run();

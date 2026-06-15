require('dotenv').config();
const { initSQLite } = require('./config/database');
const { initModels } = require('./models');

async function run() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  
  // Ver configuracion
  const configs = await models.Configuracion.findAll({ raw: true });
  console.log('Configuraciones:', JSON.stringify(configs, null, 2));
  
  process.exit(0);
}
run();

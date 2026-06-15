const { initSQLite } = require('./config/database');
const { initModels } = require('./models');

async function run() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  const orgs = await models.OrganizacionSocial.findAll();
  console.log(JSON.stringify(orgs, null, 2));
  process.exit(0);
}

run();

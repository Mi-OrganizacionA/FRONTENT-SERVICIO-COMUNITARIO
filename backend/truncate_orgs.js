require('dotenv').config();
const { initSQLite } = require('./config/database');
const { initModels } = require('./models');

async function run() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  const orgs = await models.OrganizacionSocial.findAll({ raw: true });
  console.log('Orgs in DB:', orgs);
  
  if(orgs.length > 0) {
    await models.OrganizacionSocial.destroy({ truncate: true });
    console.log('Truncated OrganizacionesSociales');
  }
  process.exit(0);
}
run();

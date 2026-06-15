const { initSQLite } = require('./config/database');
const { initModels } = require('./models');

async function run() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  const org = await models.OrganizacionSocial.findOne({ where: { nombre_organizacion: 'Cultura Y Tradicion' } });
  if (org) {
    await org.destroy({ force: true });
    console.log('Organizacion borrada correctamente.');
  } else {
    console.log('No se encontro la organizacion.');
  }
  process.exit(0);
}

run();

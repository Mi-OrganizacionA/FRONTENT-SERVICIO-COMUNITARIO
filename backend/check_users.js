const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function run() {
  try {
    const [results] = await sequelize.query('SELECT id, email, rol, activo, credenciales FROM usuarios');
    console.log(JSON.stringify(results, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
run();

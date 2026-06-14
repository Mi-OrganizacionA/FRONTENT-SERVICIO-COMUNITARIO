const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function run() {
  try {
    const [result] = await sequelize.query("SELECT sql FROM sqlite_master WHERE name='bandeja_validaciones';");
    console.log(result[0].sql);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

run();

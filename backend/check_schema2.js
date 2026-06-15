require('dotenv').config();
const { initSQLite } = require('./config/database');

async function run() {
  const sequelize = await initSQLite();
  
  const [schema] = await sequelize.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='organizaciones_sociales';");
  console.log('Schema completo:', schema[0].sql);
  
  const [cols] = await sequelize.query("PRAGMA table_info('organizaciones_sociales');");
  console.log('Columnas:', JSON.stringify(cols, null, 2));
  
  process.exit(0);
}
run();

require('dotenv').config();
const { initSQLite } = require('./config/database');

async function run() {
  const sequelize = await initSQLite();
  
  const [schema] = await sequelize.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='produccion_agricola';");
  console.log('Schema completo:', schema[0]?.sql);
  
  const [cols] = await sequelize.query("PRAGMA table_info('produccion_agricola');");
  console.log('Columnas:', JSON.stringify(cols, null, 2));

  // Check configs related to produccion
  const [configs] = await sequelize.query("SELECT clave, valor FROM configuracion WHERE clave LIKE '%Produccion%' OR clave LIKE '%Agricola%';");
  console.log('Configs Produccion:', JSON.stringify(configs, null, 2));
  
  process.exit(0);
}
run();

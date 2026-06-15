const { initSQLite } = require('./config/database');

async function run() {
  const sequelize = await initSQLite();
  const [results] = await sequelize.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='bandeja_validaciones';");
  console.log('Schema:', results);
  
  const [indexes] = await sequelize.query("PRAGMA index_list('bandeja_validaciones');");
  console.log('Indexes:', indexes);
  
  process.exit(0);
}
run();

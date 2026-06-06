const { initDatabase } = require('../config/database');
const { initModels } = require('../models');
(async () => {
  try {
    const sequelize = await initDatabase();
    const [hasTable] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='sequelize_migrations'");
    if (hasTable && hasTable.length) {
      const [rows] = await sequelize.query("SELECT name FROM sequelize_migrations ORDER BY name");
      console.log('MIGRATIONS APPLIED:');
      rows.forEach(r => console.log(' -', r.name));
    } else {
      console.log('No se encontró la tabla sequelize_migrations');
    }

    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('\nTABLES:');
    console.log(tables.map(t => t.name).join(', '));

    // try to init models
    const models = await initModels(sequelize);
    console.log('\nMODELS AVAILABLE:');
    console.log(Object.keys(models).join(', '));

    await sequelize.close();
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();

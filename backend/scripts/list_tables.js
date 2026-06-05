const { initDatabase } = require('../config/database');

(async () => {
  try {
    const sequelize = await initDatabase();
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log(tables.map(r => r.name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

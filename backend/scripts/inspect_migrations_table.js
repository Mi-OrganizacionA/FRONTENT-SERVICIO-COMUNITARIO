const { initDatabase } = require('../config/database');

(async () => {
  try {
    const sequelize = await initDatabase();
    const [cols] = await sequelize.query("PRAGMA table_info('sequelize_migrations')");
    console.log('Columns:', JSON.stringify(cols, null, 2));
    const [rows] = await sequelize.query("SELECT * FROM sequelize_migrations");
    console.log('Rows:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

const { initDatabase } = require('../config/database');

(async () => {
  try {
    const sequelize = await initDatabase();
    const name = '20240604-mer.js';
    // comprobar si ya existe
    const [rows] = await sequelize.query('SELECT name FROM sequelize_migrations WHERE name = ?', { replacements: [name] });
    if (rows.length > 0) {
      console.log('La migración ya está registrada:', name);
      process.exit(0);
    }
    await sequelize.query('INSERT INTO sequelize_migrations (name) VALUES (?)', { replacements: [name] });
    console.log('Migración registrada manualmente:', name);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

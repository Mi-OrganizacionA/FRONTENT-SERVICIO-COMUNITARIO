const fs = require('fs');
const path = require('path');

describe('migraciones de base de datos', () => {
  const dbFile = path.join(__dirname, 'tmp-migration.sqlite');

  beforeEach(() => {
    jest.resetModules();
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_STORAGE = dbFile;

    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  afterEach(async () => {
    delete process.env.DB_TYPE;
    delete process.env.SQLITE_STORAGE;
    jest.resetModules();

    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  it('aplica las migraciones en SQLite y crea tablas principales', async () => {
    const { initSQLite } = require('../config/database');
    const { runMigrations } = require('../migrate');

    const sequelize = await initSQLite();

    try {
      const executed = await runMigrations(sequelize);

      expect(executed.length).toBeGreaterThanOrEqual(1);

      const [tables] = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('usuarios', 'habitantes', 'proyectos')"
      );

      expect(tables.map((row) => row.name).sort()).toEqual(['habitantes', 'proyectos', 'usuarios']);
    } finally {
      await sequelize.close();
    }
  });
});

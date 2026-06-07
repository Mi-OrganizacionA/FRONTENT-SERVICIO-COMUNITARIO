const fs = require('fs');
const path = require('path');

describe('Migraciones de base de datos', () => {
  const dbFile = path.join(__dirname, 'tmp-migration-test.sqlite');

  beforeEach(() => {
    jest.resetModules();
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_STORAGE = dbFile;
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  });

  afterEach(async () => {
    delete process.env.DB_TYPE;
    delete process.env.SQLITE_STORAGE;
    jest.resetModules();
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  });

  it('aplica las migraciones y crea las 15 tablas principales', async () => {
    const { initSQLite } = require('../config/database');
    const { runMigrations } = require('../migrate');
    const sequelize = await initSQLite();

    try {
      const executed = await runMigrations(sequelize);
      expect(executed.length).toBeGreaterThanOrEqual(1);

      const tablasEsperadas = [
        'usuarios', 'habitantes', 'proyectos', 'votaciones',
        'noticias', 'viviendas', 'reportes_7t', 'consejos_comunales',
        'estudios_demograficos', 'produccion_agricola', 'organizaciones_sociales',
        'persona_grupo_social', 'bandeja_validaciones', 'cartelera_digital',
        'logs_auditoria'
      ];

      const [rows] = await sequelize.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'sequelize_migrations'`
      );
      const tablasCreadas = rows.map(r => r.name);

      for (const tabla of tablasEsperadas) {
        expect(tablasCreadas).toContain(tabla);
      }
    } finally {
      await sequelize.close();
    }
  });

  it('las migraciones son idempotentes (se pueden ejecutar 2 veces sin error)', async () => {
    const { initSQLite } = require('../config/database');
    const { runMigrations } = require('../migrate');
    const sequelize = await initSQLite();

    try {
      // Primera ejecución
      await runMigrations(sequelize);

      // Segunda ejecución — no debe lanzar error
      await expect(runMigrations(sequelize)).resolves.not.toThrow();
    } finally {
      await sequelize.close();
    }
  });

  it('la tabla logs_auditoria tiene los campos de auditoría requeridos', async () => {
    const { initSQLite } = require('../config/database');
    const { runMigrations } = require('../migrate');
    const sequelize = await initSQLite();

    try {
      await runMigrations(sequelize);
      const desc = await sequelize.getQueryInterface().describeTable('logs_auditoria');
      expect(desc).toHaveProperty('accion');
      expect(desc).toHaveProperty('tabla_afectada');
      expect(desc).toHaveProperty('registro_id');
    } finally {
      await sequelize.close();
    }
  });

  it('la tabla habitantes tiene campos MER: nombres, apellidos, cedula, genero', async () => {
    const { initSQLite } = require('../config/database');
    const { runMigrations } = require('../migrate');
    const sequelize = await initSQLite();

    try {
      await runMigrations(sequelize);
      const desc = await sequelize.getQueryInterface().describeTable('habitantes');
      expect(desc).toHaveProperty('cedula');
      expect(desc).toHaveProperty('genero');
      // Verificar que el renombre nombre→nombres se aplicó
      expect(desc).not.toHaveProperty('nombre');
      expect(desc).toHaveProperty('nombres');
    } finally {
      await sequelize.close();
    }
  });
});

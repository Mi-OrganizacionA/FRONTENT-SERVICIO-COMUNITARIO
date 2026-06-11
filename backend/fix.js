const fs = require('fs');
const content = const { initSQLite } = require('../config/database');
const { runMigrations } = require('../migrate');
const { initModels } = require('../models');

describe('Database Migrations', () => {
  let sequelize;

  beforeAll(async () => {
    sequelize = await initSQLite();
    await initModels(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('debe ejecutar las migraciones sin errores (idempotente)', async () => {
    await expect(runMigrations(sequelize)).resolves.not.toThrow();
    await expect(runMigrations(sequelize)).resolves.not.toThrow();
  }, 60000);

  test('debe crear todas las 15 tablas esperadas', async () => {
    const [results] = await sequelize.query(\SELECT name FROM sqlite_master WHERE type='table'\);
    const tables = results.map(r => r.name);
    
    const expectedTables = [
      'bandeja_validaciones', 'cartelera_digital', 'estudios_demograficos',
      'habitantes', 'logs_auditoria', 'noticias', 'organizaciones_sociales',
      'persona_grupo_social', 'produccion_agricola', 'proyectos', 'reportes_7t',
      'usuarios', 'viviendas', 'votaciones', 'consejos_comunales'
    ];

    expectedTables.forEach(table => {
      expect(tables).toContain(table);
    });
  });
});
;
fs.writeFileSync('tests/migration.test.js', content);


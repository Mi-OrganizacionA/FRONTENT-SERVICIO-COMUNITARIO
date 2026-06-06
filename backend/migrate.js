const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { Sequelize } = require('sequelize');
const { initDatabase } = require('./config/database');
const logger = require('./utils/logger');

async function createUmzug(sequelize) {
  return new Umzug({
    migrations: {
      glob: path.join(__dirname, 'migrations', '*.js'),
      resolve: ({ name, path: migrationPath, context }) => {
        const migration = require(migrationPath);
        return {
          name,
          up: async () => migration.up(context, Sequelize),
          down: async () => migration.down(context, Sequelize)
        };
      }
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_migrations' }),
    logger: console
  });
}

async function runMigrations(sequelize) {
  const umzug = await createUmzug(sequelize);
  logger.info('🔁 Aplicando migraciones pendientes...');
  const executed = await umzug.up();
  executed.forEach((migration) => {
    logger.info(`✅ Migración aplicada: ${migration.name}`);
  });
  return executed;
}

async function rollbackMigrations(sequelize) {
  const umzug = await createUmzug(sequelize);
  logger.info('↩️ Revirtiendo última migración...');
  const reverted = await umzug.down();
  if (reverted) {
    logger.info(`✅ Migración revertida: ${reverted.name}`);
  }
  return reverted;
}

async function main() {
  const command = process.argv[2] || 'up';
  const sequelize = await initDatabase();

  if (command === 'up') {
    await runMigrations(sequelize);
    process.exit(0);
  }

  if (command === 'down') {
    await rollbackMigrations(sequelize);
    process.exit(0);
  }

  logger.error(`Comando desconocido: ${command}. Usa 'up' o 'down'.`);
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { runMigrations, rollbackMigrations };

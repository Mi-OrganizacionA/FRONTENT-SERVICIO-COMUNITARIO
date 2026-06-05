const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { Sequelize } = require('sequelize');
const { initDatabase } = require('../config/database');

async function createUmzug(sequelize) {
  return new Umzug({
    migrations: {
      glob: path.join(__dirname, '..', 'migrations', '*.js'),
      resolve: ({ name, path: migrationPath, context }) => {
        const migration = require(migrationPath);
        return {
          name,
          up: async () => migration.up(context, Sequelize),
          down: async () => migration.down(context, Sequelize)
        };
      }
    },
    context: (await sequelize).getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: await sequelize, tableName: 'sequelize_migrations' }),
    logger: console
  });
}

async function main() {
  const sequelize = await initDatabase();
  const qi = sequelize.getQueryInterface();
  const migrationPath = path.join(__dirname, '..', 'migrations', '20240604-mer.js');
  const migration = require(migrationPath);

  console.log('Ejecutando migración MER directamente...');
  await migration.up(qi, Sequelize);
  console.log('Migración MER aplicada en BD. Registrando en storage de Umzug...');

  const umzug = await createUmzug(sequelize);
  await umzug.storage.logMigration('20240604-mer.js');
  console.log('Registro de migración agregado a sequelize_migrations. OK.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

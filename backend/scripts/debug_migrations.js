const { createRequire } = require('module');
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { initDatabase } = require('../config/database');

async function createUmzug(sequelize) {
  const migrationsPath = path.join(__dirname, '..', 'migrations', '*.js');
  return new Umzug({
    migrations: {
      glob: migrationsPath,
      resolve: ({ name, path: migrationPath, context }) => {
        const migration = require(migrationPath);
        return {
          name,
          up: async () => migration.up(context, require('sequelize')),
          down: async () => migration.down(context, require('sequelize'))
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
  const umzug = await createUmzug(sequelize);
  console.log('Resolved migrations:');
  const resolved = await umzug.pending();
  resolved.forEach(m => console.log('- pending:', m.name));
  const executed = await umzug.executed();
  console.log('Executed migrations in storage:');
  executed.forEach(m => console.log('- executed:', m.name));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

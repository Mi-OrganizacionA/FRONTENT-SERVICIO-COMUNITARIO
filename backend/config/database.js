const { Sequelize } = require('sequelize');
const env = require('./environment');
const logger = require('../utils/logger');

async function initSQLite() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: env.db.sqlite_storage || 'database.sqlite',
    logging: env.node_env === 'development' ? console.log : false
  });

  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión SQLite exitosa');
    return sequelize;
  } catch (error) {
    logger.error('❌ Error conectando a SQLite:', error);
    throw error;
  }
}

async function initPostgres() {
  const sequelize = new Sequelize(
    env.db.name,
    env.db.user,
    env.db.password,
    {
      host: env.db.host,
      port: env.db.port,
      dialect: 'postgres',
      logging: env.node_env === 'development' ? console.log : false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    }
  );

  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión PostgreSQL exitosa');
    return sequelize;
  } catch (error) {
    logger.error('❌ Error conectando a PostgreSQL:', error);
    throw error;
  }
}

async function initMongoDB() {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(env.db.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    logger.info('✅ Conexión MongoDB exitosa');
    return mongoose;
  } catch (error) {
    logger.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
}

async function initDatabase() {
  if (env.db_type === 'sqlite') return await initSQLite();
  if (env.db_type === 'postgres') return await initPostgres();
  if (env.db_type === 'mongo') return await initMongoDB();
  throw new Error(`Tipo de BD desconocido: ${env.db_type}`);
}

module.exports = { initDatabase, initSQLite, initPostgres, initMongoDB };

const app = require('../server');
const { initSQLite } = require('../config/database');
const { runMigrations } = require('../migrate');
const { initModels } = require('../models');

async function setupTestApp() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  await sequelize.sync({ force: true });

  const AuthController = require('../controllers/authController');
  const HabitantesController = require('../controllers/habitantesController');
  const EstudioDemograficoController = require('../controllers/estudioDemograficoController');
  
  AuthController.setUsuarioModel(models.Usuario);
  HabitantesController.setModel(models.Habitante);
  EstudioDemograficoController.setModel(models.EstudioDemografico);

  // You can set other models here if needed.
  return { app, sequelize, models };
}

module.exports = { setupTestApp };

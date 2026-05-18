const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/environment');
const { initDatabase } = require('./config/database');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const habitantesRoutes = require('./routes/habitantes');
const votacionesRoutes = require('./routes/votaciones');
const proyectosRoutes = require('./routes/proyectos');
const noticiasRoutes = require('./routes/noticias');
const reportesRoutes = require('./routes/reportes');

const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors(env.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/habitantes', habitantesRoutes);
app.use('/api/votaciones', votacionesRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/reportes', reportesRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada', path: req.path }));
app.use(errorHandler);

async function start() {
  try {
    let db;
    try {
      db = await initDatabase();
    } catch (dbErr) {
      logger.warn('No fue posible inicializar la BD configurada, intentando SQLite localmente:', dbErr.message || dbErr);
      const { initSQLite } = require('./config/database');
      db = await initSQLite();
    }

    if (db) {
      const sequelize = db;
      const { initModels } = require('./models');
      const models = await initModels(sequelize);
      const AuthController = require('./controllers/authController');
      const HabitantesController = require('./controllers/habitantesController');
      const VotacionesController = require('./controllers/votacionesController');
      const ProyectosController = require('./controllers/proyectosController');
      const NoticiasController = require('./controllers/noticiasController');
      const ReportesController = require('./controllers/reportesController');

      AuthController.setUsuarioModel(models.Usuario);
      HabitantesController.setModel(models.Habitante);
      VotacionesController.setModel(models.Votacion);
      ProyectosController.setModel(models.Proyecto);
      NoticiasController.setModel(models.Noticia);
      ReportesController.setModel(models.Reporte7T);

      await sequelize.sync();
    }

    const server = app.listen(env.port, env.host, () => {
      logger.info(`🚀 Servidor corriendo en http://${env.host}:${env.port}`);
      logger.info(`📝 Modo: ${env.node_env}`);
      logger.info(`💾 BD: ${env.db_type}`);
    });

    process.on('SIGTERM', () => { logger.info('SIGTERM recibido, cerrando servidor...'); server.close(() => { logger.info('Servidor cerrado'); process.exit(0); }); });
  } catch (error) {
    logger.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

if (require.main === module) start();
module.exports = app;

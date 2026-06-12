const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const env = require('./config/environment');
const { initDatabase } = require('./config/database');
const { runMigrations } = require('./migrate');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const habitantesRoutes = require('./routes/habitantes');
const votacionesRoutes = require('./routes/votaciones');
const proyectosRoutes = require('./routes/proyectos');
const noticiasRoutes = require('./routes/noticias');
const reportesRoutes = require('./routes/reportes');
const produccionRoutes = require('./routes/produccion_agricola');
const organizacionesRoutes = require('./routes/organizaciones');
const viviendasRoutes = require('./routes/viviendas');
const notificacionesRoutes = require('./routes/notificaciones');
const vocerosRoutes = require('./routes/voceros');
const bandejaValidacionesRoutes = require('./routes/bandeja_validaciones');
const carteleraDigitalRoutes = require('./routes/cartelera_digital');
const auditoriaRoutes = require('./routes/auditoria');
const personaGrupoSocialRoutes = require('./routes/persona_grupo_social');
const estudiosDemograficosRoutes = require('./routes/estudios_demograficos');
const systemRoutes = require('./routes/system');
const searchRoutes = require('./routes/searchRoutes');
const errorHandler = require('./middleware/errorHandler');
const { captureClientInfo } = require('./middleware/auditMiddleware');

const app = express();
app.use(helmet());
if (env.trust_proxy) {
  app.set('trust proxy', 1);
}
app.use(cors(env.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(captureClientInfo);

const apiLimiter = rateLimit({
  windowMs: env.rate_limit.window_ms,
  max: env.rate_limit.max_requests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Vuelva a intentarlo más tarde.' }
});

app.use('/api/', apiLimiter);

app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/habitantes', habitantesRoutes);
app.use('/api/votaciones', votacionesRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/censo-reportes', require('./routes/censoReportesRoutes'));
app.use('/api/produccion_agricola', produccionRoutes);
app.use('/api/organizaciones', organizacionesRoutes);
app.use('/api/viviendas', viviendasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/voceros', vocerosRoutes);
app.use('/api/validaciones', bandejaValidacionesRoutes);
app.use('/api/cartelera', carteleraDigitalRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/membresias', personaGrupoSocialRoutes);
app.use('/api/estudios-demograficos', estudiosDemograficosRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/search', searchRoutes);
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
      const ProduccionAgricolaController = require('./controllers/produccionAgricolaController');
      const OrganizacionesController = require('./controllers/organizacionesController');
      const ViviendasController = require('./controllers/viviendasController');
      const ValidacionesController = require('./controllers/validacionesController');
      const VocerosController = require('./controllers/vocerosController');
      const BandejaValidacionesController = require('./controllers/bandejaValidacionesController');
      const CarteleraDigitalController = require('./controllers/carteleraDigitalController');
      const CensoReportesController = require('./controllers/censoReportesController');
      const AuditController = require('./controllers/auditController');
      const PersonaGrupoSocialController = require('./controllers/personaGrupoSocialController');
      const EstudioDemograficoController = require('./controllers/estudioDemograficoController');
      const AuditService = require('./services/auditService');
      const SystemController = require('./controllers/systemController');
      const SearchController = require('./controllers/searchController');

      AuthController.setUsuarioModel(models.Usuario);
      HabitantesController.setModel(models.Habitante);
      VotacionesController.setModel(models.Votacion);
      ProyectosController.setModel(models.Proyecto);
      NoticiasController.setModel(models.Noticia);
      ReportesController.setModel(models.Reporte7T);
      ProduccionAgricolaController.setModel(models.ProduccionAgricola);
      OrganizacionesController.setModel(models.OrganizacionSocial);
      ViviendasController.setModel(models.Vivienda);
      ValidacionesController.setModel(models.BandejaValidaciones);
      VocerosController.setModel(models.Usuario);
      BandejaValidacionesController.setModel(models.BandejaValidaciones);
      CarteleraDigitalController.setModel(models.CarteleraDigital);
      PersonaGrupoSocialController.setModel(models.PersonaGrupoSocial);
      EstudioDemograficoController.setModel(models.EstudioDemografico);
      CensoReportesController.setModels(models);
      AuditService.setModel(models.LogAuditoria);
      SystemController.setConfiguracionModel(models.Configuracion);
      SystemController.setUsuarioModel(models.Usuario);
      SearchController.setModels(models);

      await runMigrations(sequelize);
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

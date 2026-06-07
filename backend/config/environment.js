require('dotenv').config();

module.exports = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',

  db_type: process.env.DB_TYPE || 'postgres',
  db: {
    sqlite_storage: process.env.SQLITE_STORAGE || process.env.DB_PATH || 'database.sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'sicag_db',
    user: process.env.DB_USER || 'sicag_user',
    password: process.env.DB_PASS || 'password',
    uri: process.env.MONGO_URI || null
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    expire: process.env.JWT_EXPIRE || '24h',
    refresh_expire: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null
  },

  cors: {
    origin: function (origin, callback) {
      // Permitir cualquier origen en desarrollo local
      callback(null, true);
    },
    credentials: true
  },

  frontend_url: process.env.FRONTEND_URL || 'http://localhost:8080',
  log_level: process.env.LOG_LEVEL || 'info'
};

const { createLogger, format, transports } = require('winston');
const env = require('../config/environment');

const logger = createLogger({
  level: env.log_level || 'info',
  format: format.combine(format.timestamp(), format.simple()),
  transports: [new transports.Console()]
});

module.exports = logger;

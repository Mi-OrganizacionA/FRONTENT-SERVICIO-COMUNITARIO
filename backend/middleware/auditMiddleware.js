const logger = require('../utils/logger');

/**
 * Middleware para capturar IP y User-Agent de las solicitudes
 * Inyecta req.clientIp y req.userAgent en el objeto request
 */
function captureClientInfo(req, res, next) {
  // Obtener IP real (considera proxies)
  const clientIp = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'UNKNOWN';

  // Obtener User-Agent
  const userAgent = req.headers['user-agent'] || 'UNKNOWN';

  // Inyectar en el request para uso posterior
  req.clientIp = clientIp;
  req.userAgent = userAgent;

  next();
}

module.exports = { captureClientInfo };

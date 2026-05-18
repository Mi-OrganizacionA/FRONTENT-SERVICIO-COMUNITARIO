const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado', code: 'NO_TOKEN' });
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    return res.status(403).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
  }
};

const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado', code: 'NOT_AUTHENTICATED' });
  if (req.user.rol === 'admin') return next();
  if (!roles.includes(req.user.rol)) return res.status(403).json({ error: 'Permisos insuficientes', code: 'FORBIDDEN', required_role: roles });
  next();
};

const restrictToConsejo = (paramName = 'consejo_id') => (req, res, next) => {
  const consejoRequested = req.params[paramName] || req.query.consejo_id;
  if (req.user?.rol === 'admin') return next();
  if (req.user?.rol === 'vocero') {
    if (req.user.consejo_comunal_id !== parseInt(consejoRequested)) {
      logger.warn(`⚠️ Vocero ${req.user.id} intentó acceder a consejo ${consejoRequested}`);
      return res.status(403).json({ error: 'No tienes acceso a este consejo comunal', code: 'CONSEJO_FORBIDDEN' });
    }
  }
  next();
};

module.exports = { verifyToken, requireRole, restrictToConsejo };

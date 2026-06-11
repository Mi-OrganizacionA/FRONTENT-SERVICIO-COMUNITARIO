const logger = require('../utils/logger');

function formatSequelizeErrors(error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    const details = error.errors.map(e => ({ field: e.path, message: e.message }));
    return {
      status: 409,
      body: {
        error: 'Conflicto de datos: registro duplicado',
        details
      }
    };
  }

  if (error.name === 'SequelizeValidationError') {
    const details = error.errors.map(e => ({ field: e.path, message: e.message }));
    return {
      status: 422,
      body: {
        error: 'Datos inválidos en la base de datos',
        details
      }
    };
  }

  if (error.name === 'SequelizeDatabaseError') {
    return {
      status: 500,
      body: { error: 'Error interno de la base de datos', details: [{ message: error.message }] }
    };
  }

  return null;
}

module.exports = (err, req, res, next) => {
  logger.error(err);

  const sequelizeError = formatSequelizeErrors(err);
  if (sequelizeError) {
    return res.status(sequelizeError.status).json(sequelizeError.body);
  }

  if (err.isJoi || err.name === 'ValidationError') {
    const details = err.details ? err.details.map(d => ({ message: d.message, path: d.path, type: d.type })) : [];
    return res.status(422).json({ error: 'Datos inválidos', details });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
};

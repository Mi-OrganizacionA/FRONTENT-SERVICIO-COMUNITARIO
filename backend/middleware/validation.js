const Joi = require('joi');

function validate(schemas) {
  if (Joi.isSchema(schemas)) {
    schemas = { body: schemas };
  }

  return (req, res, next) => {
    const sources = ['params', 'query', 'body'];

    for (const source of sources) {
      const schema = schemas[source];
      if (!schema) continue;

      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        allowUnknown: source !== 'body',
        convert: true,
        stripUnknown: false
      });

      if (error) {
        return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
      }

      req[source] = value;
    }

    next();
  };
}

module.exports = { validate };

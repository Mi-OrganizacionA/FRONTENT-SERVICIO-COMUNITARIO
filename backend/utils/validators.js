const Joi = require('joi');

const authLoginSchema = Joi.object({
  usuario: Joi.string().min(3).max(50).required(),
  contraseña: Joi.string().min(6).max(128).required()
});

const habitanteCreateSchema = Joi.object({
  cedula: Joi.string().min(6).max(12).required(),
  nombre: Joi.string().min(2).max(100).required(),
  apellido: Joi.string().min(2).max(100).required(),
  genero: Joi.string().valid('M', 'F', 'Otro').required(),
  consejo_comunal_id: Joi.number().integer().required(),
  edad: Joi.number().integer().min(0),
  email: Joi.string().email(),
  telefono: Joi.string().max(20),
  direccion: Joi.string().max(300),
  clasificacion: Joi.string().valid('adulto', 'niño', 'adulto_mayor', 'discapacitado', 'encamado'),
  elector: Joi.boolean(),
  foto_cedula_url: Joi.string().uri(),
  centro_electoral: Joi.string().max(100)
});

const habitanteUpdateSchema = Joi.object({
  cedula: Joi.string().min(6).max(12),
  nombre: Joi.string().min(2).max(100),
  apellido: Joi.string().min(2).max(100),
  genero: Joi.string().valid('M', 'F', 'Otro'),
  consejo_comunal_id: Joi.number().integer(),
  edad: Joi.number().integer().min(0),
  email: Joi.string().email(),
  telefono: Joi.string().max(20),
  direccion: Joi.string().max(300),
  clasificacion: Joi.string().valid('adulto', 'niño', 'adulto_mayor', 'discapacitado', 'encamado'),
  elector: Joi.boolean(),
  foto_cedula_url: Joi.string().uri(),
  centro_electoral: Joi.string().max(100)
});

const votacionSchema = Joi.object({
  titulo: Joi.string().min(5).max(200).required(),
  descripcion: Joi.string().allow('', null),
  consejo_comunal_id: Joi.number().integer().required(),
  fecha_inicio: Joi.date().optional(),
  fecha_fin: Joi.date().optional(),
  activa: Joi.boolean()
});

const proyectoSchema = Joi.object({
  titulo: Joi.string().min(5).max(200).required(),
  descripcion: Joi.string().allow('', null),
  estado: Joi.string().valid('propuesto','aprobado','rechazado','en_ejecucion','finalizado'),
  presupuesto: Joi.number().min(0),
  consejo_comunal_id: Joi.number().integer().required()
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

const consejoParamSchema = Joi.object({
  consejo_id: Joi.number().integer().positive().required()
});

const votacionParamSchema = Joi.object({
  votacion_id: Joi.number().integer().positive().required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(200).allow('', null)
});

const noticiaSchema = Joi.object({
  titulo: Joi.string().min(5).max(200).required(),
  contenido: Joi.string().allow('', null),
  publicado: Joi.boolean(),
  fecha_publicacion: Joi.date().optional()
});

const reporteSchema = Joi.object({
  titulo: Joi.string().min(5).max(200).required(),
  contenido: Joi.string().allow('', null),
  consejo_comunal_id: Joi.number().integer().required(),
  fecha: Joi.date().optional()
});

module.exports = {
  authLoginSchema,
  habitanteCreateSchema,
  habitanteUpdateSchema,
  votacionSchema,
  proyectoSchema,
  noticiaSchema,
  reporteSchema,
  idParamSchema,
  consejoParamSchema,
  votacionParamSchema,
  paginationSchema
};

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

// Esquemas para nuevas entidades
const bandejaValidacionesSchema = Joi.object({
  tabla_afectada: Joi.string().min(1).max(100).required(),
  registro_id: Joi.number().integer().allow(null),
  tipo_accion: Joi.string().valid('CREATE', 'UPDATE', 'DELETE').required(),
  datos_temporales: Joi.object().required()
});

const carteleraDigitalSchema = Joi.object({
  tipo_publicacion: Joi.string().valid('noticia', 'anuncio', 'encuesta').required(),
  titulo: Joi.string().min(3).max(300).required(),
  contenido: Joi.string().min(1).max(5000).required()
});

const personaGrupoSocialSchema = Joi.object({
  id_habitante: Joi.number().integer().positive().required(),
  id_organizacion: Joi.number().integer().positive().required(),
  rol_en_grupo: Joi.string().min(1).max(50).required()
});

const personaGrupoActualizarRolSchema = Joi.object({
  rol_en_grupo: Joi.string().min(1).max(50).required()
});

const personaGrupoSalidaSchema = Joi.object({
  motivo: Joi.string().max(200).allow('', null)
});

const produccionAgricolaSchema = Joi.object({
  id_habitante: Joi.number().integer().positive().required(),
  rubro: Joi.string().min(1).max(100).required(),
  hectareas_cultivadas: Joi.number().min(0.01).required(),
  tipo_cultivo: Joi.string().valid('orgánico', 'convencional', 'agroforestal', 'otro').required(),
  productos_secundarios: Joi.array().items(Joi.string()),
  latitud: Joi.number().allow(null),
  longitud: Joi.number().allow(null)
});

const viviendasSchema = Joi.object({
  id_comunidad: Joi.number().integer().positive().required(),
  id_jefe_familia: Joi.number().integer().positive().required(),
  tipo_vivienda: Joi.string().min(1).max(100).required(),
  cantidad_habitaciones: Joi.number().integer().min(1),
  tipo_paredes: Joi.string().allow('', null),
  tipo_techo: Joi.string().allow('', null),
  condiciones_salubridad: Joi.string().allow('', null),
  requiere_ayuda_mejora: Joi.boolean()
});

const organizacionSocialSchema = Joi.object({
  id_comunidad: Joi.number().integer().positive().required(),
  nombre_organizacion: Joi.string().min(3).max(200).required(),
  tipo_organizacion: Joi.string().min(1).max(100).required(),
  descripcion: Joi.string().allow('', null),
  mision: Joi.string().allow('', null),
  id_habitante_responsable: Joi.number().integer().positive().allow(null)
});

module.exports = {
  authLoginSchema,
  habitanteCreateSchema,
  habitanteUpdateSchema,
  votacionSchema,
  proyectoSchema,
  noticiaSchema,
  reporteSchema,
  bandejaValidacionesSchema,
  carteleraDigitalSchema,
  personaGrupoSocialSchema,
  personaGrupoActualizarRolSchema,
  personaGrupoSalidaSchema,
  produccionAgricolaSchema,
  viviendasSchema,
  organizacionSocialSchema,
  idParamSchema,
  consejoParamSchema,
  votacionParamSchema,
  paginationSchema
};

const Joi = require('joi');

const authLoginSchema = Joi.object({
  identifier: Joi.string().min(3).max(100),
  email: Joi.string().email(),
  telefono: Joi.string().max(20),
  password: Joi.string().min(6).max(128).required()
}).or('identifier', 'email', 'telefono');

const habitanteCreateSchema = Joi.object({
  cedula: Joi.string().min(6).max(12).required(),
  nombres: Joi.string().min(2).max(100).required(),
  apellidos: Joi.string().min(2).max(100).required(),
  genero: Joi.string().valid('M', 'F', 'Otro').required(),
  consejo_comunal_id: Joi.number().integer().required(),
  fecha_nacimiento: Joi.date().iso().less('now').required(),
  email: Joi.string().email().allow('', null),
  telefono: Joi.string().max(20).allow('', null),
  direccion: Joi.string().max(300).allow('', null),
  clasificacion: Joi.string().valid('adulto', 'niño', 'adulto_mayor', 'discapacitado', 'encamado').allow('', null),
  elector: Joi.boolean(),
  centro_electoral: Joi.string().max(100).when('elector', { is: true, then: Joi.required(), otherwise: Joi.allow('', null) }),
  pensionado: Joi.boolean(),
  pensionado_institucion: Joi.string().max(150).when('pensionado', { is: true, then: Joi.required(), otherwise: Joi.allow('', null) }),
  foto_cedula_url: Joi.string().uri().allow('', null)
});

const habitanteUpdateSchema = Joi.object({
  cedula: Joi.string().min(6).max(12),
  nombres: Joi.string().min(2).max(100),
  apellidos: Joi.string().min(2).max(100),
  genero: Joi.string().valid('M', 'F', 'Otro'),
  consejo_comunal_id: Joi.number().integer(),
  fecha_nacimiento: Joi.date().iso().less('now'),
  email: Joi.string().email().allow('', null),
  telefono: Joi.string().max(20).allow('', null),
  direccion: Joi.string().max(300).allow('', null),
  clasificacion: Joi.string().valid('adulto', 'niño', 'adulto_mayor', 'discapacitado', 'encamado').allow('', null),
  elector: Joi.boolean(),
  centro_electoral: Joi.string().max(100).when('elector', { is: true, then: Joi.required(), otherwise: Joi.allow('', null) }),
  pensionado: Joi.boolean(),
  pensionado_institucion: Joi.string().max(150).when('pensionado', { is: true, then: Joi.required(), otherwise: Joi.allow('', null) }),
  foto_cedula_url: Joi.string().uri().allow('', null)
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
  tipo_publicacion: Joi.string().valid('noticia', 'anuncio', 'encuesta', 'convocatoria', 'aviso').required(),
  titulo: Joi.string().min(3).max(300).required(),
  contenido: Joi.string().min(1).max(5000).required(),
  enlace_extra: Joi.string().max(2000).allow('', null).optional(),
  fecha_cierre: Joi.date().allow(null).optional(),
  destacada: Joi.boolean().optional()
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

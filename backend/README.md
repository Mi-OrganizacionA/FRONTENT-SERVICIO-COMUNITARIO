# 🌾 SICAG Backend - Sistema Integrado de Consejos y Agricultura Georreferenciada

Backend completo construido con **Node.js, Express y Sequelize** para gestionar datos de consejos comunitarios, agricultura y servicios sociales.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Modelos](#modelos)
- [Autenticación](#autenticación)
- [Testing](#testing)
- [Deployment](#deployment)

---

## ✨ Características

✅ **Autenticación JWT** - Seguridad en endpoints  
✅ **Control de Acceso Basado en Roles** - admin vs vocero  
✅ **15 Modelos Completos** - Habitantes, Producción, Organizaciones, etc.  
✅ **Bandeja de Validaciones** - Workflow de aprobación  
✅ **Auditoría Inmutable** - Logs de todas las operaciones  
✅ **Soft Deletes** - Registros nunca se pierden  
✅ **Cálculo Dinámico de Edad** - Desde fecha_nacimiento  
✅ **Migraciones Automáticas** - Control de versión de BD  
✅ **Validaciones con Joi** - Esquemas de datos  
✅ **Manejo de Errores** - Middleware centralizado  

---

## 🔧 Requisitos

- **Node.js** ≥ 16.0.0
- **npm** ≥ 8.0.0
- **PostgreSQL** ≥ 12 O **SQLite** (para desarrollo)
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
cd backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Copiar archivo de configuración

```bash
cp .env.example .env
```

### 4. Configurar variables de entorno

```env
# Servidor
PORT=3000
HOST=localhost
NODE_ENV=development

# Base de Datos
DB_TYPE=postgres          # postgres o sqlite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sicag
DB_USER=postgres
DB_PASSWORD=password123

# JWT
JWT_SECRET=tu_secret_key_super_segura
JWT_EXPIRATION=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logs
LOG_LEVEL=info
```

### 5. Ejecutar migraciones

```bash
npm run migrate
```

### 6. Iniciar servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
backend/
├── config/                 # Configuración
│   ├── database.js        # Conexión a BD
│   ├── environment.js     # Variables de entorno
├── controllers/           # Controladores (lógica HTTP)
│   ├── authController.js
│   ├── habitantesController.js
│   ├── produccionAgricolaController.js
│   ├── bandejaValidacionesController.js
│   └── ...
├── models/                # Modelos Sequelize
│   ├── Habitante.js
│   ├── Usuario.js
│   ├── BandejaValidaciones.js
│   ├── CarteleraDigital.js
│   ├── LogAuditoria.js
│   └── ...
├── routes/                # Rutas API
│   ├── auth.js
│   ├── habitantes.js
│   ├── validaciones.js
│   ├── cartelera_digital.js
│   └── ...
├── services/              # Lógica de negocios
│   ├── auditService.js
│   ├── habitantesService.js
│   ├── produccionAgricolaService.js
│   └── ...
├── middleware/            # Middlewares
│   ├── auth.js           # Verificación JWT
│   ├── errorHandler.js   # Manejo centralizado de errores
│   ├── validation.js     # Validación de esquemas
│   ├── auditMiddleware.js # Captura de IP/User-Agent
├── migrations/            # Migraciones de BD
│   ├── 20240603-inicial.js
│   ├── 20240604-mer.js
│   ├── 20260606-actualizaciones_mer_completo.js
├── utils/                 # Utilidades
│   ├── logger.js         # Winston logger
│   ├── validators.js     # Esquemas Joi
├── tests/                 # Tests
│   ├── health.test.js
│   ├── validation.test.js
├── migrate.js             # Script de migraciones
├── server.js              # Punto de entrada
├── package.json
└── .env.example
```

---

## 💾 Base de Datos

### Modelos Disponibles (15 entidades)

1. **Usuario** - Admins y voceros del sistema
2. **Habitante** - Ciudadanos registrados
3. **ConsejoComunal** - Unidades administrativas geográficas
4. **ProduccionAgricola** - Actividades agrícolas
5. **OrganizacionSocial** - Grupos y asociaciones comunitarias
6. **PersonaGrupoSocial** - Membresía en organizaciones (N:M)
7. **Vivienda** - Encuesta de vivienda por habitante
8. **EstudioDemografico** - Censo demográfico
9. **Votacion** - Procesos electorales
10. **CarteleraDigital** - Publicaciones públicas
11. **Proyecto** - Proyectos comunitarios
12. **Noticia** - Noticias del sistema
13. **Reporte7T** - Reportes administrativos
14. **BandejaValidaciones** - Flujo de aprobación
15. **LogAuditoria** - Registro inmutable de cambios

### Relaciones Clave

```
Usuario (1) ──────────────────> (M) BandejaValidaciones
                                     (validador/vocero)

Habitante (1) ──────────────────> (M) ProduccionAgricola
Habitante (1) ──────────────────> (M) Vivienda
Habitante (M) <──────────────────> (M) OrganizacionSocial
                    via PersonaGrupoSocial

ConsejoComunal (1) ──────────────> (M) Habitante
ConsejoComunal (1) ──────────────> (M) Organizacion
ConsejoComunal (1) ──────────────> (M) Proyecto
ConsejoComunal (1) ──────────────> (M) Votacion
```

### Migrations

Ejecutar automáticamente en startup:

```bash
# Revisar migraciones
npm run migrate:list

# Revertir última migración
npm run migrate:undo

# Revertir todas las migraciones
npm run migrate:undo:all
```

---

## 🔐 Autenticación

### Registro

```bash
POST /api/auth/registro
```

```json
{
  "email": "vocero@example.com",
  "credenciales": "password123",
  "rol": "vocero",
  "id_comunidad_asignada": 1
}
```

### Login

```bash
POST /api/auth/login
```

```json
{
  "email": "admin@sicag.com",
  "credenciales": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "email": "admin@sicag.com",
    "rol": "admin"
  }
}
```

### Usar Token

Incluir en header de todas las requests autenticadas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📡 API Endpoints

### Públicos (sin autenticación)

- `GET /health` - Estado del servidor
- `GET /api/cartelera/publico/activas` - Publicaciones activas
- `GET /api/cartelera/publico/tipo?tipo=encuesta` - Por tipo
- `GET /api/habitantes/publico/:consejo_id` - Búsqueda anónima

### Autenticados

#### Habitantes
- `GET /api/habitantes` - Listar (con paginación)
- `GET /api/habitantes/:id` - Obtener por ID
- `GET /api/habitantes/buscar/rapido?q=juan` - Búsqueda rápida
- `GET /api/habitantes/consejo/:consejoId/electores` - Solo electores
- `GET /api/habitantes/consejo/:consejoId/estadisticas` - Estadísticas
- `POST /api/habitantes` - Crear
- `PUT /api/habitantes/:id` - Actualizar
- `DELETE /api/habitantes/:id` - Eliminar (soft delete)

#### Producción Agrícola
- `GET /api/produccion_agricola` - Listar
- `GET /api/produccion_agricola/consejo/:consejoId` - Por consejo
- `GET /api/produccion_agricola/habitante/:habitanteId/resumen` - Resumen
- `POST /api/produccion_agricola` - Crear
- `PUT /api/produccion_agricola/:id` - Actualizar
- `DELETE /api/produccion_agricola/:id` - Eliminar

#### Bandeja de Validaciones
- `GET /api/validaciones/pendientes` - Validaciones pendientes (admin)
- `GET /api/validaciones/mis-solicitudes` - Mis solicitudes
- `POST /api/validaciones` - Crear solicitud
- `PUT /api/validaciones/:id/aprobar` - Aprobar (admin)
- `PUT /api/validaciones/:id/rechazar` - Rechazar (admin)

#### Cartelera Digital
- `GET /api/cartelera/publico/activas` - Activas (público)
- `GET /api/cartelera/publico/tipo?tipo=noticia` - Por tipo (público)
- `POST /api/cartelera` - Crear
- `PUT /api/cartelera/:id` - Actualizar
- `DELETE /api/cartelera/:id` - Eliminar

#### Membresía
- `GET /api/membresias/habitante/:habitanteId` - Membresías de persona
- `GET /api/membresias/organizacion/:organizacionId` - Miembros de org
- `POST /api/membresias` - Agregar a grupo
- `PUT /api/membresias/:id/rol` - Cambiar rol
- `PUT /api/membresias/:id/salida` - Remover del grupo

#### Auditoría (admin)
- `GET /api/auditoria/logs?limit=100` - Obtener logs
- `GET /api/auditoria/export/csv` - Exportar a CSV
- `POST /api/auditoria/mantenimiento/limpiar-antiguos` - Limpiar logs >24 meses

**Ver [API_TESTING.md](./API_TESTING.md) para ejemplos completos**

---

## 🏗️ Modelos

### Habitante
```javascript
{
  id: Number,
  cedula: String (UNIQUE),
  nombre: String,
  apellido: String,
  genero: Enum ['M', 'F', 'Otro'],
  fecha_nacimiento: Date,
  edad: Number (CALCULADO dinámicamente),
  elector: Boolean (CALCULADO: edad >= 15),
  condicion_salud: Enum ['saludable', 'enfermedad_cronica', 'discapacidad', 'encamado'],
  id_comunidad: ForeignKey (ConsejoComunal),
  activo: Boolean,
  fecha_creacion: Date
}
```

### Usuario
```javascript
{
  id: Number,
  email: String (UNIQUE),
  credenciales: String (hashed bcryptjs),
  rol: Enum ['admin', 'vocero'],
  id_comunidad_asignada: ForeignKey (nullable para admins),
  activo: Boolean
}
```

### BandejaValidaciones
```javascript
{
  id: Number,
  id_vocero: ForeignKey (Usuario),
  id_validador: ForeignKey (Usuario, nullable),
  tabla_afectada: String,
  registro_id: Number (nullable),
  tipo_accion: Enum ['CREATE', 'UPDATE', 'DELETE'],
  datos_temporales: JSON (almacena form data completo),
  estado_tramite: Enum ['Pendiente', 'Aprobado', 'Rechazado'],
  fecha_solicitud: Date,
  fecha_validacion: Date (nullable)
}
```

### LogAuditoria
```javascript
{
  id: Number,
  id_usuario: ForeignKey (Usuario),
  accion: Enum ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VALIDACION'],
  tabla_afectada: String,
  registro_id: Number,
  cambios_antes: JSON (null para CREATE),
  cambios_despues: JSON (null para DELETE),
  ip_address: String,
  user_agent: String,
  mes_ano: String (YYYY-MM para políticas de retención),
  fecha: Date,
  createdAt: Date (NO UPDATEABLE - immutable append-only)
}
```

**Ver [backend/models/](./models/) para esquemas completos**

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Watch mode
npm run test:watch

# Con cobertura
npm run test:coverage
```

### Tests Disponibles

- `health.test.js` - Verificación de salud del servidor
- `validation.test.js` - Validaciones de esquemas

### Agregar Nuevos Tests

```bash
# Crear archivo
touch tests/miFeature.test.js
```

```javascript
describe('Mi Feature', () => {
  test('debe hacer algo', () => {
    expect(true).toBe(true);
  });
});
```

---

## 📊 Logging

Utilizamos **Winston** para logging:

```javascript
const logger = require('./utils/logger');

logger.info('Mensaje informativo');
logger.error('Mensaje de error', error);
logger.warn('Advertencia');
logger.debug('Debug info');
```

Logs se guardan en:
- `logs/app.log` - Todos los logs
- `logs/error.log` - Solo errores

---

## 🚢 Deployment

### En Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Build command: `npm install`
4. Start command: `npm start`

### En Heroku

```bash
# Login
heroku login

# Crear app
heroku create sicag-backend

# Configurar variables
heroku config:set DB_HOST=... DB_PASSWORD=...

# Deploy
git push heroku main
```

### En Servidor VPS

```bash
# SSH
ssh user@your-vps.com

# Clonar
git clone https://github.com/...
cd backend

# Instalar
npm install --production

# Variables de entorno
nano .env

# Iniciar con PM2
pm2 start server.js --name "sicag-backend"
pm2 save
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar conexión PostgreSQL
psql -h localhost -U postgres -d sicag

# O para SQLite (development)
# Verificar que existe backend/database.sqlite
```

### Error: "Migration failed"

```bash
# Revertir y reintentar
npm run migrate:undo
npm run migrate
```

### Error: "JWT token invalid"

```javascript
// Asegurar que JWT_SECRET está en .env
// Regenerar token en /api/auth/login
```

### Puerto 3000 en uso

```bash
# Cambiar puerto en .env
PORT=3001

# O liberar puerto
lsof -i :3000
kill -9 <PID>
```

---

## 📚 Documentación Adicional

- [API Testing Guide](./API_TESTING.md)
- [Schema Models](./models/)
- [Environment Variables](./.env.example)

---

## 📄 Licencia

Proyecto del Servicio Comunitario - Universidad

## 👥 Equipo

Desarrollado por el equipo de Ingeniería de Software

---

## 🎯 Próximas Características

- [ ] Firebase Authentication integration
- [ ] Real-time notifications
- [ ] Geomapping avanzado
- [ ] Reportes PDF descargables
- [ ] Dashboard analytics
- [ ] API GraphQL
- [ ] Mobile app (React Native)

---

**¿Preguntas?** Consulta la documentación completa o abre un issue en GitHub.

✨ Happy coding!


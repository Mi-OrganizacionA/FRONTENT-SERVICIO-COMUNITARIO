# 🤖 Prompt de Continuación - Backend SICAG

## Contexto General

Eres un experto en Node.js, Express y Sequelize. Estás trabajando en completar un backend para SICAG. El 70% del trabajo ya está hecho. Tu tarea es completar el 30% restante.

**Workspace**: `c:\Users\J\Documents\GitHub\FRONTENT-SERVICIO-COMUNITARIO\FRONTENT-SERVICIO-COMUNITARIO`

**Rama de trabajo**: Backend en `./backend/`

---

## Estado Actual del Proyecto

### ✅ YA COMPLETADO (NO MODIFICAR)

1. **15 Modelos Sequelize** - Todos MER-compliant en `./backend/models/`
2. **Migration File** - `20260606-actualizaciones_mer_completo.js` (150+ operaciones)
3. **6 Controladores nuevos/mejorados**:
   - BandejaValidacionesController
   - PersonaGrupoSocialController
   - AuditController
   - CarteleraDigitalController
   - ProduccionAgricolaController
   - HabitantesController

4. **6 Rutas nuevas** integradas en server.js:
   - `/api/validaciones`
   - `/api/auditoria`
   - `/api/cartelera`
   - `/api/membresias`
   - `/api/produccion_agricola` (mejorada)
   - `/api/habitantes` (mejorada)

5. **3 Services mejorados**:
   - auditService.js (DB persistence + cleanup)
   - habitantesService.js (edad dinámica + electoral)
   - produccionAgricolaService.js (estadísticas)

6. **13 Esquemas de validación Joi** en `validators.js`
7. **Middleware auditMiddleware.js** para capturar IP/user-agent
8. **Documentación exhaustiva**:
   - README.md (2000+ líneas)
   - API_TESTING.md (40+ ejemplos)
   - QUICK_START.md

---

## Tareas Pendientes (30%)

### CRÍTICO - Hacer primero:

#### 1. **Test de Migración**
**Archivo**: `backend/migrate.js`

```bash
npm run migrate
```

**Validar que:**
- ✓ Todas las 15 tablas existen
- ✓ Todos los campos están presentes
- ✓ Índices UNIQUE están creados
- ✓ Foreign keys están configuradas
- ✓ Migraciones se pueden ejecutar múltiples veces (idempotentes)
- ✓ No hay errores de tipo de datos

**Documento de referencia**: `backend/migrations/20260606-actualizaciones_mer_completo.js`

---

#### 2. **Completar OrganizacionesController**
**Archivo**: `backend/controllers/organizacionesController.js`

**Estado actual**: Incompleto, solo tiene métodos básicos

**Requerimientos**:
```javascript
class OrganizacionesController {
  // EXISTENTES - NO MODIFICAR
  static setModel(model) { ... }
  static getAll(req, res) { ... }
  static getById(req, res) { ... }
  static create(req, res) { ... }
  static update(req, res) { ... }
  static delete(req, res) { ... }

  // NUEVOS - A IMPLEMENTAR:
  // 1. getPorConsejo(req, res)
  //    - Obtener organizaciones de un consejo específico
  //    - Incluir count de miembros
  //    - Filtro: activo=true

  // 2. getMiembros(req, res)
  //    - GET /api/organizaciones/:id/miembros
  //    - Retornar miembros activos
  //    - Include Habitante data
  //    - Include rol_en_grupo

  // 3. getEstadisticas(req, res)
  //    - GET /api/organizaciones/:id/estadisticas
  //    - Retornar:
  //      - totalMiembros
  //      - miembrosPorRol (count por rol)
  //      - generoMiembros (count M/F/Otro)
  //      - condicionSalud (count por condición)

  // 4. agregarMiembro(req, res)
  //    - POST /api/organizaciones/:id/miembros
  //    - Body: {id_habitante, rol_en_grupo}
  //    - Usar PersonaGrupoSocialController.agregarMiembro internally

  // 5. removerMiembro(req, res)
  //    - PUT /api/organizaciones/:id/miembros/:membresia_id
  //    - Soft delete (fecha_salida)
}
```

**Usar servicio**: `habitantesService.js` para estadísticas demográficas

---

#### 3. **Crear EstudioDemograficoController**
**Archivo**: `backend/controllers/estudioDemograficoController.js` (CREAR NUEVO)

**Modelo de referencia**: `backend/models/EstudioDemografico.js`

```javascript
class EstudioDemograficoController {
  static setModel(model) { ... }

  // Métodos requeridos:
  
  // 1. getAll(req, res)
  //    - GET /api/estudios-demograficos
  //    - Filtrar por consejo
  //    - Ordenar por fecha_creacion DESC

  // 2. getById(req, res)
  //    - GET /api/estudios-demograficos/:id
  //    - Retornar detalle completo

  // 3. getPorConsejo(req, res)
  //    - GET /api/estudios-demograficos/consejo/:consejoId
  //    - Listar todos los estudios de un consejo

  // 4. crear(req, res)
  //    - POST /api/estudios-demograficos
  //    - Body: {id_comunidad, ...campos}
  //    - Auto-set: fecha_creacion, activo=true
  //    - Log en AuditService

  // 5. actualizar(req, res)
  //    - PUT /api/estudios-demograficos/:id
  //    - Log cambios en AuditService

  // 6. finalizar(req, res)
  //    - PUT /api/estudios-demograficos/:id/finalizar
  //    - Marcar como completado
  //    - Lock para no permitir ediciones

  // 7. eliminar(req, res)
  //    - DELETE /api/estudios-demograficos/:id
  //    - Soft delete (activo=false)
}
```

---

#### 4. **Crear Rutas para EstudioDemografico**
**Archivo**: `backend/routes/estudios_demograficos.js` (CREAR NUEVO)

```javascript
// Rutas:
// GET /api/estudios-demograficos - listar
// GET /api/estudios-demograficos/:id - obtener
// GET /api/estudios-demograficos/consejo/:consejoId - por consejo
// POST /api/estudios-demograficos - crear
// PUT /api/estudios-demograficos/:id - actualizar
// PUT /api/estudios-demograficos/:id/finalizar - finalizar
// DELETE /api/estudios-demograficos/:id - eliminar

// Middleware:
// - verifyToken en todas
// - requireRole(['vocero', 'admin']) en POST/PUT/DELETE
// - Validaciones con Joi
```

---

### IMPORTANTE - Tests:

#### 5. **Crear Suite de Tests Básicos**
**Directorio**: `backend/tests/`

```bash
npm test
```

**Archivos a crear**:

`tests/migration.test.js`
```javascript
// Test que:
// 1. Verifica que la migración se ejecuta sin errores
// 2. Verifica que todas las 15 tablas existen
// 3. Verifica que los índices UNIQUE están creados
// 4. Verifica que las ForeignKeys están configuradas
// 5. Verifica que los ENUMs tienen valores correctos
```

`tests/habitantesController.test.js`
```javascript
// Test que:
// 1. Cálculo de edad es correcto
// 2. Electoral status es correcto (edad >= 15)
// 3. Crear habitante registra en auditoría
// 4. Actualizar habitante calcula cambios_antes/después
// 5. Soft delete marca activo=false
```

`tests/bandejaValidacionesController.test.js`
```javascript
// Test que:
// 1. Crear validación goes to estado_tramite=Pendiente
// 2. Aprobar validación mueve datos_temporales a tabla real
// 3. Rechazar validación mantiene en Rechazado
// 4. Auditoría registra cada acción
```

`tests/auditService.test.js`
```javascript
// Test que:
// 1. Logs se persistem en BD
// 2. mes_ano se calcula correctamente
// 3. IP y user-agent se capturan
// 4. Cleanup de logs >24 meses funciona
// 5. LogAuditoria no permite UPDATE
```

---

### DESEABLE - Si hay tiempo:

#### 6. **Seed Data**
**Archivo**: `backend/scripts/seed.js` (CREAR/COMPLETAR)

```javascript
// Crear datos de prueba:
// 1. 1 Usuario admin
// 2. 2 Usuarios vocero (diferentes consejos)
// 3. 3 Consejos Comunales
// 4. 20 Habitantes por consejo
// 5. 5 Organizaciones por consejo
// 6. 3 Producciones agrícolas
// 7. 2 Proyectos por consejo
```

```bash
npm run seed
```

---

## Checklist de Validación

Antes de terminar, verificar:

```
[ ] npm run migrate - Ejecuta sin errores
[ ] npm run dev - Servidor inicia correctamente
[ ] curl http://localhost:3000/health - Retorna OK
[ ] npm test - Todos los tests pasan
[ ] GET /api/habitantes - Retorna datos (si hay seed)
[ ] POST /api/validaciones - Crea solicitud pendiente
[ ] PUT /api/validaciones/:id/aprobar - Aprueba
[ ] GET /api/auditoria/logs - Retorna logs de auditoría
[ ] Migraciones son idempotentes (se pueden ejecutar 2x sin error)
[ ] OrganizacionesController tiene todos los 5 métodos nuevos
[ ] EstudioDemograficoController está completo
[ ] Todos los endpoints tienen AuditService.log()
[ ] No hay console.log(), usar logger.info()
[ ] Todos los errores van al errorHandler middleware
[ ] Validaciones Joi están en lugar correcto
```

---

## Archivos Clave a Consultar

```
✓ backend/models/EstudioDemografico.js - Schema referencia
✓ backend/models/BandejaValidaciones.js - Patrón a seguir
✓ backend/controllers/HabitantesController.js - Patrón de controller
✓ backend/services/habitantesService.js - Patrón de service
✓ backend/routes/habitantes.js - Patrón de rutas
✓ backend/migrations/20260606-actualizaciones_mer_completo.js - Info de campos
✓ backend/API_TESTING.md - Documentar nuevos endpoints
```

---

## Variables de Entorno Necesarias

```env
# Confirmar que .env tiene:
PORT=3000
NODE_ENV=development
DB_TYPE=sqlite (o postgres)
JWT_SECRET=any_secret_key
LOG_LEVEL=info
```

---

## Criterios de Aceptación

### Tarea 1: Migration Test ✓
- [ ] Migration file ejecuta sin errores
- [ ] Todas las tablas creadas
- [ ] Se puede ejecutar 2+ veces sin error (idempotente)
- [ ] Script: `npm run migrate`

### Tarea 2: OrganizacionesController ✓
- [ ] 5 métodos nuevos implementados
- [ ] Todos usan AuditService.log()
- [ ] GET /api/organizaciones/:id/miembros retorna array
- [ ] GET /api/organizaciones/:id/estadisticas completo
- [ ] Tests pasan

### Tarea 3: EstudioDemograficoController ✓
- [ ] 7 métodos implementados
- [ ] Todos usan AuditService.log()
- [ ] GET /api/estudios-demograficos funciona
- [ ] POST crea con fecha_creacion auto
- [ ] Tests pasan

### Tarea 4: Rutas EstudioDemografico ✓
- [ ] Integradas en server.js
- [ ] Modelos inicializados correctamente
- [ ] Validaciones Joi en lugar
- [ ] Tests pasan

### Tarea 5: Tests ✓
- [ ] `npm test` pasa sin errores
- [ ] Cobertura >80% en controllers críticos
- [ ] Tests de migración
- [ ] Tests de flujos principales

### Tarea 6: Seed Data (Opcional) ✓
- [ ] `npm run seed` crea datos
- [ ] Datos son válidos y consistentes
- [ ] Se puede ejecutar múltiples veces

---

## Contacto/Dudas

Si necesitas aclaraciones:
- Ver archivos completados para patrones
- Consultar API_TESTING.md para formato de endpoints
- Revisar README.md para arquitectura general
- Mirar docstrings en models/ para campos exactos

---

## Output Final Esperado

```
BACKEND SICAG - 100% COMPLETADO

✅ 15 modelos
✅ 50+ endpoints
✅ Auditoría inmutable
✅ Validaciones exhaustivas
✅ Tests automatizados
✅ Documentación completa
✅ Seed data
✅ Listo para Firebase integration

Próximo: Conectar Firebase Authentication
```

---

**Instrucciones de Inicio:**
1. Clonar/cargar workspace
2. `cd backend`
3. `npm install`
4. Ejecutar tarea 1: `npm run migrate`
5. Seguir checklist en orden de criticidad

¡Buena suerte! 🚀

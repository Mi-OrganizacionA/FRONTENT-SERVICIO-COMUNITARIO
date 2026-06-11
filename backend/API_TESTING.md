# 📋 Documentación de API SICAG - Guía de Prueba

## 🔐 Autenticación

Todos los endpoints (excepto los públicos) requieren un header `Authorization`:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Obtener Token (Login)

**Endpoint**: `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sicag.com",
    "credenciales": "password123"
  }'
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

---

## 👥 HABITANTES

### 1. Obtener todos los habitantes

**Endpoint**: `GET /api/habitantes?page=1&limit=50&nombre=Juan`

```bash
curl http://localhost:3000/api/habitantes \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta**:
```json
{
  "total": 150,
  "habitantes": [
    {
      "id": 1,
      "cedula": "12345678",
      "nombre": "Juan",
      "apellido": "Pérez",
      "genero": "M",
      "fecha_nacimiento": "1990-01-15",
      "edad": 34,
      "elector": true,
      "condicion_salud": "saludable",
      "id_comunidad": 1
    }
  ],
  "pagina": 1,
  "porPagina": 50
}
```

### 2. Obtener habitante por ID

**Endpoint**: `GET /api/habitantes/:id`

```bash
curl http://localhost:3000/api/habitantes/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Obtener electores de un consejo

**Endpoint**: `GET /api/habitantes/consejo/:consejoId/electores`

```bash
curl http://localhost:3000/api/habitantes/consejo/1/electores \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta**:
```json
{
  "total": 45,
  "electores": [...]
}
```

### 4. Obtener estadísticas demográficas

**Endpoint**: `GET /api/habitantes/consejo/:consejoId/estadisticas`

```bash
curl http://localhost:3000/api/habitantes/consejo/1/estadisticas \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta**:
```json
{
  "consejoId": 1,
  "totalHabitantes": 120,
  "totalElectores": 85,
  "totalMenores": 35,
  "porGenero": {
    "M": 60,
    "F": 60
  },
  "porCondicionSalud": {
    "saludable": 110,
    "enfermedad_cronica": 8,
    "discapacidad": 2
  },
  "rangosEdad": {
    "0-12": 20,
    "13-15": 15,
    "16-18": 12,
    "19-30": 25,
    "31-50": 30,
    "51-65": 15,
    "66+": 3
  }
}
```

### 5. Crear habitante

**Endpoint**: `POST /api/habitantes`

```bash
curl -X POST http://localhost:3000/api/habitantes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "87654321",
    "nombre": "Maria",
    "apellido": "García",
    "genero": "F",
    "id_comunidad": 1,
    "fecha_nacimiento": "1995-05-20",
    "condicion_salud": "saludable",
    "email": "maria@example.com",
    "telefono": "04149999999",
    "nacionalidad": "Venezolana",
    "nivel_educativo": "bachiller"
  }'
```

### 6. Actualizar habitante

**Endpoint**: `PUT /api/habitantes/:id`

```bash
curl -X PUT http://localhost:3000/api/habitantes/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "04149999999",
    "condicion_salud": "enfermedad_cronica"
  }'
```

### 7. Eliminar habitante

**Endpoint**: `DELETE /api/habitantes/:id`

```bash
curl -X DELETE http://localhost:3000/api/habitantes/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🌾 PRODUCCIÓN AGRÍCOLA

### 1. Obtener todas las producciones

**Endpoint**: `GET /api/produccion_agricola`

```bash
curl http://localhost:3000/api/produccion_agricola \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Obtener estadísticas por consejo

**Endpoint**: `GET /api/produccion_agricola/consejo/:consejoId`

```bash
curl http://localhost:3000/api/produccion_agricola/consejo/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta**:
```json
{
  "consejoId": 1,
  "totalProductores": 15,
  "totalHectareas": "125.50",
  "totalProducciones": 18,
  "cultivosPorTipo": {
    "orgánico": 8,
    "convencional": 7,
    "agroforestal": 3
  }
}
```

### 3. Obtener resumen de producción por habitante

**Endpoint**: `GET /api/produccion_agricola/habitante/:habitanteId/resumen`

```bash
curl http://localhost:3000/api/produccion_agricola/habitante/1/resumen \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta**:
```json
{
  "esProductor": true,
  "totalProducciones": 2,
  "totalHectareas": "5.50",
  "rubros": ["Maíz", "Yuca"],
  "cultivos": ["convencional", "orgánico"]
}
```

### 4. Crear producción

**Endpoint**: `POST /api/produccion_agricola`

```bash
curl -X POST http://localhost:3000/api/produccion_agricola \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_habitante": 1,
    "rubro": "Maíz",
    "hectareas_cultivadas": 2.5,
    "tipo_cultivo": "orgánico",
    "productos_secundarios": ["harina", "mazorca"]
  }'
```

---

## 📝 BANDEJA DE VALIDACIONES

### 1. Crear solicitud de validación

**Endpoint**: `POST /api/validaciones`

```bash
curl -X POST http://localhost:3000/api/validaciones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tabla_afectada": "habitantes",
    "tipo_accion": "CREATE",
    "datos_temporales": {
      "cedula": "99999999",
      "nombre": "Carlos",
      "apellido": "López"
    }
  }'
```

### 2. Obtener validaciones pendientes (Admin)

**Endpoint**: `GET /api/validaciones/pendientes`

```bash
curl http://localhost:3000/api/validaciones/pendientes \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Aprobar validación (Admin)

**Endpoint**: `PUT /api/validaciones/:id/aprobar`

```bash
curl -X PUT http://localhost:3000/api/validaciones/1/aprobar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comentarios": "Aprobado, datos correctos"
  }'
```

### 4. Rechazar validación (Admin)

**Endpoint**: `PUT /api/validaciones/:id/rechazar`

```bash
curl -X PUT http://localhost:3000/api/validaciones/1/rechazar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "motivo": "Falta información de contacto"
  }'
```

---

## 📢 CARTELERA DIGITAL

### 1. Obtener publicaciones activas (Público)

**Endpoint**: `GET /api/cartelera/publico/activas`

```bash
curl http://localhost:3000/api/cartelera/publico/activas
```

### 2. Obtener publicaciones por tipo (Público)

**Endpoint**: `GET /api/cartelera/publico/tipo?tipo=encuesta`

```bash
curl http://localhost:3000/api/cartelera/publico/tipo?tipo=encuesta
```

Tipos: `noticia`, `anuncio`, `encuesta`

### 3. Crear publicación

**Endpoint**: `POST /api/cartelera`

```bash
curl -X POST http://localhost:3000/api/cartelera \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_publicacion": "encuesta",
    "titulo": "Encuesta: Servicios Comunitarios",
    "contenido": "Seleccione los servicios que necesita en su comunidad"
  }'
```

### 4. Eliminar publicación

**Endpoint**: `DELETE /api/cartelera/:id`

```bash
curl -X DELETE http://localhost:3000/api/cartelera/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 MEMBRESÍA EN ORGANIZACIONES

### 1. Obtener membresías de un habitante

**Endpoint**: `GET /api/membresias/habitante/:habitanteId`

```bash
curl http://localhost:3000/api/membresias/habitante/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Obtener miembros de una organización

**Endpoint**: `GET /api/membresias/organizacion/:organizacionId`

```bash
curl http://localhost:3000/api/membresias/organizacion/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Agregar persona a organización

**Endpoint**: `POST /api/membresias`

```bash
curl -X POST http://localhost:3000/api/membresias \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_habitante": 1,
    "id_organizacion": 2,
    "rol_en_grupo": "presidente"
  }'
```

### 4. Actualizar rol

**Endpoint**: `PUT /api/membresias/:id/rol`

```bash
curl -X PUT http://localhost:3000/api/membresias/1/rol \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rol_en_grupo": "tesorero"
  }'
```

### 5. Remover miembro

**Endpoint**: `PUT /api/membresias/:id/salida`

```bash
curl -X PUT http://localhost:3000/api/membresias/1/salida \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "motivo": "Cambio de residencia"
  }'
```

---

## 🔍 AUDITORÍA

### 1. Obtener logs de auditoría (Admin)

**Endpoint**: `GET /api/auditoria/logs?limit=100&offset=0`

```bash
curl "http://localhost:3000/api/auditoria/logs?limit=50&action=CREATE" \
  -H "Authorization: Bearer $TOKEN"
```

Parámetros: `userId`, `action`, `table`, `recordId`, `startDate`, `endDate`

### 2. Exportar logs a CSV (Admin)

**Endpoint**: `GET /api/auditoria/export/csv`

```bash
curl http://localhost:3000/api/auditoria/export/csv \
  -H "Authorization: Bearer $TOKEN" \
  > audit_logs.csv
```

### 3. Limpiar logs antiguos (Admin)

**Endpoint**: `POST /api/auditoria/mantenimiento/limpiar-antiguos`

```bash
curl -X POST http://localhost:3000/api/auditoria/mantenimiento/limpiar-antiguos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthsOld": 24
  }'
```

---

## 🚀 Iniciación del Servidor

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
npm run migrate

# Iniciar servidor (desarrollo)
npm run dev

# Iniciar servidor (producción)
npm start
```

---

## ✅ Testing de Endpoints Principales

### Script Bash para Prueba Rápida

```bash
#!/bin/bash

# Variables
API_URL="http://localhost:3000"
EMAIL="admin@sicag.com"
PASSWORD="password123"

# 1. Obtener token
echo "🔐 Obteniendo token..."
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"credenciales\":\"$PASSWORD\"}" \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Obtener habitantes
echo "👥 Obteniendo habitantes..."
curl -s http://$API_URL/api/habitantes \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Obtener estadísticas
echo "📊 Obteniendo estadísticas..."
curl -s http://$API_URL/api/habitantes/consejo/1/estadisticas \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 📝 Notas Importantes

1. **Cálculo de Edad**: Se calcula dinámicamente desde `fecha_nacimiento`
2. **Electoral**: Automáticamente calculado (edad ≥ 15 años = elector)
3. **Soft Deletes**: Todos los registros usan `activo: boolean` en lugar de DELETE
4. **Auditoría**: Todas las operaciones se registran automáticamente
5. **Bandeja**: Las solicitudes van a bandeja y requieren aprobación antes de persistir

---

## ⚠️ Códigos de Error

- `400`: Bad Request (validación fallida)
- `401`: Unauthorized (token inválido o expirado)
- `403`: Forbidden (permisos insuficientes)
- `404`: Not Found (recurso no encontrado)
- `409`: Conflict (cédula ya registrada)
- `500`: Server Error


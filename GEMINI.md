# Instrucciones y Convenciones del Proyecto SICAG

Este archivo contiene la arquitectura compartida del equipo, las convenciones de código y los flujos de trabajo específicos para el repositorio **FRONTENT-SERVICIO-COMUNITARIO** (Sistema Comunal de Autogestión - SICAG).

## Excepción a la Regla Global de Idioma (IMPORTANTE)

A diferencia de la regla global que exige que el código fuente esté estrictamente en inglés, **este proyecto utiliza el ESPAÑOL como idioma principal para todo el código fuente**. Esto se debe a que la base de código existente, los modelos de base de datos, las variables y las funciones ya están estructurados en español.

- **Nombres de variables:** Ej. id_usuario, habitante_id, consejo_comunal_id.
- **Nombres de funciones y métodos:** Ej. initModels(), obtenerDatos().
- **Nombres de clases y modelos:** Ej. EstudioDemografico, Usuario, Vivienda.
- **Nombres de rutas (API):** Ej. /api/habitantes, /api/noticias.

**Toda modificación o código nuevo debe mantener estrictamente esta convención en español para preservar la consistencia con el sistema existente.**

## Arquitectura y Stack Tecnológico

El proyecto se divide en dos componentes principales:

### Frontend
- **Tecnologías:** HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Estructura:**
  - Sin uso de frameworks o librerías de construcción (React, Angular, etc.). Todo se maneja de forma nativa.
  - Componentes e interfaces dinámicas manejadas en JavaScript puro (js/app.js, js/components.js).
  - La comunicación con el backend (o la simulación actual de base de datos local) se gestiona desde js/api.js o scripts modulares por cada vista.

### Backend (/backend)
- **Tecnologías:** Node.js, Express, Sequelize ORM.
- **Base de Datos:** SQLite para el entorno de desarrollo y pruebas locales. (Potencial uso de PostgreSQL para producción).
- **Validaciones:** Joi se utiliza para validar las solicitudes entrantes en las rutas de la API.
- **Estructura Interna:**
  - models/: Definiciones de modelos Sequelize.
  - controllers/: Lógica de negocio de la API REST.
  - routes/: Definición de los endpoints y middlewares aplicados.
  - services/: Lógica de servicios.
  - middleware/: Interceptores (ej. errorHandler.js).

## Flujos de Trabajo y Convenciones de Desarrollo

1. **Gestión de Errores (Backend):**
   - Utilizar siempre el middleware errorHandler global.
   - Usar bloques try/catch de manera consistente en Controladores y Servicios, pasando los errores capturados hacia next(error).

2. **Migraciones (Sequelize):**
   - Toda alteración en la estructura de la base de datos debe reflejarse en las definiciones de los Modelos.

3. **Pruebas (Testing):**
   - El backend utiliza jest. Toda nueva funcionalidad crítica debe ir acompañada de su prueba correspondiente en /backend/tests/.

4. **Desarrollo del Frontend:**
   - Evitar CORS sirviendo los archivos a través de un servidor HTTP local en lugar de abrir los archivos index.html con el protocolo file://.

## Documentación y Reglas de Comunicación

- **Interacción y Explicaciones:** Tal como dicta la regla global, toda comunicación (explicaciones, pasos, análisis de errores) se hará exclusivamente en **Español**.
- **Comentarios en el Código:** Todos los comentarios dentro del código (tanto Frontend como Backend) deben redactarse en **Español**.

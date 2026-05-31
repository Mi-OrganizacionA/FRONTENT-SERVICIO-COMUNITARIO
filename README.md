# SICAG v5.0 - Frontend

Sistema Comunal de Autogestión (SICAG) - Módulo Frontend Refactorizado.

## Instalación

1. Clonar repositorio o descargar archivos.
2. Servir el directorio mediante un servidor web local (Live Server, http-server, python http.server).
   > **Nota:** Abrir `index.html` directamente en el navegador (`file://`) puede causar errores de CORS con `fetch` y módulos ES6.

## Credenciales de Prueba (Demo local)

- **Administrador:**
  - Usuario: admin
  - Contraseña: 1234
- **Vocero:**
  - Usuario: vocero
  - Contraseña: 1234

## Estructura

- `js/api.js` - Capa de datos simulada (lista para reemplazar por llamadas REST reales).
- `js/auth.js` - Gestión centralizada de autenticación y roles.
- `js/validators.js` - Validación estandarizada para todos los formularios.
- `js/components.js` - Componentes de interfaz reutilizables (Modales, Notificaciones).
- `js/modules/` - Lógica específica de cada vista (dashboard, censo, noticias, etc).
- `data/seed.json` - Base de datos simulada.

## Próximos Pasos

- [ ] Implementar backend Node.js / Express
- [ ] Conectar base de datos real (PostgreSQL/MySQL)
- [ ] Implementar seguridad JWT real

---
*Desarrollado para la Comuna Socialista Simón Rodríguez.*

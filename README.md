# 🌿 SICAG v2.5 — Sistema de Información Comunal Agroecológica

El **Sistema de Información Comunal Agroecológica (SICAG)** es una plataforma integral diseñada para la gestión administrativa, censo demográfico, control de producción agrícola y difusión de proyectos de la **Comuna Socialista Agroecológica Simón Rodríguez**.

---

## 🚀 Arquitectura y Tecnologías (Stack)

El proyecto ha sido refactorizado y escalado a una arquitectura cliente-servidor real, dejando atrás las simulaciones estáticas.

### 💻 Frontend (Aplicación Web Progresiva - PWA)
- **Tecnologías:** HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Características:** 
  - **PWA Integral:** Soporte para instalación como aplicación nativa en móviles y PC, caché offline con Service Workers y manifiesto web.
  - **Diseño Responsivo:** Adaptable a dispositivos móviles, tablets y escritorio.
  - **Autenticación Segura:** Manejo de sesiones robusto integrado con el backend.

### ⚙️ Backend (API REST)
- **Framework:** Node.js con Express.js.
- **ORM:** Sequelize (Manejo de modelos, relaciones y migraciones).
- **Seguridad:** JSON Web Tokens (JWT) con estrategia de *Access Token* y *Refresh Token* almacenados en cookies HTTP-Only. Protección CORS y middlewares de validación (Joi).
- **Correos Electrónicos:** Integración de API HTTP (vía **Resend** o **SendGrid**) para la entrega segura de correos de recuperación de contraseña y formularios de contacto, evadiendo los bloqueos clásicos de puertos SMTP.

### 🗄️ Base de Datos
- **Producción (Cloud):** **PostgreSQL** alojado en [**Neon.tech**](https://neon.tech/). Base de datos Serverless altamente escalable.
- **Desarrollo (Local):** **SQLite** (`database.sqlite`) para facilitar pruebas y desarrollo en entornos locales sin configuraciones pesadas.

---

## ☁️ Plataformas Involucradas (Infraestructura)

El ecosistema de SICAG se despliega y apoya en los siguientes servicios en la nube:

1. **[Firebase Hosting](https://firebase.google.com/):** Hospeda todo el módulo Frontend (HTML, CSS, JS). Brinda certificados SSL automáticos y redes de entrega de contenido (CDN) ultrarrápidas a nivel global.
2. **[Render](https://render.com/):** Ejecuta el Web Service del Backend (Node.js). Recibe las peticiones de la API REST, ejecuta la lógica de negocio y se conecta a la base de datos.
3. **[Neon (PostgreSQL)](https://neon.tech/):** Base de datos relacional en la nube. Almacena de forma segura usuarios, habitantes, censos y proyectos.
4. **[Resend](https://resend.com/):** Plataforma de mensajería responsable de disparar los correos electrónicos (recuperación de clave, mensajería de contacto del portal público) mediante API REST, garantizando la entrega a la bandeja de entrada.

---

## 🛠️ Instalación y Entorno de Desarrollo Local

Si deseas correr o modificar el proyecto en tu máquina local, sigue estos pasos:

### 1. Preparar el Backend
Navega a la carpeta `/backend` e instala las dependencias:
```bash
cd backend
npm install
```

Crea un archivo `.env` en la raíz de `/backend` basado en estas variables:
```env
NODE_ENV=development
PORT=3000

# Base de datos local (SQLite)
DB_TYPE=sqlite
DB_PATH=database.sqlite

# Seguridad (Cambia estos valores)
JWT_SECRET=tu_secreto_seguro_aqui
JWT_REFRESH_SECRET=tu_secreto_refresh_aqui
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Credenciales de Email (Resend)
EMAIL_API_KEY=re_tu_api_key_de_resend

# Frontend URL (Para configurar CORS adecuadamente)
FRONTEND_URL=http://localhost:5500
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Levanta el servidor en modo desarrollo:
```bash
npm run dev
```

### 2. Preparar el Frontend
1. Asegúrate de que el archivo `js/api.js` del frontend esté apuntando a tu API local (generalmente `http://localhost:3000/api`) durante tus pruebas, o a la URL de Render si estás en producción.
2. Sirve la carpeta raíz del proyecto mediante un servidor web local (como **Live Server** en VS Code o `npx http-server`). 
   > ⚠️ **Nota:** No abras el archivo `index.html` directamente en el navegador haciendo doble clic (`file://`), ya que los Service Workers y las peticiones `fetch` (CORS) fallarán.

---

## 🔒 Credenciales del Sistema

El sistema maneja un control de acceso basado en roles (RBAC):
- **Administrador General:** Tiene control total sobre configuraciones globales, censo, voceros, y noticias.
- **Vocero Comunal:** Permisos delimitados a la gestión interna de habitantes y edición de su propio perfil/correo.

---
*Desarrollado para la Comuna Socialista Agroecológica Simón Rodríguez — Venezuela.*

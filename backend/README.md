# SICAG Backend

Esqueleto inicial del backend para SICAG (Express + Sequelize/Postgres o Mongoose).

Instrucciones rápidas:

1. Copiar `.env.example` a `.env` y ajustar valores.
2. Instalar dependencias:

```bash
npm install
```

3. Iniciar en desarrollo:

```bash
npm run dev
```

4. Ejecutar migraciones antes de iniciar el servidor en producción o desarrollo:

```bash
npm run migrate
```

5. Revertir la última migración si necesitas retroceder:

```bash
npm run migrate:undo
```


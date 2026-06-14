const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: console.log
});

async function run() {
  try {
    // Dropping and recreating table with exact correct schema
    await sequelize.query('DROP TABLE IF EXISTS "bandeja_validaciones";');
    
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS "bandeja_validaciones" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "id_vocero" INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "id_validador" INTEGER REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "tabla_afectada" VARCHAR(100) NOT NULL,
        "registro_id" INTEGER NULL,
        "tipo_accion" VARCHAR(50) NOT NULL,
        "datos_temporales" JSON NOT NULL,
        "estado_tramite" VARCHAR(50) DEFAULT 'Pendiente',
        "motivo_rechazo" TEXT,
        "comentarios_validador" TEXT,
        "fecha_solicitud" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "fecha_validacion" DATETIME,
        "fecha_registro" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sequelize.query(createTableSql);
    
    console.log('Tabla bandeja_validaciones recreada con schema correcto (registro_id NULL permitido)');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

run();

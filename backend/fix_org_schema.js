require('dotenv').config();
const { initSQLite } = require('./config/database');

async function run() {
  const sequelize = await initSQLite();

  console.log('Recreando tabla organizaciones_sociales con columnas nullable...');

  // En SQLite no se puede ALTER COLUMN, hay que recrear la tabla
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "organizaciones_sociales_new" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "id_comunidad" INTEGER REFERENCES "consejos_comunales" ("id"),
      "id_habitante_responsable" INTEGER REFERENCES "habitantes" ("id"),
      "nombre_organizacion" VARCHAR(200) NOT NULL UNIQUE,
      "tipo_organizacion" VARCHAR(100) NOT NULL,
      "descripcion" TEXT,
      "mision" TEXT,
      "contacto_telefono" VARCHAR(50),
      "contacto_email" VARCHAR(150),
      "fecha_creacion" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "activo" TINYINT(1) DEFAULT 1
    );
  `);

  // Copiar datos existentes si los hay
  await sequelize.query(`
    INSERT INTO "organizaciones_sociales_new" 
      (id, id_comunidad, id_habitante_responsable, nombre_organizacion, tipo_organizacion, descripcion, mision, contacto_telefono, contacto_email, fecha_creacion, activo)
    SELECT 
      id, id_comunidad, id_habitante_responsable, nombre_organizacion, tipo_organizacion, descripcion, mision, contacto_telefono, contacto_email, fecha_creacion, activo
    FROM "organizaciones_sociales";
  `);

  await sequelize.query(`DROP TABLE "organizaciones_sociales";`);
  await sequelize.query(`ALTER TABLE "organizaciones_sociales_new" RENAME TO "organizaciones_sociales";`);

  console.log('✅ Tabla recreada correctamente. Verificando...');

  const [cols] = await sequelize.query("PRAGMA table_info('organizaciones_sociales');");
  cols.forEach(c => {
    console.log(`  ${c.name}: notnull=${c.notnull}, default=${c.dflt_value}`);
  });

  process.exit(0);
}
run();

require('dotenv').config();
const { initSQLite } = require('./config/database');

async function run() {
  const sequelize = await initSQLite();

  console.log('Recreando tabla produccion_agricola con columnas nullable...');

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "produccion_agricola_new" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "consejo_comunal_id" INTEGER REFERENCES "consejos_comunales" ("id"),
      "habitante_id" INTEGER REFERENCES "habitantes" ("id"),
      "rubro" VARCHAR(150) NOT NULL,
      "hectareas_cultivadas" DECIMAL(10,2) NOT NULL,
      "tipo_cultivo" TEXT NOT NULL,
      "ubicacion_cultivo" TEXT,
      "latitud" DECIMAL(10,8),
      "longitud" DECIMAL(11,8),
      "rendimiento_estimado" DECIMAL(12,2),
      "productos_secundarios" JSON,
      "fecha_inicio_cultivo" DATETIME,
      "observaciones" TEXT,
      "id_habitante" INTEGER REFERENCES "habitantes" ("id"),
      "fecha_registro" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "activo" TINYINT(1) DEFAULT 1
    );
  `);

  await sequelize.query(`
    INSERT INTO "produccion_agricola_new" 
      (id, consejo_comunal_id, habitante_id, rubro, hectareas_cultivadas, tipo_cultivo, ubicacion_cultivo, latitud, longitud, rendimiento_estimado, productos_secundarios, fecha_inicio_cultivo, observaciones, id_habitante, fecha_registro, activo)
    SELECT 
      id, consejo_comunal_id, habitante_id, rubro, hectareas_cultivadas, tipo_cultivo, ubicacion_cultivo, latitud, longitud, rendimiento_estimado, productos_secundarios, fecha_inicio_cultivo, observaciones, id_habitante, fecha_registro, activo
    FROM "produccion_agricola";
  `);

  await sequelize.query(`DROP TABLE "produccion_agricola";`);
  await sequelize.query(`ALTER TABLE "produccion_agricola_new" RENAME TO "produccion_agricola";`);

  console.log('✅ Tabla recreada correctamente. Verificando...');

  const [cols] = await sequelize.query("PRAGMA table_info('produccion_agricola');");
  cols.forEach(c => {
    if(c.name === 'id_habitante') {
      console.log(`  ${c.name}: notnull=${c.notnull}, default=${c.dflt_value}`);
    }
  });

  process.exit(0);
}
run();

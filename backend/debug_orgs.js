const { initSQLite } = require('./config/database');

async function run() {
  const sequelize = await initSQLite();
  
  // Ver todos los índices de la tabla
  const [indexes] = await sequelize.query("PRAGMA index_list('organizaciones_sociales');");
  console.log('Índices:', JSON.stringify(indexes, null, 2));
  
  for (const idx of indexes) {
    const [info] = await sequelize.query(`PRAGMA index_info('${idx.name}');`);
    console.log(`Columnas de ${idx.name}:`, JSON.stringify(info, null, 2));
  }
  
  // Ver todas las filas sin excepción
  const [filas] = await sequelize.query("SELECT * FROM organizaciones_sociales;");
  console.log('Filas en DB:', JSON.stringify(filas, null, 2));
  
  process.exit(0);
}
run();

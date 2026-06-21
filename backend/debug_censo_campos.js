/**
 * Script de diagnóstico: verifica si los campos problemáticos existen en la DB
 * y muestra los últimos registros para cada tabla del censo.
 * Ejecutar con: node backend/debug_censo_campos.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Sequelize, DataTypes } = require('sequelize');

async function main() {
  // Conectar a la base de datos
  let sequelize;
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.includes('postgres')) {
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
    });
  } else {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: path.join(__dirname, 'database.sqlite'), logging: false });
  }

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa\n');
  } catch (err) {
    console.error('❌ No se pudo conectar:', err.message);
    process.exit(1);
  }

  const q = async (sql) => {
    const [rows] = await sequelize.query(sql);
    return rows;
  };

  // 1. Verificar columnas de cada tabla
  console.log('=== COLUMNAS DE TABLAS DEL CENSO ===\n');
  
  const tablas = [
    'censo_situacion_vivienda',
    'censo_servicios',
    'censo_salud',
    'censo_participacion_comunitaria',
    'censo_opciones_multiples',
    'estudios_demograficos'
  ];

  for (const tabla of tablas) {
    try {
      let cols;
      if (dbUrl && dbUrl.includes('postgres')) {
        cols = await q(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tabla}' ORDER BY ordinal_position`);
      } else {
        cols = await q(`PRAGMA table_info(${tabla})`);
      }
      console.log(`📊 ${tabla}:`);
      if (dbUrl && dbUrl.includes('postgres')) {
        cols.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type}`));
      } else {
        cols.forEach(c => console.log(`   - ${c.name}: ${c.type}`));
      }
      console.log();
    } catch (e) {
      console.log(`   ⚠️  Error consultando ${tabla}: ${e.message}\n`);
    }
  }

  // 2. Verificar últimos registros de participación comunitaria
  console.log('\n=== ÚLTIMOS 3 REGISTROS DE PARTICIPACIÓN COMUNITARIA ===\n');
  try {
    const part = await q(`SELECT * FROM censo_participacion_comunitaria ORDER BY id_estudio DESC LIMIT 3`);
    part.forEach(r => {
      console.log(`ID Estudio: ${r.id_estudio}`);
      console.log(`  acuerdo_pueblo_protagonismo_presupuesto: ${r.acuerdo_pueblo_protagonismo_presupuesto}`);
      console.log(`  asiste_asambleas_ciudadanos: ${r.asiste_asambleas_ciudadanos}`);
      console.log(`  dispuesto_apoyar_consejo: ${r.dispuesto_apoyar_consejo}`);
      console.log();
    });
  } catch (e) {
    console.log(`  ⚠️  Error: ${e.message}`);
  }

  // 3. Verificar últimas opciones múltiples
  console.log('\n=== ÚLTIMAS 20 OPCIONES MÚLTIPLES (Checkboxes) ===\n');
  try {
    const opts = await q(`SELECT id_estudio, categoria, valor, cantidad FROM censo_opciones_multiples ORDER BY id DESC LIMIT 20`);
    if (opts.length === 0) {
      console.log('⚠️  No hay registros en censo_opciones_multiples. Los checkboxes NO se están guardando.');
    } else {
      opts.forEach(o => console.log(`  Estudio ${o.id_estudio} | ${o.categoria} | ${o.valor}`));
    }
  } catch (e) {
    console.log(`  ⚠️  Error: ${e.message}`);
  }

  // 4. Verificar opciones por categoría
  console.log('\n=== CONTEO DE OPCIONES POR CATEGORÍA ===\n');
  try {
    const cats = await q(`SELECT categoria, COUNT(*) as total FROM censo_opciones_multiples GROUP BY categoria ORDER BY total DESC`);
    if (cats.length === 0) {
      console.log('⚠️  La tabla censo_opciones_multiples está VACÍA.');
    } else {
      cats.forEach(c => console.log(`  ${c.categoria}: ${c.total} registros`));
    }
  } catch (e) {
    console.log(`  ⚠️  Error: ${e.message}`);
  }

  // 5. Ver el último estudio demográfico completo
  console.log('\n=== ÚLTIMO ESTUDIO DEMOGRÁFICO ===\n');
  try {
    const est = await q(`SELECT id, activo, fecha_creacion FROM estudios_demograficos ORDER BY id DESC LIMIT 1`);
    if (est.length > 0) {
      const id = est[0].id;
      console.log(`Estudio ID: ${id}, activo: ${est[0].activo}`);
      
      const opts2 = await q(`SELECT categoria, COUNT(*) as total FROM censo_opciones_multiples WHERE id_estudio = ${id} GROUP BY categoria`);
      if (opts2.length === 0) {
        console.log(`  ⚠️  Estudio ${id} NO tiene opciones múltiples guardadas.`);
      } else {
        console.log(`  Opciones múltiples del estudio ${id}:`);
        opts2.forEach(o => console.log(`    ${o.categoria}: ${o.total} opciones`));
      }
    }
  } catch (e) {
    console.log(`  ⚠️  Error: ${e.message}`);
  }

  console.log('\n✅ Diagnóstico completado.');
  await sequelize.close();
}

main().catch(console.error);

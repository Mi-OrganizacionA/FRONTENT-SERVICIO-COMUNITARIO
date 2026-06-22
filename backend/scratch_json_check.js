const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Usamos SQLite en memoria para inicializar los modelos rápidamente sin conectar a Postgres
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

async function run() {
  const { initModels } = require('./models');
  const models = await initModels(sequelize);
  
  const jsonPath = 'c:\\Users\\ADMIN\\Downloads\\misty-thunder-15850747_production_neondb_2026-06-22_09-34-25.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Agrupar columnas por tabla desde el JSON
  const dbTables = {};
  for (const row of data) {
    if (!dbTables[row.tabla]) dbTables[row.tabla] = [];
    dbTables[row.tabla].push(row.atributo);
  }
  
  console.log('--- COMPARANDO MODELOS CON LA BD NEON ---');
  let hasDiff = false;

  for (const [modelName, model] of Object.entries(models)) {
    const tableName = model.tableName;
    const modelAttributes = Object.keys(model.getAttributes());
    
    if (!dbTables[tableName]) {
      console.log(`❌ TABLA FALTA EN LA BD: ${tableName} (Modelo: ${modelName})`);
      hasDiff = true;
      continue;
    }
    
    const dbColumns = dbTables[tableName];
    
    const missingInDB = modelAttributes.filter(col => !dbColumns.includes(col));
    const extraInDB = dbColumns.filter(col => !modelAttributes.includes(col));
    
    if (missingInDB.length > 0) {
      console.log(`❌ FALTAN COLUMNAS EN LA BD [Tabla: ${tableName}]:`, missingInDB.join(', '));
      hasDiff = true;
    }
    
    if (extraInDB.length > 0) {
      console.log(`⚠️ COLUMNAS EXTRA EN LA BD (Ignorables) [Tabla: ${tableName}]:`, extraInDB.join(', '));
      // No seteamos hasDiff = true porque columnas extra no rompen la app (Sequelize las ignora)
    }
  }

  if (!hasDiff) {
    console.log('✅ CONCORDANCIA PERFECTA: Todos los modelos y columnas esperadas están en la BD.');
  }
}

run().catch(console.error);

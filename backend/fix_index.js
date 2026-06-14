const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: console.log
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Conexión exitosa.');
    
    const [results] = await sequelize.query("PRAGMA index_list('bandeja_validaciones');");
    console.log('Indices:', results);
    
    for (const row of results) {
      if (row.name.startsWith('bandeja_validaciones_id_vocero_tabla_afectada_registro_id_tipo')) {
        console.log(`Eliminando indice: ${row.name}`);
        await sequelize.query(`DROP INDEX IF EXISTS "${row.name}";`);
      }
    }
    
    console.log('Finalizado.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

run();

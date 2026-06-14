const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function run() {
  try {
    const [indices] = await sequelize.query("PRAGMA index_list('bandeja_validaciones');");
    console.log('Indices actuales:', indices);
    
    // Si hay alguno único, vamos a borrarlo a la fuerza
    for (const idx of indices) {
        if (idx.unique && !idx.name.includes('sqlite_autoindex')) {
            console.log(`Borrando: ${idx.name}`);
            await sequelize.query(`DROP INDEX IF EXISTS "${idx.name}";`);
        }
    }
    
    const [indicesDespues] = await sequelize.query("PRAGMA index_list('bandeja_validaciones');");
    console.log('Indices despues:', indicesDespues);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

run();

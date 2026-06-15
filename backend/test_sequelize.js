require('dotenv').config();
const { initSQLite } = require('./config/database');
const { initModels } = require('./models');

async function run() {
  const sequelize = await initSQLite();
  const models = await initModels(sequelize);
  
  try {
    const data = {
      nombre_organizacion: "Cultura Y Tradiciondfg Test",
      tipo_organizacion: "Comite de Trabajo",
      mision: "baile",
      contacto_telefono: "(0412) 680-2389",
      contacto_email: "macedanas@gmail.com"
    };
    const org = await models.OrganizacionSocial.create(data);
    console.log('Creada exitosamente:', JSON.stringify(org.toJSON(), null, 2));
  } catch(e) {
    console.error('Error tipo:', e.name);
    console.error('Error mensaje:', e.message);
    console.error('Error original:', e.original?.message);
    if(e.errors) console.error('Errores de validación:', JSON.stringify(e.errors, null, 2));
  }
  
  process.exit(0);
}
run();

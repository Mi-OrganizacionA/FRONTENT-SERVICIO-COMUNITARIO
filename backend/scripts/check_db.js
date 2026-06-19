const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.json')['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

async function check() {
  try {
    const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'censo_participacion_comunitaria';");
    console.log("CensoParticipacionComunitaria columns:");
    console.log(results.map(r => r.column_name).join(', '));
    
    const [results2] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'censo_caracteristicas_familiar';");
    console.log("\nCensoCaracteristicasFamiliar columns:");
    console.log(results2.map(r => r.column_name).join(', '));

    const [results3] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'censo_situacion_vivienda';");
    console.log("\nCensoSituacionVivienda columns:");
    console.log(results3.map(r => r.column_name).join(', '));
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}
check();

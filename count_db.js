const db = require('./backend/models');

async function count() {
  const { Habitante, CensoCaracteristicaFamiliar, sequelize } = db;
  const habs = await Habitante.count();
  const fams = await CensoCaracteristicaFamiliar.count();
  console.log('Habitantes (Legacy):', habs);
  console.log('CensoCaracteristicaFamiliar (Nuevos):', fams);
  
  const allHabs = await Habitante.findAll({ attributes: ['id', 'nombres', 'apellidos', 'cedula', 'incapacitado', 'fecha_nacimiento']});
  console.log('Habitantes Legacy data:', allHabs.map(h => h.toJSON()));

  const allFams = await CensoCaracteristicaFamiliar.findAll({ attributes: ['id', 'nombres_apellidos', 'cedula_identidad', 'discapacidad_tipo']});
  console.log('CensoCaracteristicaFamiliar data:', allFams.map(f => f.toJSON()));

  await sequelize.close();
}

count().catch(console.error);

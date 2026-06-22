const path = require('path');
const db = require('./backend/models');

async function check() {
  const Habitante = db.Habitante;
  const count = await Habitante.count();
  const all = await Habitante.findAll();
  console.log("Total Habitantes:", count);
  all.forEach(h => {
    console.log(`ID: ${h.id}, Ced: ${h.cedula}, Nom: ${h.nombres}, Act: ${h.activo}, CC: ${h.consejo_comunal_id}`);
  });
  process.exit();
}
check();

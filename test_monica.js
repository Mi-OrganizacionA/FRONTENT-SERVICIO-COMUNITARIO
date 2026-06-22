const fs = require('fs');
const json = JSON.parse(fs.readFileSync('C:/Users/ADMIN/Downloads/misty-thunder-15850747_production_neondb_2026-06-21_10-39-08.json', 'utf8'));
const estudios = json.find(t => t.table === 'estudios_demograficos').data;
const monica = estudios.find(e => e.encuestado_nombre.includes('Monica'));
console.log('Estudio:', monica);

const familiares = json.find(t => t.table === 'censo_caracteristicas_familiares').data;
const fams_monica = familiares.filter(f => f.id_estudio === monica.id);
console.log('Familiares de Monica:', fams_monica);

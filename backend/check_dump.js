const fs = require('fs');

const dumpPath = 'c:\\Users\\ADMIN\\Downloads\\misty-thunder-15850747_production_neondb_2026-06-21_10-39-08.json';

try {
  const data = fs.readFileSync(dumpPath, 'utf8');
  const db = JSON.parse(data);
  const atributosPaso9 = db.filter(r => r.tabla === 'censo_participacion_comunitaria');
  console.log('Columnas de censo_participacion_comunitaria:');
  atributosPaso9.forEach(a => console.log(`- ${a.atributo} (${a.tipo_de_dato})`));
  
  const opcionesMult = db.filter(r => r.tabla === 'censo_opciones_multiples');
  console.log('\nColumnas de censo_opciones_multiples:');
  opcionesMult.forEach(a => console.log(`- ${a.atributo} (${a.tipo_de_dato})`));
} catch (e) {
  console.error('Error al procesar el JSON:', e);
}

const fs = require('fs');
const json = JSON.parse(fs.readFileSync('c:\\Users\\ADMIN\\Downloads\\misty-thunder-15850747_production_neondb_2026-06-21_10-39-08.json', 'utf8'));
const habitantes = json.filter(j => j.tabla === 'habitantes');
if (habitantes.length > 0) {
  console.log("Habitantes in schema found, but it's just schema, let's look for data");
}
const dataRows = json.filter(j => j.type === 'table' && j.name === 'habitantes');
console.log(dataRows);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:\\Users\\J\\Downloads\\misty-thunder-15850747_production_neondb_2026-06-19_13-02-20.json', 'utf8'));
const tables = [...new Set(data.map(d => d.tabla))];
console.log("Tables in JSON:", tables);

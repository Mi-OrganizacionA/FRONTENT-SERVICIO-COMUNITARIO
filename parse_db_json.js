const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const tables = {};
for (const row of data) {
  if (!tables[row.tabla]) tables[row.tabla] = [];
  tables[row.tabla].push(row.atributo);
}
const targetTables = Object.keys(tables).filter(t => t.startsWith('censo_') || t === 'estudios_demograficos');
const out = {};
for (const t of targetTables) out[t] = tables[t];
console.log(JSON.stringify(out, null, 2));

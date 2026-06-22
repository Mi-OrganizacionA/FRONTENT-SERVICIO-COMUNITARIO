const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:\\FRONTENT-SERVICIO-COMUNITARIO\\backend\\database.sqlite');

db.all("SELECT id, cedula, nombres, apellidos, activo, consejo_comunal_id, fecha_registro FROM habitantes", [], (err, rows) => {
  if (err) {
    throw err;
  }
  console.log("Total in DB:", rows.length);
  const active = rows.filter(r => r.activo);
  console.log("Total active:", active.length);
  console.log("All rows:", rows);
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
  if (err) console.error(err);
  console.log(rows);
  db.all("SELECT rol, COUNT(*) FROM usuarios GROUP BY rol;", (err2, rows2) => {
    if (err2) console.error(err2);
    console.log(rows2);
    db.close();
  });
});

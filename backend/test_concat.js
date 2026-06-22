const { Sequelize } = require('sequelize');
const s = new Sequelize('sqlite::memory:');
s.query("SELECT CONCAT('A', 'B') AS val").then(console.log).catch(console.error);

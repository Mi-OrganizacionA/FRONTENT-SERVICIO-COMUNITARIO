const express = require('express');
const { initSQLite } = require('./config/database');
const { initModels } = require('./models');
const SearchController = require('./controllers/searchController');

async function test() {
  try {
    const db = await initSQLite();
    const models = await initModels(db);
    SearchController.setModels(models);

    const req = {
      query: { q: 'ca' },
      user: { rol: 'vocero', id_comunidad_asignada: 1 }
    };
    const res = {
      json: (data) => console.log('RESULTS:', data.length)
    };
    const next = (err) => console.error('NEXT ERROR:', err);

    await SearchController.globalSearch(req, res, next);
  } catch (e) {
    console.error('INIT ERROR:', e);
  }
}
test();

const db = require('./backend/models');
const HabitantesController = require('./backend/controllers/habitantesController');
const CensoReportesService = require('./backend/services/censoReportesService');
const { Op } = require('sequelize');

async function test() {
  // Simulate req for HabitantesController
  const reqAdmin = { query: {}, user: { rol: 'admin' } };
  const resAdmin = {
    json: (data) => console.log('Admin HabitantesController count:', data.total, 'Array length:', data.habitantes.length)
  };
  await HabitantesController.getAll(reqAdmin, resAdmin);

  const reqVocero = { query: {}, user: { rol: 'vocero', id_comunidad_asignada: 1 } };
  const resVocero = {
    json: (data) => console.log('Vocero HabitantesController count:', data.total, 'Array length:', data.habitantes.length)
  };
  await HabitantesController.getAll(reqVocero, resVocero);

  // Simulate CensoReportesService
  const kpisAdmin = await CensoReportesService.getKpis(db, {});
  console.log('Admin CensoReportesService totalPersonas:', kpisAdmin.totalPersonas);

  const kpisVocero = await CensoReportesService.getKpis(db, { consejo_id: 1 });
  console.log('Vocero CensoReportesService totalPersonas:', kpisVocero.totalPersonas);
}

test().catch(console.error).finally(() => process.exit(0));

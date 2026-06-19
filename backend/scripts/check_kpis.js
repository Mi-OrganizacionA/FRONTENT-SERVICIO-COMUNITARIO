const models = require('./models');
const CensoReportesService = require('./services/censoReportesService');

(async () => {
  try {
    await models.sequelize.authenticate();
    console.log('Conectado a DB');
    const kpis = await CensoReportesService.getKpis(models, { consejo_id: '1' });
    console.log('KPIs:', kpis);
  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    process.exit(0);
  }
})();

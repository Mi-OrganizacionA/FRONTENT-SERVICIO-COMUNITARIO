const { Sequelize } = require('sequelize');
const db = require('./models');
const AuthController = require('./controllers/authController');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './sicag.sqlite'
});

db.initModels(sequelize).then(async (models) => {
  AuthController.setUsuarioModel(models.Usuario);
  AuthController.setBandejaModel(models.BandejaValidaciones);
  
  const req = { body: { email: 'admin@sicag.com' } };
  const res = {
    status: (code) => ({
      json: (data) => console.log('Response:', code, data)
    }),
    json: (data) => console.log('Response:', 200, data)
  };
  
  await AuthController.requestCode(req, res);
  
  const pend = await models.BandejaValidaciones.findAll({ where: { tabla_afectada: 'recuperacion_clave' } });
  console.log('Pending recoveries:', pend.map(p => p.toJSON()));
  process.exit(0);
});

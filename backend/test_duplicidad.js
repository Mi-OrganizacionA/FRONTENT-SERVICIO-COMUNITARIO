const path = require('path');
process.env.NODE_ENV = 'development';
process.env.DB_TYPE = 'sqlite';

const { initDatabase } = require('./config/database');
const { initModels } = require('./models');
const estudioDemograficoController = require('./controllers/estudioDemograficoController');

async function main() {
  console.log('=== TEST: Validación de Duplicidad de Habitantes ===\n');

  const sequelize = await initDatabase();
  const db = await initModels(sequelize);
  db.sequelize = sequelize;
  await sequelize.sync({ force: true });
  
  estudioDemograficoController.setModels(db);
  estudioDemograficoController.setModel(db.EstudioDemografico);

  console.log('1. Creando registros iniciales...');
  await db.ConsejoComunal.create({ id: 1, nombre_comunidad: 'Prueba', activo: true });
  
  // Create an inhabitant that will be our test subject
  await db.Habitante.create({ 
    id: 100, 
    cedula: '12345678', 
    nombres: 'Juan', 
    apellidos: 'Perez', 
    consejo_comunal_id: 1, 
    activo: true,
    fecha_nacimiento: '1990-01-01',
    genero: 'Masculino'
  });

  // Create an existing census where Juan is the Jefe
  await db.EstudioDemografico.create({ 
    id: 1, 
    id_comunidad: 1, 
    planilla_nro: 'CENSO-001',
    encuestado_cedula: '12345678',
    encuestado_nombre: 'Juan Perez',
    jefe_habitante_id: 100,
    activo: true 
  });
  console.log('✅ Creado EstudioDemografico ID: 1 con Jefe cedula 12345678');

  // Test the new verification endpoint
  console.log('\n2. Probando endpoint verificarHabitanteCensado...');
  const mockReqVerificar = { params: { cedula: '12345678' } };
  let resVerificar = null;
  const mockResVerificar = {
    json: (data) => { resVerificar = data; },
    status: (code) => ({ json: (data) => { resVerificar = { ...data, statusCode: code }; } })
  };

  await estudioDemograficoController.verificarHabitanteCensado(mockReqVerificar, mockResVerificar);
  console.log('Respuesta endpoint verificarHabitanteCensado:', resVerificar);

  if (resVerificar && resVerificar.censado === true) {
    console.log('✅ Endpoint detecta correctamente al Jefe duplicado.');
  } else {
    console.log('❌ Falló el endpoint al detectar duplicado.');
  }

  console.log('\n3. Probando guardarPaso para un NUEVO censo intentando usar la misma cédula (12345678) como Jefe...');
  // Create a new draft census
  await db.EstudioDemografico.create({ id: 2, id_comunidad: 1, planilla_nro: 'CENSO-002', activo: false });

  const mockReqGuardar = {
    body: {
      paso: 3,
      id_estudio: 2,
      datos: {
        encuestado_cedula: '12345678',
        encuestado_nombre: 'Juan Perez',
        jefe_habitante_id: 100,
        familiares: []
      }
    },
    user: { id: 1, rol: 'admin' }
  };

  let resGuardar = null;
  let errorOcurrido = null;
  const mockResGuardar = {
    json: (data) => { resGuardar = data; },
    status: (code) => ({ json: (data) => { resGuardar = { ...data, statusCode: code }; } })
  };

  try {
    await estudioDemograficoController.guardarPaso(mockReqGuardar, mockResGuardar, (err) => { errorOcurrido = err; });
  } catch(e) {
    errorOcurrido = e;
  }

  if (errorOcurrido) {
    console.log('✅ Excepción capturada correctamente:');
    console.log('   Mensaje:', errorOcurrido.message);
  } else {
    console.log('❌ El backend NO detectó el conflicto o falló inesperadamente:', resGuardar);
  }

  await sequelize.close();
  console.log('\n✅ Test completado.');
}

main().catch(console.error);

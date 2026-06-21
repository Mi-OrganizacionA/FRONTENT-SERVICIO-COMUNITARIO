process.env.NODE_ENV = 'development';
process.env.DB_TYPE = 'sqlite';
const { initDatabase } = require('./config/database');
const { initModels } = require('./models');
const estudioDemograficoController = require('./controllers/estudioDemograficoController');

async function runTest() {
  try {
    console.log("Iniciando prueba de guardado del Paso 5 (Economía)...");
    
    // Conectar a la base de datos
    const sequelize = await initDatabase();
    const db = await initModels(sequelize);
    await sequelize.sync();
    console.log("Conectado a la BD y modelos inicializados.");
    
    // Necesitamos crear un ConsejoComunal de prueba para la llave foránea
    const [comunidad] = await db.ConsejoComunal.findOrCreate({
      where: { nombre_comunidad: 'Comunidad Prueba Paso 5' },
      defaults: {
        nombre_comunidad: 'Comunidad Prueba Paso 5',
        descripcion: 'TEST',
        ubicacion: 'TEST'
      }
    });

    // Crear un estudio demográfico de prueba
    const estudio = await db.EstudioDemografico.create({
      id_comunidad: comunidad.id,
      estado_estudio: 'Borrador',
      identificador_encuestador: 'TEST_PASO_5',
      fecha_creacion: new Date()
    });
    console.log(`Estudio Demográfico creado con ID: ${estudio.id}`);

    // Simular el payload del Frontend para el Paso 5
    // Simularemos los valores mapeados de "recolectarDatosDelPaso(5)"
    const payloadPaso5 = {
      paso: 5,
      id_estudio: estudio.id,
      datos: {
        // En el frontend se recogen con el id del html en formato snake_case
        trabaja: 'Si',
        donde_trabaja: 'Empresa Privada',
        ingreso_familiar_rango: '2-5 salarios',
        actividad_comercial_vivienda: 'No'
      }
    };

    // Crear un mock de req, res y next
    const mockReq = { body: payloadPaso5 };
    const mockRes = {
      status: function(s) { this.statusCode = s; return this; },
      json: function(data) { console.log("Respuesta del Controller:", data); }
    };
    const mockNext = function(err) { console.error("Error capturado por next():", err); };

    // Inyectar db.sequelize para que el controlador pueda usar la transacción correctamente
    db.sequelize = sequelize;
    estudioDemograficoController.setModels(db);
    
    // Ejecutar guardarPaso
    console.log("Enviando payload al Controller...");
    await estudioDemograficoController.guardarPaso(mockReq, mockRes, mockNext);

    // Verificar si se guardó en la tabla censo_situacion_economica
    const situacionGuardada = await db.CensoSituacionEconomica.findOne({
      where: { id_estudio: estudio.id }
    });

    if (situacionGuardada) {
      console.log("\n✅ ÉXITO: Los datos se guardaron en la base de datos.");
      console.log("Rango de Ingreso Familiar guardado:", situacionGuardada.ingreso_familiar_rango);
      console.log("Trabaja:", situacionGuardada.trabaja);
      console.log("Dónde trabaja:", situacionGuardada.donde_trabaja);
    } else {
      console.log("\n❌ ERROR: No se encontró el registro en censo_situacion_economica.");
    }

    // Limpiar BD
    console.log("Limpiando datos de prueba...");
    await estudio.destroy();
    await comunidad.destroy();
    
    process.exit(0);
  } catch (error) {
    console.error("Error durante el test:", error);
    process.exit(1);
  }
}

runTest();

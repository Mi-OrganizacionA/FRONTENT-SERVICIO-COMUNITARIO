/**
 * Script de prueba: guarda el paso 9 directamente contra el backend local
 * para verificar qué errores ocurren al procesar CensoParticipacionComunitaria
 * 
 * Ejecutar con: node backend/test_paso9.js
 */

const path = require('path');
// Simular el entorno de producción localmente
process.env.NODE_ENV = 'development';
process.env.DB_TYPE = 'sqlite';

const { initDatabase } = require('./config/database');
const { initModels } = require('./models');
const estudioDemograficoController = require('./controllers/estudioDemograficoController');

async function main() {
  console.log('=== TEST: Guardado del Paso 9 (Participación Comunitaria) ===\n');

  // Inicializar BD
  const sequelize = await initDatabase();
  const db = await initModels(sequelize);
  db.sequelize = sequelize;
  await sequelize.sync({ force: true });
  
  // Inyectar modelos al controlador
  estudioDemograficoController.setModels(db, db.EstudioDemografico);

  // Buscar o crear un estudio demográfico existente para hacer la prueba
  let estudio = await db.EstudioDemografico.findOne({ order: [['id', 'DESC']] });
  if (!estudio) {
    await db.ConsejoComunal.create({ id: 1, nombre_comunidad: 'Prueba', activo: true });
    estudio = await db.EstudioDemografico.create({ id: 1, id_comunidad: 1, activo: true });
  }
  
  const id_estudio = estudio.id;
  console.log(`✅ Usando estudio ID: ${id_estudio}\n`);

  // Datos del paso 9 como vendría del frontend
  const datosStep9 = {
    existen_org_comunitarias: 'Si',
    cuales_org_comunitarias: 'Comité de Salud',
    participa_usted: 'Si',
    participa_familiar: 'No',
    asiste_asambleas: 'Si',
    dispuesto_apoyar: 'Si',
    cree_pueblo_interviene_decisiones: 'No',
    acuerdo_pueblo_protagonismo_presupuesto: 'Si',  // ← EL CAMPO PROBLEMÁTICO
    por_que_no_asiste: '',
    como_resolver_problemas: 'Con reuniones comunitarias',
    quien_resolver_problemas: 'El consejo comunal',
    area_trabajo_interes: 'Salud',
    como_apoyaria_proyectos: 'Con trabajo voluntario',
    compromiso_con_sector: 'Participar activamente',
    opinion_censo_energetico: 'Muy importante',
    // Opciones (misiones)
    opciones: [
      { categoria: 'misiones', valor: 'CLAP', cantidad: 1 },
      { categoria: 'misiones', valor: 'Barrio Adentro', cantidad: 1 }
    ]
  };

  console.log('📤 Datos del paso 9 enviados:');
  console.log(JSON.stringify(datosStep9, null, 2));

  // Simular req/res
  const mockReq = {
    body: {
      paso: 9,
      id_estudio: id_estudio,
      datos: datosStep9
    },
    user: { id: 1, rol: 'admin' }
  };

  let respuesta = null;
  let errorOcurrido = null;

  const mockRes = {
    json: (data) => { respuesta = data; },
    status: (code) => ({ json: (data) => { respuesta = { ...data, statusCode: code }; } })
  };

  const next = (err) => { errorOcurrido = err; };

  console.log('\n🚀 Ejecutando guardarPaso...\n');
  
  try {
    await estudioDemograficoController.guardarPaso(mockReq, mockRes, next);
  } catch (e) {
    errorOcurrido = e;
  }

  if (errorOcurrido) {
    console.error('❌ ERROR al guardar el paso 9:');
    console.error(errorOcurrido.message || errorOcurrido);
    console.error(errorOcurrido.stack);
  } else if (respuesta) {
    console.log('✅ Respuesta del servidor:', JSON.stringify(respuesta, null, 2));
    
    // Verificar en la BD
    const registro = await db.CensoParticipacionComunitaria.findOne({ where: { id_estudio } });
    if (registro) {
      console.log('\n📊 Registro guardado en BD:');
      console.log(JSON.stringify(registro.toJSON(), null, 2));
      
      const campoPresupuesto = registro.acuerdo_pueblo_protagonismo_presupuesto;
      if (campoPresupuesto === true || campoPresupuesto === 1) {
        console.log('\n✅ CAMPO PRESUPUESTO GUARDADO CORRECTAMENTE como true');
      } else {
        console.log(`\n❌ CAMPO PRESUPUESTO: ${campoPresupuesto} (esperado: true)`);
      }
    } else {
      console.log('❌ No se encontró registro en censo_participacion_comunitaria');
    }

    // Verificar misiones
    const misiones = await db.CensoOpcionMultiple.findAll({ where: { id_estudio, categoria: 'misiones' } });
    if (misiones.length > 0) {
      console.log('\n✅ Misiones guardadas:');
      misiones.forEach(m => console.log(`   - ${m.valor}`));
    } else {
      console.log('\n⚠️  No se encontraron misiones guardadas');
    }
  }

  await sequelize.close();
  console.log('\n✅ Test completado.');
}

main().catch(e => {
  console.error('Error fatal:', e);
  process.exit(1);
});

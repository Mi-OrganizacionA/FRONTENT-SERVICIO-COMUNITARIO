const { initDatabase } = require('../config/database');
const { initModels } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Iniciando semilla de base de datos...');
  const sequelize = await initDatabase();
  const models = await initModels(sequelize);
  const { Usuario, Habitante, ConsejoComunal, Configuracion } = models;

  try {
    console.log('Sincronizando modelos con la base de datos...');
    await sequelize.sync({ alter: true });
    
    // 1. Semilla de Consejos Comunales (Idempotente)
    const consejos = ['Jobito I', 'Jobito II', 'Brisas del Yurubí', 'Cacique Tamanaco', 'La Esperanza'];
    console.log('--- Verificando Consejos Comunales ---');
    for (const nombre of consejos) {
      const [cc, created] = await ConsejoComunal.findOrCreate({
        where: { nombre_comunidad: nombre },
        defaults: {
          descripcion: `Consejo comunal de ${nombre}`,
          ubicacion: 'San Felipe, Yaracuy',
          responsable: 'Por asignar',
          activo: true
        }
      });
      if (created) console.log(`[+] Consejo Comunal creado: ${nombre}`);
    }

    // 2. Semilla de Usuarios Administradores y Voceros
    console.log('\n--- Verificando Usuarios ---');
    const adminEmail = 'admin@sicag.com';
    let admin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('alvaro.09', 10);
      admin = await Usuario.create({
        nombre: 'Administrador Principal',
        email: adminEmail,
        credenciales: hashedPassword,
        rol: 'admin',
        id_comunidad_asignada: null,
        activo: true
      });
      console.log(`[+] Usuario admin creado: ${adminEmail} (Clave: alvaro.09)`);
    } else {
      console.log(`[=] Usuario admin ya existe: ${adminEmail}`);
    }

    // Voceros de prueba
    const voceros = [
      { email: 'vocero_jobito1@sicag.com', nombre: 'Vocero Jobito I', id_comunidad: 1 },
      { email: 'vocero_jobito2@sicag.com', nombre: 'Vocero Jobito II', id_comunidad: 2 }
    ];

    for (const v of voceros) {
      let vocero = await Usuario.findOne({ where: { email: v.email } });
      if (!vocero) {
        const hash = await bcrypt.hash('vocero.09', 10);
        await Usuario.create({
          nombre: v.nombre,
          email: v.email,
          credenciales: hash,
          rol: 'vocero',
          id_comunidad_asignada: v.id_comunidad,
          activo: true
        });
        console.log(`[+] Vocero creado: ${v.email} (Clave: vocero.09)`);
      } else {
        console.log(`[=] Vocero ya existe: ${v.email}`);
      }
    }

    // 2.5 Semilla de Configuración
    console.log('\n--- Verificando Configuración del Sistema ---');
    const configs = [
      { clave: 'Aprobación Automática Global', valor: 'false', descripcion: 'Master switch para omitir validaciones.' },
      { clave: 'Aprobación Automática Habitantes', valor: 'false', descripcion: 'Auto aprobar nuevos habitantes.' },
      { clave: 'Aprobación Automática Noticias', valor: 'false', descripcion: 'Auto aprobar noticias en cartelera.' },
      { clave: 'Aprobación Automática Proyectos', valor: 'false', descripcion: 'Auto aprobar proyectos de infraestructura.' },
      { clave: 'Aprobación Automática Organizaciones', valor: 'false', descripcion: 'Auto aprobar agrupaciones sociales.' },
      { clave: 'Aprobación Automática Reportes', valor: 'false', descripcion: 'Auto aprobar reportes globales inter-comunales.' },
      { clave: 'Censo', valor: 'true', descripcion: 'Activa o desactiva el censo comunitario.' }
    ];

    for (const c of configs) {
      const [conf, created] = await Configuracion.findOrCreate({
        where: { clave: c.clave },
        defaults: c
      });
      if (created) console.log(`[+] Configuración creada: ${c.clave}`);
    }

    // 3. Semilla de Habitantes (Datos para pruebas de autocompletado)
    console.log('\n--- Verificando Habitantes de Prueba ---');
    const habitantesFake = [
      {
        nombres: 'Juan Carlos',
        apellidos: 'Pérez López',
        cedula: '12345678',
        fecha_nacimiento: '1980-05-15',
        genero: 'Masculino',
        estado_civil: 'Casado',
        nivel_educativo: 'Universitario',
        ocupacion: 'Ingeniero',
        telefono: '0414-1234567',
        condicion_salud: 'Sano',
        consejo_comunal_id: 1, // Jobito I
        sector: 'Sector A',
        calle: 'Calle 1',
        nro_casa: '10'
      },
      {
        nombres: 'María Teresa',
        apellidos: 'Gómez Rivas',
        cedula: '87654321',
        fecha_nacimiento: '1992-10-20',
        genero: 'Femenino',
        estado_civil: 'Soltero',
        nivel_educativo: 'Técnico',
        ocupacion: 'Enfermera',
        telefono: '0424-9876543',
        condicion_salud: 'Asma',
        consejo_comunal_id: 2, // Jobito II
        sector: 'Sector B',
        calle: 'Calle Principal',
        nro_casa: '2B'
      }
    ];

    for (const h of habitantesFake) {
      const [hab, created] = await Habitante.findOrCreate({
        where: { cedula: h.cedula },
        defaults: h
      });
      if (created) {
        console.log(`[+] Habitante creado: ${h.nombres} ${h.apellidos} (C.I: ${h.cedula})`);
      } else {
        console.log(`[=] Habitante ya existe: C.I: ${h.cedula}`);
      }
    }

    console.log('\nSemilla finalizada con éxito.');
  } catch (error) {
    console.error('Error durante la semilla:', error);
  } finally {
    await sequelize.close();
  }
}

// Permitir ejecución directa desde package.json: `node scripts/seed.js`
if (require.main === module) {
  seed();
}

module.exports = seed;

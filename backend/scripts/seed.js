const { initSQLite } = require('../config/database');
const Usuario = require('../models/Usuario');
const Habitante = require('../models/Habitante');
const ConsejoComunal = require('../models/ConsejoComunal');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('Iniciando semilla de base de datos...');
  const sequelize = await initSQLite();

  try {
    // 1. Semilla de Consejos Comunales (Idempotente)
    const consejos = ['Jobito I', 'Jobito II', 'Brisas del Yurubí', 'Cacique Tamanaco', 'La Esperanza'];
    console.log('--- Verificando Consejos Comunales ---');
    for (const nombre of consejos) {
      const [cc, created] = await ConsejoComunal.findOrCreate({
        where: { nombre },
        defaults: {
          codigo_registro: `CC-${nombre.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          comunidad: nombre,
          vocero_principal: null,
          fecha_fundacion: '2020-01-01',
          estatus: 'activo'
        }
      });
      if (created) console.log(`[+] Consejo Comunal creado: ${nombre}`);
    }

    // 2. Semilla de Usuarios Administradores (Idempotente)
    console.log('\n--- Verificando Usuarios ---');
    const adminEmail = 'admin@sicag.com';
    let admin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await Usuario.create({
        nombres: 'Administrador',
        apellidos: 'Sistema',
        email: adminEmail,
        password: hashedPassword,
        rol: 'admin',
        activo: true
      });
      console.log(`[+] Usuario admin creado: ${adminEmail} (Clave: admin123)`);
    } else {
      console.log(`[=] Usuario admin ya existe: ${adminEmail}`);
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

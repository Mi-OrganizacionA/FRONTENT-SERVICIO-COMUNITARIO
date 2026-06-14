/**
 * Script de corrección de Consejos Comunales
 * Actualiza los nombres incorrectos en la base de datos para que coincidan
 * con la lista real de la Comuna Socialista Agroecológica Simón Rodríguez.
 *
 * Ejecutar con: node backend/scripts/fix_consejos.js
 */
const { initDatabase } = require('../config/database');
const { initModels } = require('../models');

async function fixConsejos() {
  console.log('🔧 Iniciando corrección de Consejos Comunales...');
  const sequelize = await initDatabase();
  const models = await initModels(sequelize);
  const { ConsejoComunal } = models;

  // Mapa de corrección: id => nombre correcto
  // El seed anterior creó: 1=Jobito I, 2=Jobito II, 3=Brisas del Yurubí, 4=Cacique Tamanaco, 5=La Esperanza
  // Los nombres correctos según el frontend (censo.html) son:
  const correcciones = [
    { id: 1, nombre_correcto: 'Jobito I' },
    { id: 2, nombre_correcto: 'Jobito II' },
    { id: 3, nombre_correcto: 'Brisas del Yurubí' },
    { id: 4, nombre_correcto: 'Andrés Eloy Blanco' },    // era: Cacique Tamanaco
    { id: 5, nombre_correcto: 'Las Mercedes I' },          // era: La Esperanza
    { id: 6, nombre_correcto: 'Las Mercedes II' },
    { id: 7, nombre_correcto: 'Santa Cruz de las Mercedes' },
    { id: 8, nombre_correcto: 'Fortaleza del Corozo' },
    { id: 9, nombre_correcto: 'Vencedores del Corozo' },
    { id: 10, nombre_correcto: 'Toda la Comuna' },
  ];

  // Crear los que no existen y corregir los que están mal
  for (const c of correcciones) {
    const existente = await ConsejoComunal.findByPk(c.id);
    if (existente) {
      if (existente.nombre_comunidad !== c.nombre_correcto) {
        console.log(`✏️  Corrigiendo ID ${c.id}: "${existente.nombre_comunidad}" → "${c.nombre_correcto}"`);
        await existente.update({ nombre_comunidad: c.nombre_correcto });
      } else {
        console.log(`✅ ID ${c.id}: "${existente.nombre_comunidad}" (ya correcto)`);
      }
    } else {
      console.log(`➕ Creando ID ${c.id}: "${c.nombre_correcto}"`);
      await ConsejoComunal.create({
        id: c.id,
        nombre_comunidad: c.nombre_correcto,
        descripcion: `Consejo Comunal ${c.nombre_correcto}`,
        ubicacion: 'San Felipe, Yaracuy',
        responsable: 'Por asignar',
        activo: true
      });
    }
  }

  // Eliminar consejos con nombres inválidos que sobren (por si quedaron residuos)
  const nombres_validos = correcciones.map(c => c.nombre_correcto);
  const invalidos = await ConsejoComunal.findAll({
    where: {
      nombre_comunidad: { [require('sequelize').Op.notIn]: nombres_validos }
    }
  });
  for (const inv of invalidos) {
    console.log(`🗑️  Eliminando consejo inválido ID ${inv.id}: "${inv.nombre_comunidad}"`);
    await inv.destroy();
  }

  console.log('\n✅ Corrección finalizada.');
  await sequelize.close();
}

fixConsejos().catch(err => {
  console.error('❌ Error durante la corrección:', err);
  process.exit(1);
});

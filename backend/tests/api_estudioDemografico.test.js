const path = require('path');
const dbFile = path.join(__dirname, 'tmp-estudio-test.sqlite');
process.env.DB_TYPE = 'sqlite';
process.env.SQLITE_STORAGE = dbFile;

const request = require('supertest');
const { setupTestApp } = require('./testHelper');
const fs = require('fs');
const jwt = require('jsonwebtoken');

jest.setTimeout(30000);

describe('API Estudio Demográfico', () => {
  let app, sequelize, models;
  let tokenAdmin, tokenVocero;
  const dbFile = path.join(__dirname, 'tmp-estudio-test.sqlite');

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_STORAGE = dbFile;
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

    const setup = await setupTestApp();
    app = setup.app;
    sequelize = setup.sequelize;
    models = setup.models;

    tokenAdmin = jwt.sign({ id: 1, rol: 'admin', nombre: 'Test Admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    tokenVocero = jwt.sign({ id: 2, rol: 'vocero', nombre: 'Test Vocero', id_comunidad_asignada: 10 }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // Seed required data
    await models.ConsejoComunal.create({ id: 10, nombre_comunidad: 'Consejo Prueba', codigo_situr: 'SITUR-123' });
    await models.Usuario.create({ id: 100, nombre: 'Vocero 100', email: 'vocero100@test.com', credenciales: 'hash', rol: 'vocero', id_comunidad_asignada: 10, activo: true });
  });

  afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    delete process.env.DB_TYPE;
    delete process.env.SQLITE_STORAGE;
  });

  describe('POST /api/estudios-demograficos/paso', () => {
    it('debe registrar el primer paso (identificación) y devolver id_estudio', async () => {
      const res = await request(app)
        .post('/api/estudios-demograficos/paso')
        .set('Authorization', `Bearer ${tokenVocero}`)
        .send({
          paso: 1,
          datos: {
            consejo_comunal_id: 10,
            nombres: 'Familia',
            apellidos: 'Perez',
            jefe_cedula: '12345678',
            cantidad_habitantes: 3,
            estado: 'Lara',
            municipio: 'Iribarren',
            parroquia: 'Catedral',
            calle_avenida: 'Av 20',
            nro_casa: '15-20'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.id_estudio).toBeDefined();
    });

    it('debe registrar el segundo paso referenciando el id_estudio anterior', async () => {
      // First, create the study
      const estudio = await models.EstudioDemografico.create({
        id_comunidad: 10, jefe_nombres: 'Test', jefe_apellidos: 'Test', jefe_cedula: '8888', cantidad_habitantes: 1, estado: 'Test', municipio: 'Test', parroquia: 'Test', calle_avenida: 'Test', nro_casa: '1'
      });

      const res = await request(app)
        .post('/api/estudios-demograficos/paso')
        .set('Authorization', `Bearer ${tokenVocero}`)
        .send({
          paso: 2,
          id_estudio: estudio.id,
          datos: {
            tipo_vivienda: 'casa',
            condicion_vivienda: 'propia',
            material_paredes: 'bloque',
            material_techo: 'platabanda',
            material_piso: 'ceramica',
            nro_habitaciones: 3
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify saved in DB
      const situacion = await models.CensoSituacionVivienda.findOne({ where: { id_estudio: estudio.id } });
      expect(situacion).toBeDefined();
      expect(situacion.tipo_vivienda).toBe('casa');
    });

    it('debe fallar si faltan datos requeridos en el paso 1', async () => {
      const res = await request(app)
        .post('/api/estudios-demograficos/paso')
        .set('Authorization', `Bearer ${tokenVocero}`)
        .send({
          paso: 1,
          datos: {
            nombres: 'Familia'
            // Faltan campos como apellidos, jefe_cedula, etc.
          }
        });

      // Se espera un error de validación o del controlador
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});

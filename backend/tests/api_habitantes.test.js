const path = require('path');
const dbFile = path.join(__dirname, 'tmp-habitantes-test.sqlite');
process.env.DB_TYPE = 'sqlite';
process.env.SQLITE_STORAGE = dbFile;

const request = require('supertest');
const { setupTestApp } = require('./testHelper');
const fs = require('fs');
const jwt = require('jsonwebtoken');

jest.setTimeout(30000);

describe('API Habitantes', () => {
  let app, sequelize, models;
  let tokenAdmin, tokenVocero, tokenSimulado;
  const dbFile = path.join(__dirname, 'tmp-habitantes-test.sqlite');

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_STORAGE = dbFile;
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

    const setup = await setupTestApp();
    app = setup.app;
    sequelize = setup.sequelize;
    models = setup.models;

    // Create test roles and tokens
    tokenAdmin = jwt.sign({ id: 1, rol: 'admin', nombre: 'Test Admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    tokenVocero = jwt.sign({ id: 2, rol: 'vocero', nombre: 'Test Vocero', id_comunidad_asignada: 10 }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    tokenSimulado = 'simulado.simulado.simulado';

    // Seed some initial data
    await models.ConsejoComunal.create({ id: 10, nombre_comunidad: 'Consejo Prueba', codigo_situr: 'SITUR-123' });
    await models.ConsejoComunal.create({ id: 20, nombre_comunidad: 'Otro Consejo', codigo_situr: 'SITUR-456' });
    try {
      await models.Usuario.create({ id: 2, nombre: 'Vocero 100', email: 'vocero100@test.com', credenciales: 'hash', rol: 'vocero', id_comunidad_asignada: 10, activo: true });
    } catch (e) {
      require('fs').writeFileSync(__dirname + '/error.txt', require('util').inspect(e, {depth: null}));
      throw e;
    }
    await models.Usuario.create({ id: 101, nombre: 'Vocero 101', email: 'vocero101@test.com', credenciales: 'hash', rol: 'vocero', id_comunidad_asignada: 20, activo: true });
    await models.Usuario.create({ id: 1, nombre: 'Admin', email: 'admin@test.com', credenciales: 'hash', rol: 'admin', id_comunidad_asignada: null, activo: true });
    await models.Habitante.create({
      nombres: 'Juan',
      apellidos: 'Perez',
      cedula: '12345678',
      genero: 'M',
      fecha_nacimiento: '1990-01-01',
      consejo_comunal_id: 10,
      activo: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    delete process.env.DB_TYPE;
    delete process.env.SQLITE_STORAGE;
  });

  describe('GET /api/habitantes', () => {
    it('debe rechazar la petición sin token', async () => {
      const res = await request(app).get('/api/habitantes');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token no proporcionado');
    });

    it('debe devolver la lista de habitantes para un admin', async () => {
      const res = await request(app)
        .get('/api/habitantes')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.habitantes.length).toBe(1);
      expect(res.body.habitantes[0].nombres).toBe('Juan');
    });

    it('debe devolver la lista de habitantes para un vocero (limitado a su comunidad)', async () => {
      // Habitante de otra comunidad
      const otraComunidad = await models.ConsejoComunal.create({ id: 30, nombre_comunidad: 'Otra', codigo_situr: 'SITUR-999' });
      await models.Habitante.create({
        nombres: 'Maria',
        apellidos: 'Gomez',
        cedula: '87654321',
        fecha_nacimiento: '1985-05-05',
        genero: 'F',
        consejo_comunal_id: 20
      });

      const res = await request(app)
        .get('/api/habitantes')
        .set('Authorization', `Bearer ${tokenVocero}`);
      
      expect(res.status).toBe(200);
      expect(res.body.habitantes.length).toBe(1); // Solo Juan Perez de su comunidad (id 10)
      expect(res.body.habitantes[0].nombres).toBe('Juan');
    });
  });

  describe('POST /api/habitantes', () => {
    it('debe crear un nuevo habitante correctamente', async () => {
      const res = await request(app)
        .post('/api/habitantes')
        .set('Authorization', `Bearer ${tokenVocero}`)
        .send({
          nombres: 'Pedro',
          apellidos: 'Lopez',
          cedula: '11223344',
          fecha_nacimiento: '1995-10-10',
          genero: 'M',
          telefono: '04141234567',
          consejo_comunal_id: 10
        });
      
      console.log('CREATE HABITANTE RESPONSE:', res.body);
      expect(res.status).toBe(202);
      expect(res.body.mensaje).toBe('Solicitud de registro enviada a la bandeja de validaciones del administrador.');
    });

    it('debe rechazar si la cédula ya existe', async () => {
      const res = await request(app)
        .post('/api/habitantes')
        .set('Authorization', `Bearer ${tokenVocero}`)
        .send({
          nombres: 'Copia',
          apellidos: 'Juan',
          cedula: '12345678', // Ya existe
          fecha_nacimiento: '1990-01-01',
          genero: 'M',
          consejo_comunal_id: 10
        });
      
      expect(res.status).toBe(409); // Because standard validation handles unique constraint in 409 depending on implementation. 
      expect(res.body.error).toMatch(/ya registrad|ya existe/i);
    });
  });
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const app = require('../server');

function createToken(payload = {}) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: '1h' });
}

describe('Validación de rutas', () => {
  test('GET /api/habitantes con page inválido devuelve 400', async () => {
    const res = await request(app).get('/api/habitantes').query({ page: -1, limit: 10 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/page/);
  });

  test('GET /api/habitantes/publico/abc devuelve 400 para consejo_id inválido', async () => {
    const res = await request(app).get('/api/habitantes/publico/abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/consejo_id/);
  });

  test('GET /api/votaciones/abiertas/xyz devuelve 400 para consejo_id inválido', async () => {
    const res = await request(app).get('/api/votaciones/abiertas/xyz');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/consejo_id/);
  });

  test('POST /api/votaciones/abc/votar devuelve 400 para votacion_id inválido', async () => {
    const res = await request(app).post('/api/votaciones/abc/votar');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/votacion_id/);
  });

  test('GET /api/proyectos/abc devuelve 400 para id inválido', async () => {
    const res = await request(app).get('/api/proyectos/abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/id/);
  });

  test('POST /api/auth/login con body inválido devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'us', contraseña: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/usuario|contraseña/);
  });

  test('POST /api/habitantes con body inválido devuelve 400', async () => {
    const token = createToken({ id: 1, rol: 'vocero', consejo_comunal_id: 1 });
    const res = await request(app)
      .post('/api/habitantes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'A' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/cedula/);
  });

  test('POST /api/votaciones con body inválido devuelve 400', async () => {
    const token = createToken({ id: 2, rol: 'vocero', consejo_comunal_id: 1 });
    const res = await request(app)
      .post('/api/votaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ descripcion: 'Sin título' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/titulo/);
  });

  test('POST /api/proyectos con body inválido devuelve 400', async () => {
    const token = createToken({ id: 3, rol: 'admin', consejo_comunal_id: 1 });
    const res = await request(app)
      .post('/api/proyectos')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'X' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/consejo_comunal_id/);
  });

  test('POST /api/noticias con body inválido devuelve 400', async () => {
    const token = createToken({ id: 4, rol: 'admin' });
    const res = await request(app)
      .post('/api/noticias')
      .set('Authorization', `Bearer ${token}`)
      .send({ contenido: 'Falta título' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/titulo/);
  });

  test('POST /api/reportes con body inválido devuelve 400', async () => {
    const token = createToken({ id: 5, rol: 'admin' });
    const res = await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${token}`)
      .send({ contenido: 'Falta título y consejo' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/titulo/);
  });

  test('PUT /api/proyectos/abc devuelve 400 para id inválido', async () => {
    const token = createToken({ id: 3, rol: 'admin' });
    const res = await request(app)
      .put('/api/proyectos/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Proyecto mejorado', consejo_comunal_id: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/id/);
  });

  test('PUT /api/proyectos/:id con body inválido devuelve 400', async () => {
    const token = createToken({ id: 3, rol: 'admin' });
    const res = await request(app)
      .put('/api/proyectos/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'X' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/consejo_comunal_id/);
  });

  test('PUT /api/noticias/:id con body inválido devuelve 400', async () => {
    const token = createToken({ id: 4, rol: 'admin' });
    const res = await request(app)
      .put('/api/noticias/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ contenido: 'Sin título' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/titulo/);
  });

  test('PUT /api/reportes/:id con body inválido devuelve 400', async () => {
    const token = createToken({ id: 5, rol: 'admin' });
    const res = await request(app)
      .put('/api/reportes/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Reporte' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/consejo_comunal_id/);
  });

  test('DELETE /api/proyectos/abc devuelve 400 para id inválido', async () => {
    const token = createToken({ id: 3, rol: 'admin' });
    const res = await request(app)
      .delete('/api/proyectos/abc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/id/);
  });

  test('PUT /api/habitantes/abc devuelve 400 para id inválido', async () => {
    const token = createToken({ id: 1, rol: 'vocero', consejo_comunal_id: 1 });
    const res = await request(app)
      .put('/api/habitantes/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'María', cedula: '1234567' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/id/);
  });

  test('PUT /api/habitantes/:id con body inválido devuelve 400', async () => {
    const token = createToken({ id: 1, rol: 'admin', consejo_comunal_id: 1 });
    const res = await request(app)
      .put('/api/habitantes/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ genero: 'X' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/genero/);
  });

  test('DELETE /api/habitantes/abc devuelve 400 para id inválido', async () => {
    const token = createToken({ id: 5, rol: 'admin' });
    const res = await request(app)
      .delete('/api/habitantes/abc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/id/);
  });
});

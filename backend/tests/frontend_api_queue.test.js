/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

jest.setTimeout(20000);

describe('Frontend API offline queue', () => {
  let scriptSrc;

  beforeAll(() => {
    const apiPath = path.join(__dirname, '..', '..', 'js', 'api.js');
    scriptSrc = fs.readFileSync(apiPath, 'utf8');
  });

  beforeEach(() => {
    // Reset DOM/window provided by jest-environment-jsdom automatically
    localStorage.clear();
    // Mock fetch: allow seed.json, but throw for API POST
    global.fetch = jest.fn((url, opts) => {
      if (typeof url === 'string' && url.indexOf('data/seed.json') !== -1) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ habitantes: [], proyectos: [], noticias: [], config: {} }) });
      }
      // Simulate network error for other calls
      return Promise.reject(new Error('Network error'));
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('debe encolar un paso cuando la llamada falla por red', async () => {
    // Evaluate the api.js in the test environment (it will set window.api)
    // eslint-disable-next-line no-new-func
    new Function(scriptSrc)();

    // Esperar initMockData
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(window.api).toBeDefined();

    const res = await window.api.guardarPasoCenso(1, null, { prueba: 'datos' });
    expect(res).toBeDefined();
    // Cuando falla la red, our implementation should enqueue and return queued flag
    expect(res.queued === true || res.id_estudio).toBeTruthy();

    const raw = localStorage.getItem('sicag_censo_queue');
    expect(raw).toBeTruthy();
    const q = JSON.parse(raw);
    expect(Array.isArray(q)).toBe(true);
    expect(q.length).toBeGreaterThanOrEqual(1);
    expect(q[0].paso).toBe(1);
  });
});

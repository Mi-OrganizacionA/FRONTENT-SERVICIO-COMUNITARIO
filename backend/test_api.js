const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ path, status: res.statusCode, data }));
    }).on('error', err => resolve({ path, error: err.message }));
  });
};

(async () => {
  const r1 = await testEndpoint('/api/habitantes');
  const r2 = await testEndpoint('/api/viviendas');
  const r3 = await testEndpoint('/api/proyectos');
  const r4 = await testEndpoint('/api/noticias');
  
  console.log("habitantes:", r1.status, r1.data.substring(0, 100));
  console.log("viviendas:", r2.status, r2.data.substring(0, 100));
  console.log("proyectos:", r3.status, r3.data.substring(0, 100));
  console.log("noticias:", r4.status, r4.data.substring(0, 100));
})();

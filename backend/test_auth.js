const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ path, status: res.statusCode, data }));
    });

    req.on('error', err => resolve({ path, error: err.message }));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

(async () => {
  // Login
  const loginRes = await request('POST', '/api/auth/login', {
    usuario: 'admin',
    contraseña: 'admin123'
  });
  
  if (loginRes.status !== 200) {
    console.log("Login failed:", loginRes.data);
    return;
  }
  
  const token = JSON.parse(loginRes.data).token;
  console.log("Got token!");
  
  const r1 = await request('GET', '/api/habitantes', null, token);
  const r2 = await request('GET', '/api/noticias', null, token);
  
  console.log("habitantes:", r1.status, r1.data.substring(0, 500));
  console.log("noticias:", r2.status, r2.data.substring(0, 500));
})();

async function testCors() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'null'
      },
      body: JSON.stringify({ email: 'admin@sicag.com', password: 'alvaro.09' })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch(e) {
    console.error(e.message);
  }
}
testCors();

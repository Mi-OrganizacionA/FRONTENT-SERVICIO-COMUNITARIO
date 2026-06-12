async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'null' },
      body: JSON.stringify({ email: 'vocero_jobito1@sicag.com', password: 'vocero.09' })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch(e) {
    console.error(e.message);
  }
}
test();

async function run() {
  try {
    const data = {
      nombre_organizacion: "Cultura Y Tradicion",
      tipo_organizacion: "Movimiento Social",
      mision: "baile",
      contacto_telefono: "(0412) 680-2354",
      contacto_email: "macedanas@gmail.com"
    };
    const res = await fetch('http://localhost:3000/api/organizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const body = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', body);
  } catch(e) {
    console.error(e);
  }
}
run();

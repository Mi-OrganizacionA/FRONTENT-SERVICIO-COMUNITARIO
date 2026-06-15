async function run() {
  try {
    const data = {
      nombre_organizacion: "Cultura Y Tradiciondfg",
      tipo_organizacion: "Comite de Trabajo",
      mision: "baile",
      contacto_telefono: "(0412) 680-2389",
      contacto_email: "macedanas@gmail.com"
    };
    // Usar token simulado de admin (como lo hace el frontend en modo local)
    const res = await fetch('http://localhost:3000/api/organizaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token.simulado.admin'
      },
      body: JSON.stringify(data)
    });
    const body = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(body, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();

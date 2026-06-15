async function run() {
  try {
    const res = await fetch('https://sicag-api.onrender.com/api/organizaciones');
    const data = await res.json();
    console.log('Render Orgs:', JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();

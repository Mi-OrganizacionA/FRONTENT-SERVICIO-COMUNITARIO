const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(__dirname));

const server = app.listen(8080, async () => {
  console.log('Servidor iniciado en http://127.0.0.1:8080');
  
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();

  const setLogin = async () => {
    await page.evaluate(() => {
      localStorage.setItem('sicag_user', JSON.stringify({id: 1, nombre: "Admin Pruebas", rol: "admin", correo: "admin@sicag.com"}));
    });
  };

  const safeType = async (selector, text) => {
    try { await page.type(selector, text); } catch (e) { console.log('No se pudo escribir en', selector); }
  };

  const safeEval = async (fn) => {
    try { await page.evaluate(fn); } catch(e) { console.log('Error en eval'); }
  };

  try {
    // 1. Portal Público (Varias capturas)
    console.log('Navegando a /index.html...');
    await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/portal_1.png') });
    console.log('Guardado portal_1.png');
    
    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/portal_2.png') });
    console.log('Guardado portal_2.png');

    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/portal_3.png') });
    console.log('Guardado portal_3.png');

    // 2. Login
    await safeEval(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Ingresar'));
      if(btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/login.png') });
    console.log('Guardado login.png');

    // Preparar entorno logueado
    await setLogin();

    // 3. Dashboard
    console.log('Navegando a /dashboard.html...');
    await page.goto('http://127.0.0.1:8080/dashboard.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/dashboard.png') });
    console.log('Guardado dashboard.png');

    // 4. Censo Habitantes (Paso a paso)
    console.log('Navegando a /censo.html...');
    await page.goto('http://127.0.0.1:8080/censo.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/censo_hab_1.png') });
    console.log('Guardado censo_hab_1.png');
    
    // Click en Nuevo Registro
    await safeEval(() => {
      try {
        const modal = new bootstrap.Modal(document.getElementById('modalCenso'));
        modal.show();
      } catch(e) {
        if(typeof abrirModalCenso === 'function') abrirModalCenso();
      }
    });
    await new Promise(r => setTimeout(r, 1000)); // Esperar a que el modal termine la animación
    
    // Llenar primer paso y tomar captura
    await safeType('#habCedula', '15234567');
    await safeType('#habNombre', 'Carlos Alberto Mendoza');
    await safeType('#habFechaNac', '05/15/1985');
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/censo_hab_2.png') });
    console.log('Guardado censo_hab_2.png');
    
    // Siguiente paso
    await safeEval(() => {
      if(typeof goTo === 'function') goTo(2);
      else if(typeof navigateToHabStep === 'function') navigateToHabStep(2);
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Llenar paso 2
    await safeType('#habTelefono', '04141234567');
    await safeType('#habDireccion', 'Sector Centro, Calle 4');
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/censo_hab_3.png') });
    console.log('Guardado censo_hab_3.png');

    // 5. Censo Viviendas (Paso a paso)
    console.log('Navegando a /censo_viviendas.html...');
    await page.goto('http://127.0.0.1:8080/censo_viviendas.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/censo_viv_1.png') });
    console.log('Guardado censo_viv_1.png');
    
    // Abrir Modal
    await safeEval(() => {
      try {
        const modal = new bootstrap.Modal(document.getElementById('modalVivienda'));
        modal.show();
      } catch(e) {
        const btn = document.getElementById('btnNuevaVivienda');
        if(btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Paso 1 Vivienda
    await safeType('#calleAvenida', 'Calle Principal');
    await safeType('#numeroCasa', 'Nro 12');
    await safeType('#direccionExacta', 'Al lado de la plaza');
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/censo_viv_2.png') });
    console.log('Guardado censo_viv_2.png');
    
    // Paso 2 Vivienda
    await safeEval(() => {
      if(typeof goToStep === 'function') goToStep(2);
      else {
        const nxt = document.getElementById('btnNext');
        if(nxt) nxt.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/censo_viv_3.png') });
    console.log('Guardado censo_viv_3.png');

    // 6. Proyectos
    console.log('Navegando a /proyectos.html...');
    await page.goto('http://127.0.0.1:8080/proyectos.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/proyectos.png') });
    console.log('Guardado proyectos.png');

    // 7. Producción Agrícola
    console.log('Navegando a /produccion_agricola.html...');
    await page.goto('http://127.0.0.1:8080/produccion_agricola.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/produccion_agricola.png') });
    console.log('Guardado produccion_agricola.png');

    // 8. Validaciones
    console.log('Navegando a /notificaciones.html...');
    await page.goto('http://127.0.0.1:8080/notificaciones.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/validaciones.png') });
    console.log('Guardado validaciones.png');

    // 9. Cartografía
    console.log('Navegando a /cartografia.html...');
    await page.goto('http://127.0.0.1:8080/cartografia.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(__dirname, 'assets/img/screenshots/cartografia.png') });
    console.log('Guardado cartografia.png');

  } catch (err) {
    console.error('Error global:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('Listo.');
    process.exit(0);
  }
});

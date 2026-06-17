const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PdfGeneradorViviendas {
  /**
   * Genera el PDF completo usando Puppeteer
   */
  static async generarPdf(vivienda, habitantes, consejoComunal) {
    // 1. Leer las plantillas
    const p1Path = path.join(__dirname, '../templates/censo_p1.html');
    const p2Path = path.join(__dirname, '../templates/censo_p2.html');
    
    let htmlP1 = fs.existsSync(p1Path) ? fs.readFileSync(p1Path, 'utf8') : '<h1>P1 no encontrada</h1>';
    let htmlP2 = fs.existsSync(p2Path) ? fs.readFileSync(p2Path, 'utf8') : '<h1>P2 no encontrada</h1>';

    // 2. Extraer solo el div.page de P2 (y sus tags internos)
    // Para ello usamos un regex o split simple, ya que asuminos que tiene <div class="page">
    let page2Content = '';
    const matchP2 = htmlP2.match(/<div class="page">([\s\S]*?)<\/div>\s*<\/body>/);
    if (matchP2) {
      page2Content = `<div class="page" style="page-break-before: always; margin-top:20px;">${matchP2[1]}</div>`;
    } else {
      page2Content = `<div class="page" style="page-break-before: always; margin-top:20px;">${htmlP2}</div>`;
    }

    // 3. Preparar los datos a inyectar en JSON puro
    const payload = {
      vivienda: vivienda || {},
      habitantes: habitantes || [],
      consejo: consejoComunal || {}
    };

    // 4. Script inyector masivo (se ejecuta dentro de Chromium)
    const inyectorJS = `
    <script>
      const dbData = ${JSON.stringify(payload)};
      
      document.addEventListener("DOMContentLoaded", () => {
        try {
          // Llenar Datos Geográficos (Sección I)
          const geoCells = document.querySelectorAll('.geo-cell .cell-value');
          if (geoCells.length >= 6) {
            geoCells[0].innerHTML = 'Yaracuy'; // Estado
            geoCells[1].innerHTML = 'San Felipe'; // Municipio
            geoCells[2].innerHTML = 'Albarico'; // Parroquia
            geoCells[4].innerHTML = dbData.consejo.nombre_comunidad || ''; 
            geoCells[5].innerHTML = dbData.vivienda.direccion || '';
          }

          // Separar habitantes: Jefe de familia vs resto
          const jefe = dbData.habitantes.find(h => h.es_jefe_familia) || dbData.habitantes[0] || {};
          const familiaResto = dbData.habitantes.filter(h => h.id !== jefe.id);

          // Llenar Datos Personales del Jefe (Sección II)
          const fields = document.querySelectorAll('.jefe-nombres .line');
          if (fields.length >= 2) {
            fields[0].innerHTML = '&nbsp;' + (jefe.nombres || '');
            fields[1].innerHTML = '&nbsp;' + (jefe.apellidos || '');
          }

          // CI
          const ciLine = document.querySelector('.jefe-ci .line');
          if(ciLine) ciLine.innerHTML = '&nbsp;' + (jefe.cedula || '');

          // Fechas y Edades
          const jNacimiento = document.querySelector('.jefe-nacimiento');
          if (jNacimiento) {
            const dateLine = jNacimiento.querySelectorAll('.line');
            if (dateLine[0] && jefe.fecha_nacimiento) dateLine[0].innerHTML = '&nbsp;' + new Date(jefe.fecha_nacimiento).toLocaleDateString();
            
            // Calculo simple de edad
            if (dateLine[1] && jefe.fecha_nacimiento) {
              const diff = Date.now() - new Date(jefe.fecha_nacimiento).getTime();
              const age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
              dateLine[1].innerHTML = '&nbsp;' + age;
            }
          }

          // Marcar Checkboxes si es CNE inscrito
          if (jNacimiento && jNacimiento.querySelectorAll('input[type="checkbox"]').length >= 2) {
            const chks = jNacimiento.querySelectorAll('input[type="checkbox"]');
            if (jefe.inscrito_cne) chks[0].setAttribute('checked', 'true');
            else chks[1].setAttribute('checked', 'true');
          }

          // Sexo
          const jSexo = document.querySelector('.jefe-sexo');
          if(jSexo && jSexo.querySelectorAll('input[type="checkbox"]').length >= 2) {
            const chks = jSexo.querySelectorAll('input[type="checkbox"]');
            if (jefe.genero === 'M') chks[0].setAttribute('checked', 'true');
            if (jefe.genero === 'F') chks[1].setAttribute('checked', 'true');
          }

          // Multi-hoja Familia
          // Si hay más de 10 personas, clonar page1.
          const pageContainer = document.body;
          const originalPage1 = document.querySelector('.page');
          const allFamily = dbData.habitantes;
          const pagesNeeded = Math.ceil(allFamily.length / 10) || 1;

          for(let p = 1; p < pagesNeeded; p++) {
             const cln = document.createElement('div');
             cln.className = 'page';
             cln.style.pageBreakBefore = 'always';
             cln.style.marginTop = '20px';
             
             // Extraer solo el título y la tabla de familia (Sección III)
             const titleBox = originalPage1.querySelector('.title-box');
             const section3 = originalPage1.querySelector('.section3-wrapper');
             
             let htmlContent = '';
             if (titleBox) {
                const titleClone = titleBox.cloneNode(true);
                titleClone.innerHTML = 'ESTUDIO DEMOGRÁFICO Y SOCIOECONÓMICO — CONT. (Pág. ' + (p + 1) + ')';
                htmlContent += titleClone.outerHTML;
             }
             if (section3) {
                const section3Clone = section3.cloneNode(true);
                const header = section3Clone.querySelector('.section-header');
                if (header) header.innerHTML = 'III. CARACTERÍSTICAS DEL GRUPO FAMILIAR (CONTINUACIÓN)';
                section3Clone.querySelector('.familia-table tbody').innerHTML = '';
                htmlContent += section3Clone.outerHTML;
             }
             
             cln.innerHTML = htmlContent;
             // Inserta el clon ANTES de la pagina 2
             pageContainer.insertBefore(cln, pageContainer.lastElementChild);
          }

          // Ahora llenar en los tbody correspondientes
          const tbodyList = document.querySelectorAll('.familia-table tbody');
          
          let famIdx = 0;
          for(let tb = 0; tb < pagesNeeded; tb++) {
            const currentTbody = tbodyList[tb];
            if(!currentTbody) continue;
            currentTbody.innerHTML = '';
            
            for(let i = 0; i < 10; i++) {
              const tr = document.createElement('tr');
              if (famIdx < allFamily.length) {
                const hab = allFamily[famIdx];
                let age = '';
                let fnac = '';
                if (hab.fecha_nacimiento) {
                  fnac = new Date(hab.fecha_nacimiento).toLocaleDateString();
                  const diff = Date.now() - new Date(hab.fecha_nacimiento).getTime();
                  age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
                }

                tr.innerHTML = \`
                  <td class="num">\${famIdx + 1}</td>
                  <td>\${hab.nombres} \${hab.apellidos}</td>
                  <td>\${hab.genero || ''}</td>
                  <td>\${hab.cedula || ''}</td>
                  <td>\${fnac}</td>
                  <td>\${age}</td>
                  <td>\${hab.incapacitado_tipo || ''}</td>
                  <td></td>
                  <td>\${hab.es_jefe_familia ? 'Jefe' : 'Familiar'}</td>
                  <td>\${hab.nivel_academico || ''}</td>
                  <td>\${hab.inscrito_cne ? 'SI' : 'NO'}</td>
                  <td>\${hab.ocupacion || ''}</td>
                  <td></td>
                  <td></td>
                \`;
                famIdx++;
              } else {
                tr.innerHTML = \`<td class="num">\${famIdx + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>\`;
                famIdx++;
              }
              currentTbody.appendChild(tr);
            }
          }

        } catch(e) {
          console.error("Error injectando data", e);
        }
      });
    </script>
    `;

    // 5. Unir Todo el HTML
    // Reemplazamos </body> por la Página 2 + el inyector JS + </body>
    const finalHTML = htmlP1.replace('</body>', page2Content + inyectorJS + '</body>');

    // 6. Lanzar Puppeteer
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Forzamos un tamaño de ventana para que coincida con .page width: 950px o carta
    await page.setViewport({ width: 1024, height: 1200 });

    // Cargamos el HTML y esperamos a que el script de inyección modifique el DOM
    await page.setContent(finalHTML, { waitUntil: 'networkidle0' });

    // 7. Generar el PDF
    // Las plantillas tienen un ancho fijo. Ajustamos el formato para que entre bien.
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' }
    });

    await browser.close();

    return pdfBuffer;
  }
  /**
   * Genera el PDF usando TODAS las secciones del estudio demográfico.
   * @param {Object} estudio - Objeto completo con todas las tablas hijas incluidas.
   */
  static async generarPdfEstudio(estudio) {
    const p1Path = path.join(__dirname, '../templates/censo_p1.html');
    const p2Path = path.join(__dirname, '../templates/censo_p2.html');
    
    let htmlP1 = fs.existsSync(p1Path) ? fs.readFileSync(p1Path, 'utf8') : '<h1>P1 no encontrada</h1>';
    let htmlP2 = fs.existsSync(p2Path) ? fs.readFileSync(p2Path, 'utf8') : '<h1>P2 no encontrada</h1>';

    // Extraer div.page de la página 2
    let page2Content = '';
    const matchP2 = htmlP2.match(/<div class="page">([\s\S]*?)<\/div>\s*<\/body>/);
    if (matchP2) {
      page2Content = `<div class="page" style="page-break-before: always; margin-top:20px;">${matchP2[1]}</div>`;
    }

    // Payload completo para inyectar en Puppeteer
    const payload = {
      cabecera: {
        planilla_nro: estudio.planilla_nro || '',
        fecha_censo: estudio.fecha_censo || '',
        encuestador_nombre: estudio.encuestador_nombre || '',
        encuestado_nombre: estudio.encuestado_nombre || '',
        encuestado_cedula: estudio.encuestado_cedula || ''
      },
      geo: {
        estado: estudio.estado || 'Yaracuy',
        municipio: estudio.municipio || 'San Felipe',
        parroquia: estudio.parroquia || 'Albarico',
        sector: estudio.sector || '',
        nombre_comunidad: estudio.consejo?.nombre_comunidad || estudio.nombre_comunidad || '',
        direccion: estudio.direccion_comunidad || ''
      },
      // Grupo familiar (de CensoCaracteristicaFamiliar)
      familiares: Array.isArray(estudio.familiares) ? estudio.familiares : [],
      // Situación de vivienda (de CensoSituacionVivienda)
      vivienda: estudio.vivienda || {},
      // Salud (de CensoSalud)
      salud: estudio.salud || {},
      // Servicios básicos (de CensoServicios)
      servicios: estudio.servicios || {},
      // Participación comunitaria (de CensoParticipacionComunitaria)
      participacion: estudio.participacion || {},
      // Economía (de CensoSituacionEconomica)
      economia: estudio.economia || {},
      // Diagnóstico de la comunidad (de CensoSituacionComunidad)
      comunidad: estudio.comunidad || {}
    };

    // Inyector JS que se ejecuta dentro de Puppeteer (Chromium)
    const inyectorJS = `
    <script>
      const dbData = ${JSON.stringify(payload)};
      document.addEventListener("DOMContentLoaded", () => {
        try {
          // Cabecera: Planilla N° y Fecha
          const headerLines = document.querySelectorAll('.header-right .line');
          if (headerLines[0]) headerLines[0].innerHTML = '&nbsp;' + dbData.cabecera.planilla_nro;
          if (headerLines[1]) headerLines[1].innerHTML = '&nbsp;' + dbData.cabecera.fecha_censo;

          // Sección I: Ubicación geográfica
          const geoCells = document.querySelectorAll('.geo-cell .cell-value');
          if (geoCells.length >= 6) {
            geoCells[0].innerHTML = dbData.geo.estado;
            geoCells[1].innerHTML = dbData.geo.municipio;
            geoCells[2].innerHTML = dbData.geo.parroquia;
            geoCells[3].innerHTML = dbData.geo.sector;
            geoCells[4].innerHTML = dbData.geo.nombre_comunidad;
            geoCells[5].innerHTML = dbData.geo.direccion;
          }

          // Sección II: Jefe del grupo familiar
          const jefe = dbData.familiares.find(f => f.es_jefe_familia) || dbData.familiares[0] || {};
          const jefeFields = document.querySelectorAll('.jefe-nombres .line');
          if (jefeFields[0]) jefeFields[0].innerHTML = '&nbsp;' + (jefe.nombres || '');
          if (jefeFields[1]) jefeFields[1].innerHTML = '&nbsp;' + (jefe.apellidos || '');
          const ciLine = document.querySelector('.jefe-ci .line');
          if (ciLine) ciLine.innerHTML = '&nbsp;' + (jefe.cedula_identidad || '');

          // Sección III: Tabla familiar completa
          const tbody = document.querySelector('.familia-table tbody');
          if (tbody) {
            tbody.innerHTML = '';
            dbData.familiares.forEach((f, i) => {
              let edad = '';
              let fnac = '';
              if (f.fecha_nacimiento) {
                fnac = new Date(f.fecha_nacimiento).toLocaleDateString('es-VE');
                const diff = Date.now() - new Date(f.fecha_nacimiento).getTime();
                edad = Math.abs(new Date(diff).getUTCFullYear() - 1970);
              }
              const tr = document.createElement('tr');
              tr.innerHTML = \`
                <td class="num">\${i + 1}</td>
                <td>\${(f.nombres_apellidos || f.nombres || '') + ' ' + (f.apellidos || '')}</td>
                <td>\${f.genero || ''}</td>
                <td>\${f.cedula_identidad || f.cedula || ''}</td>
                <td>\${fnac}</td>
                <td>\${edad}</td>
                <td></td>
                <td></td>
                <td>\${f.parentesco || (f.es_jefe_familia ? 'Jefe(a)' : 'Familiar')}</td>
                <td>\${f.nivel_educativo || ''}</td>
                <td>\${f.inscrito_cne ? 'SI' : 'NO'}</td>
                <td>\${f.ocupacion || ''}</td>
                <td>\${f.es_pensionado ? 'SI' : 'NO'}</td>
                <td></td>
              \`;
              tbody.appendChild(tr);
            });
          }
        } catch(e) { console.error("Error inyectando datos en PDF", e); }
      });
    </script>
    `;

    const finalHTML = htmlP1.replace('</body>', page2Content + inyectorJS + '</body>');

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (err) {
      if (err.message.includes('Could not find Chrome')) {
        console.log('Descargando Chrome bajo demanda para Puppeteer...');
        execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
        browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      } else {
        throw err;
      }
    }

    const page = await browser.newPage();
    await page.setContent(finalHTML, { waitUntil: 'domcontentloaded', timeout: 60000 });
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' }
    });
    await browser.close();
    return pdfBuffer;
  }
}

module.exports = PdfGeneradorViviendas;

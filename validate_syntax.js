const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const acorn = require('acorn');

const files = [
  'censo.html',
  'censo_viviendas.html',
  'organizaciones.html',
  'produccion_agricola.html',
  'proyectos.html',
  'perfil.html',
  'js/modules/noticias.js',
  'js/censo-viviendas.js'
];

let hasError = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  
  console.log(`Checking ${file}...`);
  
  if (file.endsWith('.js')) {
    try {
      acorn.parse(content, { ecmaVersion: 2022, sourceType: 'module' });
    } catch (e) {
      console.error(`Syntax error in ${file}:`, e.message);
      hasError = true;
    }
  } else if (file.endsWith('.html')) {
    const dom = new JSDOM(content);
    const scripts = dom.window.document.querySelectorAll('script');
    scripts.forEach((script, index) => {
      if (script.textContent && script.textContent.trim()) {
        try {
          acorn.parse(script.textContent, { ecmaVersion: 2022, sourceType: 'module' });
        } catch (e) {
          console.error(`Syntax error in ${file} (Script #${index + 1}):`, e.message);
          
          // Get snippet around the error
          const lines = script.textContent.split('\n');
          const errLine = e.loc?.line;
          if (errLine) {
            console.error(`--- Snippet ---`);
            const start = Math.max(0, errLine - 3);
            const end = Math.min(lines.length, errLine + 2);
            for (let i = start; i < end; i++) {
              console.error(`${i === errLine - 1 ? '>' : ' '} ${i + 1}: ${lines[i]}`);
            }
            console.error(`---------------`);
          }
          hasError = true;
        }
      }
    });
  }
}

if (!hasError) {
  console.log('All syntax checks passed successfully!');
} else {
  process.exit(1);
}

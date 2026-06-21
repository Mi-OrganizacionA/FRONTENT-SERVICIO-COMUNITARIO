const fs = require('fs');
let content = fs.readFileSync('censo_viviendas.html', 'utf8');

content = content.replace(
    "const jCne = document.getElementById('jefCNE');",
    "const jCne = document.getElementById('jefInscritoCNE');"
);

content = content.replace(
    "const jIncapacidad = document.getElementById('jefTieneIncapacidad');",
    "const jIncapacidad = document.getElementById('jefIncapacitado');"
);

fs.writeFileSync('censo_viviendas.html', content, 'utf8');
console.log("Fixed element IDs");

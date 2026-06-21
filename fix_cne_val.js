const fs = require('fs');
let content = fs.readFileSync('censo_viviendas.html', 'utf8');

content = content.replace(
    "if(jCne) jCne.value = datosNuevos.inscrito_cne ? 'true' : 'false';",
    "if(jCne) jCne.value = datosNuevos.inscrito_cne ? 'Si' : 'No';"
);

fs.writeFileSync('censo_viviendas.html', content, 'utf8');
console.log("Fixed jCne assignment");

const fs = require('fs');
let content = fs.readFileSync('censo_viviendas.html', 'utf8');

// The array in the file currently:
// ['jefNombres', 'jefFechaNac', 'jefNacionalidad', 'jefSexo', 'jefEstadoCivil', 'jefNivelInstruccion', 'jefProfesion', 'jefCNE', 'jefTieneIncapacidad', 'jefPensionado', 'jefTelfCel', 'jefEmail', 'jefTiempoComunidad', 'jefIngresoMensualBs', 'trabaja', 'ingresoFamiliarRango']

const targetArrayStr = `['jefNombres', 'jefFechaNac', 'jefNacionalidad', 'jefSexo', 'jefEstadoCivil', 'jefNivelInstruccion', 'jefProfesion', 'jefCNE', 'jefTieneIncapacidad', 'jefPensionado', 'jefTelfCel', 'jefEmail', 'jefTiempoComunidad', 'jefIngresoMensualBs', 'trabaja', 'ingresoFamiliarRango']`;
const newArrayStr = `['jefNombres', 'jefFechaNac', 'jefNacionalidad', 'jefSexo', 'jefEstadoCivil', 'jefNivelInstruccion', 'jefProfesion', 'jefInscritoCNE', 'jefIncapacitado', 'jefPensionado', 'jefTelfCel', 'jefEmail', 'jefTiempoComunidad', 'jefIngresoMensualBs', 'trabaja', 'ingresoFamiliarRango']`;

if (content.includes(targetArrayStr)) {
    content = content.replace(targetArrayStr, newArrayStr);
    fs.writeFileSync('censo_viviendas.html', content, 'utf8');
    console.log("Fixed the IDs in the array successfully.");
} else {
    console.log("Could not find the target array string.");
}

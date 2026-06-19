const fs = require('fs');
let c = fs.readFileSync('c:/FRONTENT-SERVICIO-COMUNITARIO/censo_viviendas.html', 'utf8');

const selects = [
  'jefIncapacitado', 'actividadComercialVivienda', 'terrenoPropio', 'inscritaSIVIH',
  'presenciaInsectos', 'tieneAnimales', 'tieneMedidorAgua', 'tieneMedidorLuz',
  'necesitaAyudaEspecial', 'existenOrgComunitarias', 'participaUsted',
  'participaFamiliar', 'asisteAsambleas', 'infoCCs', 'dispuestoApoyar'
];

for (const id of selects) {
  const hasEmptyRegex = new RegExp('<select[^>]*id="' + id + '"[^>]*>[\\s\\S]*?<option value="">');
  if (!hasEmptyRegex.test(c)) {
    const replRegex = new RegExp('(<select[^>]*id="' + id + '"[^>]*>\\s*)<option value="(Si|No)"');
    c = c.replace(replRegex, '$1<option value="">Seleccione...</option>\n                    <option value="$2"');
  }
}

fs.writeFileSync('c:/FRONTENT-SERVICIO-COMUNITARIO/censo_viviendas.html', c, 'utf8');
console.log('Fixed Si/No options with Node.');

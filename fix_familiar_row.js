const fs = require('fs');
let content = fs.readFileSync('censo_viviendas.html', 'utf8');

const targetRegex = /setR\('\.fam-sexo', genero\);\s*setR\('\.fam-cedula', [^;]+;/;

const newStr = `setR('.fam-sexo', genero);
        setR('.fam-cedula', document.getElementById('rh_sin_cedula')?.checked ? 'Sin Cédula (Menor)' : cedula);
        
        // Asignar los campos adicionales en la interfaz
        setR('.fam-estadocivil', datosNuevos.estado_civil);
        setR('.fam-instruccion', datosNuevos.nivel_educativo);
        setR('.fam-ocupacion', datosNuevos.profesion || datosNuevos.ocupacion);
        setR('.fam-cne', datosNuevos.inscrito_cne ? 'Si' : 'No');
        setR('.fam-salud', datosNuevos.condicion_salud);
        setR('.fam-incapacidad', datosNuevos.incapacitado ? 'Si' : 'No');
        setR('.fam-pension', datosNuevos.pensionado ? 'Si' : 'No');`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, newStr);
    fs.writeFileSync('censo_viviendas.html', content, 'utf8');
    console.log("Successfully replaced with regex.");
} else {
    console.log("Target regex not found.");
}

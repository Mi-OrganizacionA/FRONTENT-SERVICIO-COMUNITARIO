const fs = require('fs');

let content = fs.readFileSync('censo_viviendas.html', 'utf8');

const injection = `
        // Nuevos campos
        const jTelfCel = document.getElementById('jefTelfCel'); if(jTelfCel) jTelfCel.value = datosNuevos.telefono || '';
        const jEmail = document.getElementById('jefEmail'); if(jEmail) jEmail.value = datosNuevos.email || '';
        const jTiempoCom = document.getElementById('jefTiempoComunidad'); if(jTiempoCom) jTiempoCom.value = datosNuevos.tiempo_comunidad || '';
        const jIngreso = document.getElementById('jefIngresoMensualBs'); if(jIngreso) jIngreso.value = datosNuevos.ingreso_mensual_bs || '';
        
        // Panel 5 (Trabaja)
        const selTrabaja = document.getElementById('trabaja'); 
        if(selTrabaja) selTrabaja.value = datosNuevos.trabaja_actualmente === true ? 'Sí' : (datosNuevos.trabaja_actualmente === false ? 'No' : '');
        
        const jIngresoRango = document.getElementById('ingresoFamiliarRango');
        if(jIngresoRango) jIngresoRango.value = datosNuevos.clasificacion_ingreso_familiar || '';

        // Limpiar bordes rojos (is-invalid) de Bootstrap o admin.css
        ['jefNombres', 'jefFechaNac', 'jefNacionalidad', 'jefSexo', 'jefEstadoCivil', 'jefNivelInstruccion', 'jefProfesion', 'jefCNE', 'jefTieneIncapacidad', 'jefPensionado', 'jefTelfCel', 'jefEmail', 'jefTiempoComunidad', 'jefIngresoMensualBs', 'trabaja', 'ingresoFamiliarRango'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.classList.remove('is-invalid');
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }
        });

        window._datos_nuevos_jefe = payload.datos_nuevos_habitante;
`;

content = content.replace(/window\._datos_nuevos_jefe = payload\.datos_nuevos_habitante;/g, injection);

fs.writeFileSync('censo_viviendas.html', content, 'utf8');
console.log("Fixed censo_viviendas.html JS mapping");

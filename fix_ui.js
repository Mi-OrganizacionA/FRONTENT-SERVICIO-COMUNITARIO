const fs = require('fs');

function processFile(filename) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf8');

    // 1. Add Tooltips to all labels
    // We want to match <label ...> Text </label> and append the <i> tag.
    // However, some labels wrap inputs like checkboxes <label><input /> Text</label>.
    // Some labels already have the <i> tag.
    const tooltipHtml = ' <i class="fas fa-question-circle text-muted ms-1" style="cursor:help;" data-bs-toggle="tooltip" title="Proporcione la información solicitada en este campo"></i>';
    
    // We replace labels that DO NOT contain fa-question-circle and DO NOT contain <input (for checkboxes)
    content = content.replace(/<label([^>]*)>([\s\S]*?)<\/label>/gi, (match, attrs, innerText) => {
        if (innerText.includes('fa-question-circle')) return match; // Already has it
        if (innerText.includes('<input')) return match; // Likely a checkbox label
        if (innerText.trim() === '') return match; // Empty label
        
        // Sometimes the required star <span class="req">*</span> is there.
        return `<label${attrs}>${innerText}${tooltipHtml}</label>`;
    });

    if (filename.includes('censo_viviendas.html')) {
        // 2. Fix the missing mapping in guardarHabitanteRapido
        // We look for where it maps to Panel 3 (window._datos_nuevos_jefe)
        const targetJefe = `        const jInstPension = document.getElementById('jefPensionadoInstitucion');
        if(jInstPension) jInstPension.value = datosNuevos.pensionado_institucion;
        
        window._datos_nuevos_jefe = payload.datos_nuevos_habitante;`;
        
        const replaceJefe = `        const jInstPension = document.getElementById('jefPensionadoInstitucion');
        if(jInstPension) jInstPension.value = datosNuevos.pensionado_institucion;
        
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
        
        window._datos_nuevos_jefe = payload.datos_nuevos_habitante;`;
        
        if (content.includes(targetJefe)) {
            content = content.replace(targetJefe, replaceJefe);
        } else {
            console.log("Could not find target mapping for Jefe");
        }
        
        // We also need to fix mapping for familiar?
        // In familiar, it adds a new row, so we just set values.
        const targetFamiliar = `        setR('.fam-cedula', document.getElementById('rh_sin_cedula')?.checked ? 'Sin Cédula (Menor)' : cedula);
        
        // Uncheck "Buscar por nombre" if it was checked`;
        const replaceFamiliar = `        setR('.fam-cedula', document.getElementById('rh_sin_cedula')?.checked ? 'Sin Cédula (Menor)' : cedula);
        
        // Missing fields for familiar row
        // (Currently familiar rows don't have all the extended fields in the UI, they only have the basics.
        // We just assign the whole payload so it gets saved)
        row._datos_nuevos_habitante = payload.datos_nuevos_habitante;
        
        // Clear red borders on the familiar inputs
        ['.fam-nombres', '.fam-fechanac', '.fam-sexo', '.fam-cedula'].forEach(sel => {
            const el = row.querySelector(sel);
            if(el) {
                el.classList.remove('is-invalid');
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }
        });

        // Uncheck "Buscar por nombre" if it was checked`;
        if (content.includes(targetFamiliar)) {
            content = content.replace(targetFamiliar, replaceFamiliar);
        } else {
            // It might be using ISO-8859-1 'Cédula' or 'Cdula'
            // We can match with regex
            content = content.replace(/setR\('\.fam-cedula',[^;]+;\s*\/\/\s*Uncheck "Buscar por nombre" if it was checked/g, replaceFamiliar);
        }
    }

    fs.writeFileSync(filename, content, 'utf8');
    console.log("Processed " + filename);
}

processFile('censo_viviendas.html');
processFile('censo.html');

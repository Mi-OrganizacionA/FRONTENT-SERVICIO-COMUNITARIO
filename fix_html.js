const fs = require('fs');
let c = fs.readFileSync('c:/FRONTENT-SERVICIO-COMUNITARIO/censo_viviendas.html', 'utf8');

// B1: navigateToStep
c = c.replace(/(if \(targetStepEl && \()(targetStepEl\.classList\.contains\('done'\) \|\| n === currentStep \+ 1\))/, '$1window.isEditingCenso || $2');

// B3: condicionesSalubridad
c = c.replace(/(setVal\('requiereAyuda',\s+boolToSiNo\(viv\.requiere_ayuda_mejora\)\);)/, '$1\n      setVal('condicionesSalubridad', viv.condiciones_salubridad);');

// B4: Servicios
c = c.replace(/(setVal\('gasDomestico',\s+serv\.gas_tipo\);)/, '$1\n      setVal('gasEmpresa',       serv.gas_empresa_suministra);');
c = c.replace(/(setVal\('telefoniaServicio',\s+serv\.telefonia_tipo\);)/, '$1\n      setVal('transporte',       serv.transporte_tipo);\n      setVal('bombillosNecesita', serv.bombillos_ahorradores_necesita);');

// B5: Comentar ingresoBs
c = c.replace(/setVal\('ingresoBs',\s+eco\.ingreso_bs\);/, '// ingresoBs no persiste en BD: setVal('ingresoBs', eco.ingreso_bs);');
c = c.replace(/setVal\('ventasDe',\s+eco\.ventas_de\);/, '// ventasDe no persiste en BD: setVal('ventasDe', eco.ventas_de);');

// A3/Comunidad
c = c.replace(/setVal\('potencialidadesComunidad',\s*com\.potencialidades_comunidad\);/, 'setVal('potencialidadesComunidad', com.principales_potencialidades_ventajas);');
c = c.replace(/setVal\('problemasComunidad',\s+com\.problemas_comunidad\);/, 'setVal('problemasComunidad',       com.principales_problemas_debilidades);');

// Steps marking
c = c.replace(/setVal\('observaciones',\s+com\.observaciones\);\r?\n\s*\}/, 
setVal('observaciones',            com.observaciones);

      // Marcar todos los steps como "done" en modo edicion para mostrar el progreso
      document.querySelectorAll('.cv-step').forEach((s, i) => {
        s.classList.remove('active', 'done');
        const num = s.querySelector('.cv-step-num');
        s.classList.add('done');
        if (num) num.innerHTML = '<i class="fas fa-check" style="font-size:.65rem"></i>';
      });
    });

// Fix Si/No options
const siNoSelects = [
  'jefIncapacitado', 'actividadComercialVivienda', 'terrenoPropio', 'inscritaSIVIH',
  'presenciaInsectos', 'tieneAnimales', 'tieneMedidorAgua', 'tieneMedidorLuz',
  'necesitaAyudaEspecial', 'existenOrgComunitarias', 'participaUsted',
  'participaFamiliar', 'asisteAsambleas', 'infoCCs', 'dispuestoApoyar'
];

for (const id of siNoSelects) {
  const selectRegex = new RegExp(\(<select[^>]*id="\"[^>]*>\\\\s*)(?:\\\\r?\\\\n)?(\\\\s*)<option value="(?!"")\\\\w\);
  const hasEmptyRegex = new RegExp(\(<select[^>]*id="\"[^>]*>[^]*?)<option value="">\);
  
  if (!hasEmptyRegex.test(c)) {
    const replRegex = new RegExp(\(<select[^>]*id="\"[^>]*>\\\\s*)<option value="(Si|No)"\);
    c = c.replace(replRegex, \\<option value="">Seleccione...</option>\\n                    <option value="\"\);
  }
}

fs.writeFileSync('c:/FRONTENT-SERVICIO-COMUNITARIO/censo_viviendas.html', c, 'utf8');

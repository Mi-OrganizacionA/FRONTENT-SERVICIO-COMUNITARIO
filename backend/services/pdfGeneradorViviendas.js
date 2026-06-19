const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper: formatea una fecha al estilo DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-VE');
}

// Helper: convierte boolean a "Sí" o "No"
function boolStr(val) {
  if (val === null || val === undefined) return '—';
  return val ? 'Sí' : 'No';
}

// Helper: devuelve el valor o "—" si está vacío
function val(v) {
  if (v === null || v === undefined || v === '') return '—';
  return v;
}

// Calcula la edad a partir de fecha_nacimiento
function calcAge(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

class PdfGeneradorViviendas {

  /**
   * Genera el PDF del Estudio Demográfico completo.
   * @param {Object} estudio - Objeto JSON con todas las relaciones incluidas.
   */
  static async generarPdfEstudio(estudio) {
    // Leer el logo SVG como string e incrustar inline en el HTML
    const logoPath = path.join(__dirname, '../../assets/img/logo_comuna_fondoremovido.svg');
    const logoSvg = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'utf8') : '';

    const familiares = Array.isArray(estudio.familiares) ? estudio.familiares : [];
    const jefe = familiares.find(f => f.parentesco && f.parentesco.toLowerCase().includes('jefe')) || familiares[0] || {};
    const sv = estudio.situacion_vivienda || {};
    const sal = estudio.salud || {};
    const ser = estudio.servicios || {};
    const eco = estudio.situacion_economica || {};
    const part = estudio.participacion_comunitaria || {};
    const com = estudio.situacion_comunidad || {};
    const comunidad = estudio.consejo?.nombre_comunidad || estudio.nombre_comunidad || '—';

    const direccionFull = [estudio.calle_avenida, estudio.numero_casa, estudio.referencia_ubicacion]
      .filter(Boolean).join(', ') || estudio.direccion_comunidad || estudio.direccion || '—';

    const opciones = Array.isArray(estudio.opciones_multiples) ? estudio.opciones_multiples : [];
    const getOpciones = (cat) => {
      const arr = opciones.filter(o => o.categoria === cat).map(o => o.valor);
      return arr.length > 0 ? arr.join(', ') : 'Ninguno';
    };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    /* --- RESET Y BASE --- */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 8.5px; color: #1a1a1a; background: #fff; padding: 12mm; }
    
    /* --- ENCABEZADO --- */
    .header { display: flex; align-items: center; gap: 12px; border-bottom: 2.5px solid #1a5276; padding-bottom: 8px; margin-bottom: 10px; }
    .header .logo { height: 55px; width: auto; flex-shrink: 0; }
    .header .logo svg { height: 55px; width: auto; }
    .header .title { flex: 1; text-align: center; }
    .header .title h1 { font-size: 12px; color: #1a5276; text-transform: uppercase; }
    .header .title h2 { font-size: 8px; color: #555; font-weight: normal; }
    .header .meta { font-size: 8px; text-align: right; line-height: 1.7; }
    .header .meta span { display: block; }
    .header .meta strong { color: #1a5276; }
    
    /* --- SECCIONES --- */
    .section { margin-bottom: 7px; page-break-inside: avoid; border-left: 3px solid #f39c12; }
    .section-title { background: #d6eaf8; color: #1a5276; font-size: 8px; font-weight: bold; padding: 3px 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section-body { padding: 5px 7px; }
    
    /* --- GRID DE CAMPOS --- */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px 12px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 3px 12px; }
    .field { display: flex; flex-direction: column; }
    .field label { font-size: 6.5px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.3px; }
    .field span { font-size: 8.5px; border-bottom: 0.5px solid #bdc3c7; padding: 1px 0; min-height: 12px; }
    
    /* --- TABLA FAMILIAR --- */
    table { width: 100%; border-collapse: collapse; font-size: 7px; }
    th { background: #2c3e50; color: #fff; padding: 3px 4px; text-align: left; }
    td { border-bottom: 0.5px solid #ecf0f1; padding: 2px 4px; }
    tr:nth-child(even) td { background: #f9f9f9; }
    
    /* --- CHECKBOX SIMULADO --- */
    .check-field { display: flex; align-items: center; gap: 4px; margin: 2px 0; }
    .check-field label { font-size: 7.5px; flex: 1; }
    .check-box { width: 9px; height: 9px; border: 1px solid #7f8c8d; display: inline-block; text-align: center; line-height: 9px; font-size: 7px; flex-shrink: 0; }
    
    /* --- FIRMA --- */
    .firma-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 5px; }
    .firma-box { border-top: 1px solid #1a1a1a; padding-top: 3px; font-size: 7px; text-align: center; color: #555; }
  </style>
</head>
<body>

  <!-- ENCABEZADO -->
  <div class="header">
    <div class="logo">${logoSvg}</div>
    <div class="title">
      <h1>Estudio Demográfico y Socioeconómico</h1>
      <h2>Comuna Socialista Agroecológica Simón Rodríguez</h2>
    </div>
    <div class="meta">
      <span><strong>Planilla N°:</strong> ${val(estudio.planilla_nro)}</span>
      <span><strong>Fecha:</strong> ${formatDate(estudio.fecha_censo)}</span>
      <span><strong>RIF:</strong> C-405140160</span>
      <span><strong>Situr:</strong> 22-11-0001</span>
    </div>
  </div>

  <!-- SECCIÓN I: UBICACIÓN -->
  <div class="section">
    <div class="section-title">I. Ubicación Geográfica de la Comunidad</div>
    <div class="section-body">
      <div class="grid-3">
        <div class="field"><label>Estado</label><span>${estudio.estado || 'Yaracuy'}</span></div>
        <div class="field"><label>Municipio</label><span>${estudio.municipio || 'San Felipe'}</span></div>
        <div class="field"><label>Parroquia</label><span>${estudio.parroquia || 'San Felipe'}</span></div>
        <div class="field"><label>Sector</label><span>${estudio.sector || 'Las Mercedes'}</span></div>
        <div class="field"><label>Comunidad</label><span>${val(comunidad)}</span></div>
        <div class="field"><label>Dirección</label><span>${direccionFull}</span></div>
      </div>
    </div>
  </div>

  <!-- SECCIÓN II: JEFE DE FAMILIA -->
  <div class="section">
    <div class="section-title">II. Datos del Jefe del Grupo Familiar</div>
    <div class="section-body">
      <div class="grid-4">
        <div class="field" style="grid-column: span 2;"><label>Nombres y Apellidos</label><span>${val(jefe.nombres_apellidos)}</span></div>
        <div class="field"><label>C.I.</label><span>${val(jefe.cedula_identidad)}</span></div>
        <div class="field"><label>Sexo</label><span>${val(jefe.sexo)}</span></div>
        <div class="field"><label>Fecha de Nacimiento</label><span>${formatDate(jefe.fecha_nacimiento)}</span></div>
        <div class="field"><label>Edad</label><span>${calcAge(jefe.fecha_nacimiento)}</span></div>
        <div class="field"><label>Estado Civil</label><span>${val(jefe.estado_civil)}</span></div>
        <div class="field"><label>Parentesco</label><span>${val(jefe.parentesco)}</span></div>
        <div class="field"><label>Grado de Instrucción</label><span>${val(jefe.grado_instruccion)}</span></div>
        <div class="field"><label>Profesión/Oficio</label><span>${val(jefe.profesion)}</span></div>
        <div class="field"><label>Inscrito CNE</label><span>${boolStr(jefe.inscrito_cne)}</span></div>
        <div class="field"><label>Tiempo en Comunidad</label><span>${val(jefe.tiempo_comunidad)}</span></div>
        <div class="field"><label>Teléfono Celular</label><span>${val(jefe.telefono_celular)}</span></div>
        <div class="field"><label>Correo Electrónico</label><span>${val(jefe.email_familiar)}</span></div>
        <div class="field" style="grid-column: span 2;"><label>Pensionado</label><span>${boolStr(jefe.pensionado)} ${jefe.pensionado_institucion ? '- ' + val(jefe.pensionado_institucion) : ''}</span></div>
        <div class="field"><label>Incapacidad</label><span>${boolStr(jefe.incapacitado)} ${jefe.discapacidad_tipo ? '- ' + val(jefe.discapacidad_tipo) : ''}</span></div>
        <div class="field"><label>Ingreso Mensual Bs.</label><span>${val(jefe.ingreso_mensual_bs)}</span></div>
      </div>
    </div>
  </div>

  <!-- SECCIÓN III: GRUPO FAMILIAR -->
  <div class="section">
    <div class="section-title">III. Características del Grupo Familiar (${familiares.length} miembro(s))</div>
    <div class="section-body">
      <table>
        <thead>
          <tr>
            <th>N°</th><th>Nombres y Apellidos</th><th>Sexo</th><th>C.I.</th>
            <th>F. Nacimiento</th><th>Edad</th><th>Discapacidad</th><th>Parentesco</th>
            <th>Instrucción</th><th>CNE</th><th>Profesión</th><th>Pensionado</th>
          </tr>
        </thead>
        <tbody>
          ${familiares.map((f, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${val(f.nombres_apellidos)}</td>
            <td>${val(f.sexo)}</td>
            <td>${val(f.cedula_identidad)}</td>
            <td>${formatDate(f.fecha_nacimiento)}</td>
            <td>${calcAge(f.fecha_nacimiento)}</td>
            <td>${val(f.discapacidad_tipo)}</td>
            <td>${val(f.parentesco)}</td>
            <td>${val(f.grado_instruccion)}</td>
            <td>${boolStr(f.inscrito_cne)}</td>
            <td>${val(f.profesion)}</td>
            <td>${boolStr(f.pensionado)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- SECCIONES IV, V, VI en grid de 3 columnas -->
  <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; page-break-inside: avoid;">
    
    <!-- SECCIÓN IV: VIVIENDA -->
    <div class="section">
      <div class="section-title">IV. Situación de la Vivienda</div>
      <div class="section-body">
        <div class="field"><label>Condiciones del Terreno</label><span>${val(sv.condiciones_terreno)}</span></div>
        <div class="field"><label>Forma de Tenencia</label><span>${val(sv.forma_tenencia)}</span></div>
        <div class="field"><label>Tipo de Vivienda</label><span>${val(sv.tipo_vivienda)}</span></div>
        <div class="field"><label>N° Habitaciones</label><span>${val(sv.cantidad_habitaciones)}</span></div>
        <div class="field"><label>Tipo de Paredes</label><span>${val(sv.tipo_paredes)}</span></div>
        <div class="field"><label>Tipo de Techo</label><span>${val(sv.tipo_techo)}</span></div>
        <div class="field"><label>N° Baños</label><span>${val(sv.cantidad_banos)}</span></div>
        <div class="field"><label>Ambientes Disponibles</label><span>${val(sv.ambientes_vivienda)}</span></div>
        <div class="field"><label>Terreno Propio</label><span>${boolStr(sv.terreno_propio)}</span></div>
        <div class="field"><label>Inscrita en SIVIH</label><span>${boolStr(sv.inscrita_sivih)}</span></div>
        <div class="field"><label>Requiere Ayuda de Mejora</label><span>${val(sv.requiere_ayuda_mejora)}</span></div>
        <div class="field" style="grid-column: span 2;"><label>Enseres</label><span>${getOpciones('enseres_vivienda')}</span></div>
        <div class="field"><label>Insectos / Roedores</label><span>${boolStr(sv.presencia_insectos_roedores)} (${getOpciones('insectos_tipos')})</span></div>
        <div class="field"><label>Animales Domésticos</label><span>${boolStr(sv.tiene_animales_domesticos)} (${getOpciones('animales_tipos')})</span></div>
        <div class="field"><label>Condiciones Salubridad</label><span>${val(sv.condiciones_salubridad)}</span></div>
      </div>
    </div>

    <!-- SECCIÓN V: SERVICIOS -->
    <div class="section">
      <div class="section-title">V. Servicios Básicos</div>
      <div class="section-body">
        <div class="field"><label>Agua Blanca (tipo)</label><span>${val(ser.aguas_blancas_tipo)}</span></div>
        <div class="field"><label>Tanque (litros)</label><span>${val(ser.tiene_tanque_litros)}</span></div>
        <div class="field"><label>Pipotes (cantidad)</label><span>${val(ser.tiene_pipotes_cantidad)}</span></div>
        <div class="field"><label>Medidor de Agua</label><span>${boolStr(ser.tiene_medidor_agua)}</span></div>
        <div class="field"><label>Aguas Servidas</label><span>${val(ser.aguas_servidas_tipo)}</span></div>
        <div class="field"><label>Gas (tipo)</label><span>${val(ser.gas_tipo)}</span></div>
        <div class="field"><label>N° Cilindros</label><span>${val(ser.cantidad_cilindros_gas)}</span></div>
        <div class="field"><label>Cilindros</label><span>${getOpciones('gas_cilindros')}</span></div>
        <div class="field"><label>Empresa de Gas</label><span>${val(ser.gas_empresa_suministra)}</span></div>
        <div class="field"><label>Duración / Precio Gas</label><span>${val(ser.gas_duracion_y_precio)}</span></div>
        <div class="field"><label>Sistema Eléctrico</label><span>${val(ser.sistema_electrico_tipo)}</span></div>
        <div class="field"><label>Medidor de Luz</label><span>${boolStr(ser.tiene_medidor_luz)}</span></div>
        <div class="field"><label>Bombillos ahorradores</label><span>${val(ser.bombillos_ahorradores_necesita)}</span></div>
        <div class="field"><label>Recolección de Basura</label><span>${val(ser.recoleccion_basura_tipo)}</span></div>
        <div class="field"><label>Telefonía</label><span>${val(ser.telefonia_tipo)}</span></div>
        <div class="field"><label>Transporte</label><span>${val(ser.transporte_tipo)}</span></div>
        <div class="field" style="grid-column: span 2;"><label>Mecanismos Información</label><span>${val(ser.mecanismos_informacion)}</span></div>
        <div class="field" style="grid-column: span 2;"><label>Servicios Comunales</label><span>${val(ser.servicios_comunales)}</span></div>
      </div>
    </div>

    <!-- SECCIÓN VI: SALUD -->
    <div class="section">
      <div class="section-title">VI. Salud y Exclusión Social</div>
      <div class="section-body">
        <div class="field"><label>Necesita Ayuda Especial</label><span>${boolStr(sal.necesita_ayuda_especial)}</span></div>
        <div class="field"><label>¿Cuál Ayuda?</label><span>${val(sal.cual_ayuda_especial)}</span></div>
        <div class="field"><label>Niños en calle (cant.)</label><span>${val(sal.exclusion_ninos_calle_cant)}</span></div>
        <div class="field"><label>Discapacitados (cant.)</label><span>${val(sal.exclusion_discapacitados_cant)}</span></div>
        <div class="field"><label>Tercera Edad (cant.)</label><span>${val(sal.exclusion_tercera_edad_cant)}</span></div>
      </div>
    </div>

  </div><!-- fin grid IV-V-VI -->

  <!-- SECCIÓN VII: SITUACIÓN ECONÓMICA -->
  <div class="section">
    <div class="section-title">VII. Situación Económica</div>
    <div class="section-body">
      <div class="grid-4">
        <div class="field"><label>¿Trabaja?</label><span>${boolStr(eco.trabaja)}</span></div>
        <div class="field"><label>¿Dónde Trabaja?</label><span>${val(eco.donde_trabaja)}</span></div>
        <div class="field"><label>Ingreso Familiar</label><span>${val(eco.ingreso_familiar_rango)}</span></div>
        <div class="field"><label>Actividad Comercial en Vivienda</label><span>${boolStr(eco.actividad_comercial_vivienda)}</span></div>
        <div class="field" style="grid-column: span 2;"><label>Ventas De</label><span>${val(eco.ventas_de)}</span></div>
      </div>
    </div>
  </div>

  <!-- SECCIÓN VIII: PARTICIPACIÓN COMUNITARIA -->
  <div class="section">
    <div class="section-title">VIII. Participación Comunitaria</div>
    <div class="section-body">
      <div class="grid-2">
        <div>
          <div class="check-field"><div class="check-box">${part.existen_org_comunitarias ? '✓' : ''}</div><label>¿Existen organizaciones comunitarias? → ${val(part.cuales_org_comunitarias)}</label></div>
          <div class="check-field"><div class="check-box">${part.participa_usted ? '✓' : ''}</div><label>¿Participa usted en alguna organización?</label></div>
          <div class="check-field"><div class="check-box">${part.participa_familiar ? '✓' : ''}</div><label>¿Participa un familiar?</label></div>
          <div class="check-field"><div class="check-box">${part.cree_pueblo_interviene_decisiones ? '✓' : ''}</div><label>¿Cree que el pueblo interviene en decisiones?</label></div>
          <div class="check-field"><div class="check-box">${part.acuerdo_pueblo_protagonismo_presupuesto ? '✓' : ''}</div><label>¿Acuerdo con protagonismo del pueblo en presupuesto?</label></div>
          <div class="check-field"><div class="check-box">${part.info_sobre_consejos_comunales ? '✓' : ''}</div><label>¿Tiene información sobre los CC? → ${val(part.como_obtuvo_info_consejos)}</label></div>
          <div class="check-field"><div class="check-box">${part.dispuesto_apoyar_consejo ? '✓' : ''}</div><label>¿Dispuesto a apoyar al CC?</label></div>
          <div class="check-field"><div class="check-box">${part.asiste_asambleas_ciudadanos ? '✓' : ''}</div><label>¿Asiste a Asambleas de Ciudadanos?</label></div>
          <div class="field" style="margin-top: 10px;"><label>Misiones Implementadas</label><span>${getOpciones('misiones')}</span></div>
          <div class="field"><label>Área de trabajo de interés</label><span>${val(part.area_trabajo_interes)}</span></div>
        </div>
        <div>
          <div class="field"><label>¿Por qué no asiste?</label><span>${val(part.porque_no_asiste)}</span></div>
          <div class="field"><label>¿Cómo resolver problemas del sector?</label><span>${val(part.como_resolver_problemas_sector)}</span></div>
          <div class="field"><label>¿Quién debe resolver los problemas?</label><span>${val(part.quien_resolver_problemas)}</span></div>
          <div class="field"><label>Tipo de proyectos deseados</label><span>${val(part.tipo_proyectos_deseados)}</span></div>
          <div class="field"><label>¿Cómo apoyaría los proyectos?</label><span>${val(part.como_apoyaria_proyectos)}</span></div>
          <div class="field"><label>Compromiso con el sector</label><span>${val(part.compromiso_con_sector)}</span></div>
          <div class="field"><label>Opinión sobre el censo energético</label><span>${val(part.opinion_censo_energetico)}</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- SECCIÓN IX: SITUACIÓN DE LA COMUNIDAD -->
  <div class="section">
    <div class="section-title">IX. Situación de la Comunidad</div>
    <div class="section-body">
      <div class="grid-2">
        <div class="field"><label>Principales Potencialidades y Ventajas</label><span style="min-height:30px;">${val(com.principales_potencialidades_ventajas)}</span></div>
        <div class="field"><label>Principales Problemas y Debilidades</label><span style="min-height:30px;">${val(com.principales_problemas_debilidades)}</span></div>
        <div class="field"><label>¿Cómo propone resolver los problemas?</label><span style="min-height:30px;">${val(com.como_resolver_problemas)}</span></div>
        <div class="field"><label>Tipos de Proyectos Deseados</label><span style="min-height:30px;">${val(com.tipo_proyectos_deseados)}</span></div>
      </div>
      <div class="field" style="margin-top: 8px;"><label>Observaciones Adicionales</label><span style="min-height:30px;">${val(com.observaciones || estudio.observacion)}</span></div>
    </div>
  </div>

  <!-- SECCIÓN X: DATOS DEL ENCUESTADOR -->
  <div class="section">
    <div class="section-title">X. Datos del Encuestador y Encuestado</div>
    <div class="section-body">
      <div class="firma-row">
        <div>
          <div class="grid-2" style="margin-bottom:8px;">
            <div class="field"><label>Nombre del Encuestador</label><span>${val(estudio.encuestador_nombre)}</span></div>
            <div class="field"><label>C.I. del Encuestador</label><span>${val(estudio.encuestador_cedula)}</span></div>
          </div>
          <div class="firma-box">Firma del Encuestador</div>
        </div>
        <div>
          <div class="grid-2" style="margin-bottom:8px;">
            <div class="field"><label>Nombre del Encuestado</label><span>${val(estudio.encuestado_nombre)}</span></div>
            <div class="field"><label>C.I. del Encuestado</label><span>${val(estudio.encuestado_cedula)}</span></div>
          </div>
          <div class="firma-box">Firma del Encuestado / Conforme</div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;

    // Lanzar Puppeteer con flags de estabilidad para servidores Linux
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process']
      });
    } catch (err) {
      if (err.message.includes('Could not find Chrome')) {
        execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
        browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process']
        });
      } else {
        throw err;
      }
    }

    const page = await browser.newPage();
    // HTML estático puro, sin recursos externos → networkidle0 es seguro y confirma que el DOM está listo
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' }
    });
    await browser.close();
    return pdfBuffer;
  }

  /**
   * Método legado: mantener firma pero redirigir al nuevo método.
   * Se llama desde viviendasController.js.
   */
  static async generarPdf(vivienda, habitantes, consejoComunal) {
    // Construir un objeto estudio compatible con generarPdfEstudio
    const estudioSimulado = {
      planilla_nro: vivienda.planilla_nro || null,
      fecha_censo: vivienda.fecha_creacion,
      rif: vivienda.rif || null,
      nro_cuenta: vivienda.nro_cuenta || null,
      estado: 'Yaracuy',
      municipio: 'San Felipe',
      parroquia: 'Albarico',
      sector: vivienda.sector || null,
      nombre_comunidad: consejoComunal?.nombre_comunidad || null,
      direccion_comunidad: vivienda.direccion || null,
      encuestador_nombre: null,
      encuestador_cedula: null,
      encuestado_nombre: habitantes[0] ? `${habitantes[0].nombres} ${habitantes[0].apellidos}` : null,
      encuestado_cedula: habitantes[0]?.cedula || null,
      consejo: consejoComunal,
      familiares: habitantes.map(h => ({
        nombres_apellidos: `${h.nombres || ''} ${h.apellidos || ''}`.trim(),
        sexo: h.genero,
        cedula_identidad: h.cedula,
        fecha_nacimiento: h.fecha_nacimiento,
        discapacidad_tipo: h.incapacitado_tipo,
        parentesco: h.es_jefe_familia ? 'Jefe(a)' : 'Familiar',
        grado_instruccion: h.nivel_academico,
        inscrito_cne: h.inscrito_cne,
        profesion: h.ocupacion,
        pensionado: h.pensionado,
        ingreso_mensual_bs: null
      })),
      situacion_vivienda: null,
      salud: null,
      servicios: null,
      situacion_economica: null,
      participacion_comunitaria: null,
      situacion_comunidad: null
    };
    return PdfGeneradorViviendas.generarPdfEstudio(estudioSimulado);
  }
}

module.exports = PdfGeneradorViviendas;

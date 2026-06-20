const { Op } = require('sequelize');

class CensoReportesService {
  /**
   * Helper para construir where de CensoCaracteristicaFamiliar
   */
  static _buildFiltrosFamiliar(filtros, Op) {
    const where = {};
    
    // Nacimiento
    if (filtros.nac_min || filtros.nac_max) {
      where.fecha_nacimiento = {};
      if (filtros.nac_min) where.fecha_nacimiento[Op.gte] = new Date(filtros.nac_min);
      if (filtros.nac_max) where.fecha_nacimiento[Op.lte] = new Date(filtros.nac_max);
    }
    else if (filtros.edad_min || filtros.edad_max) {
      where.fecha_nacimiento = {};
      const hoy = new Date();
      if (filtros.edad_min) {
        const maxFecha = new Date(hoy);
        maxFecha.setFullYear(hoy.getFullYear() - parseInt(filtros.edad_min));
        where.fecha_nacimiento[Op.lte] = maxFecha;
      }
      if (filtros.edad_max) {
        const minFecha = new Date(hoy);
        minFecha.setFullYear(hoy.getFullYear() - parseInt(filtros.edad_max) - 1);
        where.fecha_nacimiento[Op.gt] = minFecha;
      }
    }

    if (filtros.genero) where.sexo = filtros.genero;
    
    if (filtros.salud) {
      if (filtros.salud === 'discapacidad') {
         where.discapacidad_tipo = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
      } else if (filtros.salud === 'encamado') {
         where.discapacidad_tipo = { [Op.iLike]: '%encamado%' };
      } else {
         where.discapacidad_tipo = { [Op.iLike]: `%${filtros.salud}%` };
      }
    }
    
    if (filtros.cne !== undefined && filtros.cne !== null && filtros.cne !== '') {
      where.inscrito_cne = filtros.cne === '1';
    }
    if (filtros.trabajo !== undefined && filtros.trabajo !== null && filtros.trabajo !== '') {
      where.profesion = (filtros.trabajo === '1') ? { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } : { [Op.or]: [null, ''] }; 
    }
    return where;
  }

  /**
   * Helper para construir where de EstudioDemografico (nuevos)
   */
  static _buildFiltrosEstudio(filtros, Op) {
    const where = { activo: true }; // IMPORTANTE: Solo contar censos completados
    
    if (filtros.consejo_id || filtros.id_comunidad) {
      where.id_comunidad = filtros.consejo_id || filtros.id_comunidad;
    }
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      where.fecha_creacion = {
        [Op.between]: [new Date(filtros.fecha_desde), new Date(filtros.fecha_hasta + 'T23:59:59Z')]
      };
    } else if (filtros.desde && filtros.hasta) {
      where.fecha_creacion = {
        [Op.between]: [new Date(filtros.desde), new Date(filtros.hasta + 'T23:59:59Z')]
      };
    }
    return where;
  }

  /**
   * Helper para construir where del modelo legacy Habitante
   */
  static _buildFiltrosHabitanteLegacy(filtros, Op) {
    const where = { activo: true };
    
    if (filtros.consejo_id || filtros.id_comunidad) {
      where.consejo_comunal_id = filtros.consejo_id || filtros.id_comunidad;
    }

    if (filtros.nac_min || filtros.nac_max) {
      where.fecha_nacimiento = {};
      if (filtros.nac_min) where.fecha_nacimiento[Op.gte] = new Date(filtros.nac_min);
      if (filtros.nac_max) where.fecha_nacimiento[Op.lte] = new Date(filtros.nac_max);
    } else if (filtros.edad_min || filtros.edad_max) {
      where.fecha_nacimiento = {};
      const hoy = new Date();
      if (filtros.edad_min) {
        const maxFecha = new Date(hoy);
        maxFecha.setFullYear(hoy.getFullYear() - parseInt(filtros.edad_min));
        where.fecha_nacimiento[Op.lte] = maxFecha;
      }
      if (filtros.edad_max) {
        const minFecha = new Date(hoy);
        minFecha.setFullYear(hoy.getFullYear() - parseInt(filtros.edad_max) - 1);
        where.fecha_nacimiento[Op.gt] = minFecha;
      }
    }

    if (filtros.genero) {
      // El viejo Habitante usa ENUM('M', 'F', 'Otro')
      const isM = ['M', 'Masculino', 'MASCULINO'].includes(filtros.genero);
      where.genero = isM ? 'M' : 'F';
    }
    
    if (filtros.salud) {
      if (filtros.salud === 'discapacidad') {
         where.condicion_salud = { [Op.notIn]: ['saludable'] };
      } else {
         where.condicion_salud = filtros.salud;
      }
    }
    
    if (filtros.cne !== undefined && filtros.cne !== null && filtros.cne !== '') {
      where.inscrito_cne = filtros.cne === '1';
    }
    if (filtros.trabajo !== undefined && filtros.trabajo !== null && filtros.trabajo !== '') {
      where.trabaja_actualmente = filtros.trabajo === '1';
    }
    return where;
  }

  /**
   * Helper para construir where de Vivienda Legacy
   */
  static _buildFiltrosViviendaLegacy(filtros, Op) {
    const where = { activo: true };
    if (filtros.consejo_id || filtros.id_comunidad) {
      where.id_comunidad = filtros.consejo_id || filtros.id_comunidad;
    }
    return where;
  }

  /**
   * Obtiene el conjunto de cédulas ya presentes en CensoCaracteristicaFamiliar
   * para excluirlas de la consulta de Habitante (evitar duplicados).
   */
  static async _getCedulasEnCensoNuevo(CensoCaracteristicaFamiliar, whereFamiliar, includeEstudio) {
    const registros = await CensoCaracteristicaFamiliar.findAll({
      where: whereFamiliar,
      attributes: ['cedula_identidad'],
      include: [includeEstudio]
    });
    
    // Extraemos solo los números para generar luego todas las variaciones posibles
    return new Set(
      registros.map(r => (r.cedula_identidad || '').replace(/[^0-9]/g, '')).filter(Boolean)
    );
  }

  /**
   * Agrega filtro de exclusión de cédulas al where de Habitante para evitar duplicados.
   */
  static _aplicarDeduplicacion(whereHab, cedulasEnCenso, Op) {
    if (cedulasEnCenso.size > 0) {
      const cedulasArray = Array.from(cedulasEnCenso);
      // Generar todas las variaciones posibles ("V-123", "V123", "123", "E-123", "E123")
      const variations = [];
      cedulasArray.forEach(num => {
        variations.push(num);
        variations.push(`V-${num}`);
        variations.push(`V${num}`);
        variations.push(`E-${num}`);
        variations.push(`E${num}`);
      });
      whereHab.cedula = { [Op.notIn]: variations };
    }
    return whereHab;
  }

  /**
   * Obtiene la fecha del primer estudio registrado en el sistema
   */
  static async getFechaMinima(models) {
    try {
      const minDateE = await models.EstudioDemografico.min('fecha_creacion');
      const minDateH = await models.Habitante.min('fecha_registro');
      
      let dates = [];
      if (minDateE) dates.push(new Date(minDateE));
      if (minDateH) dates.push(new Date(minDateH));
      
      if (dates.length > 0) {
        const min = new Date(Math.min(...dates));
        return min.toISOString().split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    } catch(err) {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Obtiene los KPIs generales del censo.
   * Aplica deduplicación por cédula para evitar contar personas que existen en ambas tablas.
   */
  static async getKpis(models, filtros = {}) {
    const { CensoCaracteristicaFamiliar, EstudioDemografico, Habitante, Vivienda } = models;
    
    const whereFamiliar = CensoReportesService._buildFiltrosFamiliar(filtros, Op);
    const whereEstudio = CensoReportesService._buildFiltrosEstudio(filtros, Op);
    const whereVivLegacy = CensoReportesService._buildFiltrosViviendaLegacy(filtros, Op);

    const includeEstudio = { model: EstudioDemografico, where: whereEstudio, required: true };

    // Obtener cédulas del censo nuevo para deduplicar en habitantes
    const cedulasEnCensoNuevo = await CensoReportesService._getCedulasEnCensoNuevo(
      CensoCaracteristicaFamiliar, whereFamiliar, { model: EstudioDemografico, where: whereEstudio, required: true, attributes: [] }
    );
    const whereHabLegacy = CensoReportesService._aplicarDeduplicacion(
      CensoReportesService._buildFiltrosHabitanteLegacy(filtros, Op),
      cedulasEnCensoNuevo, Op
    );

    // 1. Total Personas (sin duplicados)
    const tpNuevos = await CensoCaracteristicaFamiliar.count({ where: whereFamiliar, include: [includeEstudio] });
    const tpViejos = await Habitante.count({ where: whereHabLegacy });
    const totalPersonas = tpNuevos + tpViejos;

    // 2. Discapacidad: en censo nuevo = discapacidad_tipo no vacío; en legacy = incapacitado=true
    const discNuevos = await CensoCaracteristicaFamiliar.count({
      where: { ...whereFamiliar, discapacidad_tipo: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
      include: [includeEstudio]
    });
    const discViejos = await Habitante.count({
      where: { ...whereHabLegacy, incapacitado: true }
    });
    const conDiscapacidad = discNuevos + discViejos;

    // 3. Viviendas
    const vivNuevos = await EstudioDemografico.count({ where: whereEstudio });
    const vivViejos = await Vivienda.count({ where: whereVivLegacy });
    const totalViviendas = vivNuevos + vivViejos;

    // 4. Adultos mayores (60+ años)
    const hace60 = new Date(); hace60.setFullYear(hace60.getFullYear() - 60);
    const amNuevos = await CensoCaracteristicaFamiliar.count({
      where: { ...whereFamiliar, fecha_nacimiento: { [Op.lte]: hace60 } },
      include: [includeEstudio]
    });
    const amViejos = await Habitante.count({
      where: { ...whereHabLegacy, fecha_nacimiento: { [Op.lte]: hace60 } }
    });
    const adultosMayores = amNuevos + amViejos;

    // 5. Niños y adolescentes (< 18 años)
    const hace18 = new Date(); hace18.setFullYear(hace18.getFullYear() - 18);
    const niNuevos = await CensoCaracteristicaFamiliar.count({
      where: { ...whereFamiliar, fecha_nacimiento: { [Op.gt]: hace18 } },
      include: [includeEstudio]
    });
    const niViejos = await Habitante.count({
      where: { ...whereHabLegacy, fecha_nacimiento: { [Op.gt]: hace18 } }
    });
    const ninos = niNuevos + niViejos;

    return { totalPersonas, conDiscapacidad, totalViviendas, adultosMayores, ninos };
  }

  /**
   * Obtiene la tabla resumen agrupada por Consejo Comunal
   */
  static async getResumenPorConsejo(models, filtros = {}) {
    const { ConsejoComunal, CensoCaracteristicaFamiliar, EstudioDemografico, Habitante, Vivienda } = models;
    const { Op } = require('sequelize');
    const consejos = await ConsejoComunal.findAll({ attributes: ['id', 'nombre_comunidad'] });
    const resumen = [];
    
    const fClon = { ...filtros }; delete fClon.consejo_id;
    
    const wf = CensoReportesService._buildFiltrosFamiliar(fClon, Op);
    const we = CensoReportesService._buildFiltrosEstudio(fClon, Op);
    const wh = CensoReportesService._buildFiltrosHabitanteLegacy(fClon, Op);
    const wv = CensoReportesService._buildFiltrosViviendaLegacy(fClon, Op);

    // Apply consejo_id filter globally if present
    if (filtros.consejo_id) {
      we.id_comunidad = filtros.consejo_id;
      wh.consejo_comunal_id = filtros.consejo_id;
      wv.id_comunidad = filtros.consejo_id;
    }

    const hace18 = new Date(); hace18.setFullYear(hace18.getFullYear() - 18);
    const hace60 = new Date(); hace60.setFullYear(hace60.getFullYear() - 60);

    // Fetch ALL records first to avoid N+1 queries loop
    const habsN_all = await CensoCaracteristicaFamiliar.findAll({ 
      where: wf, attributes: ['fecha_nacimiento', 'discapacidad_tipo', 'cedula_identidad'],
      include: [{ model: EstudioDemografico, where: we, required: true, attributes: ['id_comunidad'] }]
    });
    const vivsN_all = await EstudioDemografico.findAll({ where: we, attributes: ['id_comunidad'] });

    // Deduplicate logic
    const cedulasEnNuevo = new Set(
      habsN_all.map(h => (h.cedula_identidad || '').replace(/[^0-9]/g, '')).filter(Boolean)
    );
    if (cedulasEnNuevo.size > 0) {
      const cedulasArray = Array.from(cedulasEnNuevo);
      const variations = [];
      cedulasArray.forEach(num => {
        variations.push(num, `V-${num}`, `V${num}`, `E-${num}`, `E${num}`);
      });
      wh.cedula = { [Op.notIn]: variations };
    }

    const habsV_all = await Habitante.findAll({
      where: wh, attributes: ['fecha_nacimiento', 'incapacitado', 'cedula', 'consejo_comunal_id']
    });
    const vivsV_all = await Vivienda.findAll({ where: wv, attributes: ['id_comunidad'] });

    let [tHab, tElec, tNinos, tMayores, tDisc, tViv] = [0,0,0,0,0,0];

    for (let c of consejos) {
      if (filtros.consejo_id && filtros.consejo_id.toString() !== c.id.toString()) continue;
      
      const cIdStr = c.id.toString();
      
      // Filter in memory for current consejo
      const habsN = habsN_all.filter(h => h.EstudioDemografico && h.EstudioDemografico.id_comunidad && h.EstudioDemografico.id_comunidad.toString() === cIdStr);
      const vivsN = vivsN_all.filter(v => v.id_comunidad && v.id_comunidad.toString() === cIdStr).length;
      const habsV = habsV_all.filter(h => h.consejo_comunal_id && h.consejo_comunal_id.toString() === cIdStr);
      const vivsV = vivsV_all.filter(v => v.id_comunidad && v.id_comunidad.toString() === cIdStr).length;

      let electores = 0, ninos = 0, mayores = 0, disc = 0;
      
      const countHab = (h, isNew) => {
        if (h.fecha_nacimiento) {
          const fn = new Date(h.fecha_nacimiento);
          if (fn <= hace18) electores++;
          if (fn > hace18) ninos++;
          if (fn <= hace60) mayores++;
        }
        if (isNew) {
          // Censo nuevo: discapacidad_tipo no vacío
          if (h.discapacidad_tipo && h.discapacidad_tipo.trim() !== '') disc++;
        } else {
          // Censo legacy: campo boolean incapacitado
          if (h.incapacitado === true) disc++;
        }
      };

      habsN.forEach(h => countHab(h, true));
      habsV.forEach(h => countHab(h, false));

      const totalH = habsN.length + habsV.length;
      const totalV = vivsN + vivsV;

      resumen.push({
        consejo: c.nombre_comunidad,
        total_hab: totalH, electores, ninos, mayores, disc,
        viviendas: totalV
      });
      
      tHab += totalH; tElec += electores; tNinos += ninos; 
      tMayores += mayores; tDisc += disc; tViv += totalV;
    }

    resumen.push({ consejo: 'TOTAL', total_hab: tHab, electores: tElec, ninos: tNinos, mayores: tMayores, disc: tDisc, viviendas: tViv });
    return resumen;
  }

  /**
   * Extrae los datos formateados según el tipo de reporte solicitado
   */
  static async getReporteData(models, tipo, filtros = {}) {
    const { CensoCaracteristicaFamiliar, EstudioDemografico, Habitante, Vivienda, ConsejoComunal, CensoSituacionVivienda } = models;
    let title = 'Reporte del Sistema';
    let headers = [];
    
    let rowsNuevos = [];
    let rowsViejos = [];

    const wf = CensoReportesService._buildFiltrosFamiliar(filtros, Op);
    const we = CensoReportesService._buildFiltrosEstudio(filtros, Op);
    // Nota: wh se construye con deduplicación después de obtener rowsNuevos
    const wh = CensoReportesService._buildFiltrosHabitanteLegacy(filtros, Op);
    const wv = CensoReportesService._buildFiltrosViviendaLegacy(filtros, Op);

    const incEstudio = { model: EstudioDemografico, where: we, required: true, include: [{ model: ConsejoComunal, as: 'consejo' }] };
    const incConsejoLegacy = [{ model: ConsejoComunal, as: 'consejo' }];

    const calcEdad = (d) => {
      if(!d) return 'N/A';
      return Math.abs(new Date(Date.now() - new Date(d).getTime()).getUTCFullYear() - 1970);
    };

    switch (tipo) {
      case 'total-personas':
        title = 'Listado Total de Personas';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rowsNuevos = await CensoCaracteristicaFamiliar.findAll({ where: wf, include: [incEstudio] });
        { const ced = new Set(rowsNuevos.map(r => (r.cedula_identidad||'').replace(/[^0-9]/g,'')).filter(Boolean)); CensoReportesService._aplicarDeduplicacion(wh, ced, Op); }
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'discapacidad':
        title = 'Personas con Discapacidad';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Tipo Incapacidad', 'Consejo Comunal'];
        wf.discapacidad_tipo = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
        wh.incapacitado = true; // Campo booleano correcto en tabla habitantes
        rowsNuevos = await CensoCaracteristicaFamiliar.findAll({ where: wf, include: [incEstudio] });
        { const ced = new Set(rowsNuevos.map(r => (r.cedula_identidad||'').replace(/[^0-9]/g,'')).filter(Boolean)); CensoReportesService._aplicarDeduplicacion(wh, ced, Op); }
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'viviendas':
        title = 'Censo de Viviendas';
        headers = ['Tipo Vivienda', 'Dirección', 'Consejo Comunal'];
        
        rowsNuevos = await EstudioDemografico.findAll({ where: we, include: [{ model: ConsejoComunal, as: 'consejo' }, { model: CensoSituacionVivienda, as: 'situacion_vivienda' }] });
        rowsViejos = await Vivienda.findAll({ where: wv, include: incConsejoLegacy });
        break;

      case 'adultos-mayores':
      case 'ninos':
      case 'electores':
        const h60 = new Date(); h60.setFullYear(h60.getFullYear() - 60);
        const h18 = new Date(); h18.setFullYear(h18.getFullYear() - 18);
        
        if (tipo === 'adultos-mayores') {
           title = 'Adultos Mayores (60+ años)';
           wf.fecha_nacimiento = { [Op.lte]: h60 }; wh.fecha_nacimiento = { [Op.lte]: h60 };
        } else if (tipo === 'ninos') {
           title = 'Niños y Adolescentes';
           wf.fecha_nacimiento = { [Op.gt]: h18 }; wh.fecha_nacimiento = { [Op.gt]: h18 };
        } else {
           title = 'Registro Electoral Comunitario';
           wf.fecha_nacimiento = { [Op.lte]: h18 }; wh.fecha_nacimiento = { [Op.lte]: h18 };
        }
        
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rowsNuevos = await CensoCaracteristicaFamiliar.findAll({ where: wf, include: [incEstudio] });
        { const ced = new Set(rowsNuevos.map(r => (r.cedula_identidad||'').replace(/[^0-9]/g,'')).filter(Boolean)); CensoReportesService._aplicarDeduplicacion(wh, ced, Op); }
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'embarazadas':
      case 'lactantes':
        title = `Mujeres ${tipo === 'embarazadas' ? 'Embarazadas' : 'Lactantes'} (Censo Demográfico)`;
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        wf.sexo = { [Op.in]: ['F', 'Femenino'] };
        wh.genero = { [Op.in]: ['F', 'Femenino'] };
        rowsNuevos = await CensoCaracteristicaFamiliar.findAll({ where: wf, include: [incEstudio] });
        { const ced = new Set(rowsNuevos.map(r => (r.cedula_identidad||'').replace(/[^0-9]/g,'')).filter(Boolean)); CensoReportesService._aplicarDeduplicacion(wh, ced, Op); }
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'encamados':
        title = 'Personas Encamadas o con Limitaciones Severas';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Tipo Incapacidad', 'Consejo Comunal'];
        wf.discapacidad_tipo = { [Op.iLike]: '%encamado%' };
        wh.condicion_salud = { [Op.iLike]: '%encamado%' };
        rowsNuevos = await CensoCaracteristicaFamiliar.findAll({ where: wf, include: [incEstudio] });
        { const ced = new Set(rowsNuevos.map(r => (r.cedula_identidad||'').replace(/[^0-9]/g,'')).filter(Boolean)); CensoReportesService._aplicarDeduplicacion(wh, ced, Op); }
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'por-cc':
      case 'genero':
        title = tipo === 'genero' ? 'Padrón Ordenado por Género' : 'Padrón Ordenado por Consejo Comunal';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rowsNuevos = await CensoCaracteristicaFamiliar.findAll({ where: wf, include: [incEstudio] });
        { const ced = new Set(rowsNuevos.map(r => (r.cedula_identidad||'').replace(/[^0-9]/g,'')).filter(Boolean)); CensoReportesService._aplicarDeduplicacion(wh, ced, Op); }
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'resumen-consejos':
        title = 'Resumen Detallado por Consejo Comunal';
        headers = ['Consejo Comunal', 'Total Hab.', 'Electores', 'Niños', 'Ad. Mayores', 'Discapacidad', 'Viviendas'];
        const resList = await CensoReportesService.getResumenPorConsejo(models, filtros);
        return {
          title, headers, 
          rows: resList.map(r => [r.consejo, r.total_hab, r.electores, r.ninos, r.mayores, r.disc, r.viviendas])
        };

      default: throw new Error('Tipo de reporte no soportado: ' + tipo);
    }

    const extraCols = filtros.extras ? filtros.extras.split(',') : [];
    if (tipo !== 'viviendas' && tipo !== 'resumen-consejos') {
      if (extraCols.includes('telefono')) headers.push('Teléfono');
      if (extraCols.includes('salud')) headers.push('Cond. Salud');
      if (extraCols.includes('trabajo')) headers.push('Labora');
      if (extraCols.includes('nivel_academico')) headers.push('Nivel Acad.');
    }

    let rowsCombinados = [];

    // Mapear Nuevos
    if (tipo === 'viviendas') {
       rowsNuevos.forEach(v => rowsCombinados.push([
         v.situacion_vivienda ? v.situacion_vivienda.tipo_vivienda : 'N/A',
         v.direccion_comunidad || 'N/A',
         v.consejo ? v.consejo.nombre_comunidad : 'N/A'
       ]));
       rowsViejos.forEach(v => rowsCombinados.push([
         v.tipo_vivienda || 'N/A',
         v.direccion || 'N/A',
         v.consejo ? v.consejo.nombre_comunidad : 'N/A'
       ]));
    } else {
       const mapPersona = (item, isNew) => {
         const cedula = isNew ? item.cedula_identidad : item.cedula;
         const nombre = isNew ? item.nombres_apellidos : `${item.nombres || ''} ${item.apellidos || ''}`.trim();
         const fnac = item.fecha_nacimiento ? new Date(item.fecha_nacimiento).toISOString().split('T')[0] : 'N/A';
         const edad = calcEdad(item.fecha_nacimiento);
         const genero = isNew ? item.sexo : item.genero;
         const saludStr = isNew ? item.discapacidad_tipo : item.incapacitado_tipo; // usar campo correcto del habitante legacy
         const consejo = isNew 
            ? (item.EstudioDemografico && item.EstudioDemografico.consejo ? item.EstudioDemografico.consejo.nombre_comunidad : 'N/A')
            : (item.consejo ? item.consejo.nombre_comunidad : 'N/A');

         let rd = [];
         if (tipo === 'discapacidad' || tipo === 'encamados') rd = [cedula || 'N/A', nombre || 'N/A', fnac, edad, saludStr || 'N/A', consejo];
         else rd = [cedula || 'N/A', nombre || 'N/A', fnac, edad, genero || 'N/A', consejo];
         
         if (extraCols.includes('telefono')) rd.push(isNew ? 'N/A' : (item.telefono || 'N/A'));
         if (extraCols.includes('salud')) rd.push(saludStr || 'N/A');
         if (extraCols.includes('trabajo')) rd.push(isNew ? (item.profesion ? 'Sí' : 'No') : (item.trabaja_actualmente ? 'Sí' : 'No'));
         if (extraCols.includes('nivel_academico')) rd.push(isNew ? (item.grado_instruccion || 'N/A') : (item.nivel_educativo || 'N/A'));
         
         rowsCombinados.push(rd);
       };
       rowsNuevos.forEach(p => mapPersona(p, true));
       rowsViejos.forEach(p => mapPersona(p, false));
    }

    if (tipo === 'por-cc') rowsCombinados.sort((a,b) => a[5].localeCompare(b[5]));
    if (tipo === 'genero') rowsCombinados.sort((a,b) => a[4].localeCompare(b[4]));

    return { title, headers, rows: rowsCombinados };
  }
}

module.exports = CensoReportesService;

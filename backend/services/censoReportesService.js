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
    // Edades (Solo si no viene nacimiento)
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

    if (filtros.genero) where.sexo = filtros.genero; // Map genero to sexo
    
    if (filtros.salud) {
      if (filtros.salud === 'discapacidad') {
         where.discapacidad_tipo = { [Op.ne]: null, [Op.not]: '' };
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
      where.profesion = (filtros.trabajo === '1') ? { [Op.ne]: null, [Op.not]: '' } : { [Op.or]: [null, ''] }; 
      // "trabaja_actualmente" no existe, inferimos de profesion si la persona labora
    }
    return where;
  }

  /**
   * Helper para construir where de EstudioDemografico
   */
  static _buildFiltrosEstudio(filtros, Op) {
    const where = {};
    if (filtros.consejo_id || filtros.id_comunidad) {
      where.id_comunidad = filtros.consejo_id || filtros.id_comunidad;
    }
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      where.fecha_creacion = {
        [Op.between]: [new Date(filtros.fecha_desde), new Date(filtros.fecha_hasta + 'T23:59:59Z')]
      };
    } else if (filtros.desde && filtros.hasta) { // Alias común
      where.fecha_creacion = {
        [Op.between]: [new Date(filtros.desde), new Date(filtros.hasta + 'T23:59:59Z')]
      };
    }
    return where;
  }

  /**
   * Obtiene la fecha del primer estudio registrado en el sistema
   */
  static async getFechaMinima(models) {
    try {
      const minDate = await models.EstudioDemografico.min('fecha_creacion');
      return minDate ? new Date(minDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    } catch(err) {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Obtiene los KPIs generales del censo
   */
  static async getKpis(models, filtros = {}) {
    const { CensoCaracteristicaFamiliar, EstudioDemografico } = models;
    const whereFamiliar = CensoReportesService._buildFiltrosFamiliar(filtros, Op);
    const whereEstudio = CensoReportesService._buildFiltrosEstudio(filtros, Op);

    const baseInclude = {
      model: EstudioDemografico,
      where: whereEstudio,
      required: true
    };

    // 1. Total Personas
    const totalPersonas = await CensoCaracteristicaFamiliar.count({ 
      where: whereFamiliar,
      include: [baseInclude] 
    });

    // 2. Discapacidad
    const conDiscapacidad = await CensoCaracteristicaFamiliar.count({
      where: {
        ...whereFamiliar,
        discapacidad_tipo: { [Op.ne]: null, [Op.not]: '' }
      },
      include: [baseInclude]
    });

    // 3. Viviendas (Estudios demográficos)
    const totalViviendas = await EstudioDemografico.count({ where: whereEstudio });

    // 4. Adultos mayores (60+ años)
    const hace60 = new Date();
    hace60.setFullYear(hace60.getFullYear() - 60);
    const adultosMayores = await CensoCaracteristicaFamiliar.count({
      where: {
        ...whereFamiliar,
        fecha_nacimiento: { [Op.lte]: hace60 }
      },
      include: [baseInclude]
    });

    // Niños y adolescentes (< 18 años)
    const hace18 = new Date();
    hace18.setFullYear(hace18.getFullYear() - 18);
    const ninos = await CensoCaracteristicaFamiliar.count({
      where: {
        ...whereFamiliar,
        fecha_nacimiento: { [Op.gt]: hace18 }
      },
      include: [baseInclude]
    });

    return {
      totalPersonas,
      conDiscapacidad,
      totalViviendas,
      adultosMayores,
      ninos
    };
  }

  /**
   * Obtiene la tabla resumen agrupada por Consejo Comunal
   */
  static async getResumenPorConsejo(models, filtros = {}) {
    const { ConsejoComunal, CensoCaracteristicaFamiliar, EstudioDemografico } = models;
    const consejos = await ConsejoComunal.findAll({ attributes: ['id', 'nombre_comunidad'] });
    const resumen = [];
    
    const filtrosClon = { ...filtros };
    delete filtrosClon.consejo_id;
    const globalFamiliarWhere = CensoReportesService._buildFiltrosFamiliar(filtrosClon, Op);
    const globalEstudioWhere = CensoReportesService._buildFiltrosEstudio(filtrosClon, Op);

    const hace18 = new Date(); hace18.setFullYear(hace18.getFullYear() - 18);
    const hace60 = new Date(); hace60.setFullYear(hace60.getFullYear() - 60);

    let [tHab, tElec, tNinos, tMayores, tDisc, tViv] = [0,0,0,0,0,0];

    for (let c of consejos) {
      if (filtros.consejo_id && filtros.consejo_id.toString() !== c.id.toString()) continue;

      const habs = await CensoCaracteristicaFamiliar.findAll({ 
        where: globalFamiliarWhere, 
        attributes: ['fecha_nacimiento', 'discapacidad_tipo'],
        include: [{
          model: EstudioDemografico,
          where: { ...globalEstudioWhere, id_comunidad: c.id },
          required: true
        }]
      });
      const vivs = await EstudioDemografico.count({ where: { ...globalEstudioWhere, id_comunidad: c.id } });

      let electores = 0, ninos = 0, mayores = 0, disc = 0;
      habs.forEach(h => {
        if (h.fecha_nacimiento) {
          const fn = new Date(h.fecha_nacimiento);
          if (fn <= hace18) electores++;
          if (fn > hace18) ninos++;
          if (fn <= hace60) mayores++;
        }
        if (h.discapacidad_tipo && h.discapacidad_tipo.trim() !== '') disc++;
      });

      resumen.push({
        consejo: c.nombre_comunidad,
        total_hab: habs.length,
        electores, ninos, mayores, disc,
        viviendas: vivs
      });
      
      tHab += habs.length; tElec += electores; tNinos += ninos; 
      tMayores += mayores; tDisc += disc; tViv += vivs;
    }

    resumen.push({ 
      consejo: 'TOTAL', total_hab: tHab, electores: tElec, 
      ninos: tNinos, mayores: tMayores, disc: tDisc, viviendas: tViv 
    });
    
    return resumen;
  }

  /**
   * Extrae los datos formateados según el tipo de reporte solicitado
   */
  static async getReporteData(models, tipo, filtros = {}) {
    const { CensoCaracteristicaFamiliar, EstudioDemografico, ConsejoComunal, CensoSituacionVivienda } = models;
    let title = 'Reporte del Sistema';
    let headers = [];
    let rawData = [];

    const whereFamiliar = CensoReportesService._buildFiltrosFamiliar(filtros, Op);
    const whereEstudio = CensoReportesService._buildFiltrosEstudio(filtros, Op);

    const includeEstudioBase = {
      model: EstudioDemografico,
      where: whereEstudio,
      required: true,
      include: [
        { model: ConsejoComunal, as: 'consejo', attributes: ['nombre_comunidad'] }
      ]
    };

    switch (tipo) {
      case 'total-personas':
        title = 'Listado Total de Personas';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rawData = await CensoCaracteristicaFamiliar.findAll({
          where: whereFamiliar,
          include: [includeEstudioBase],
          order: [['id_familiar', 'DESC']]
        });
        break;

      case 'discapacidad':
        title = 'Personas con Discapacidad';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Tipo Incapacidad', 'Consejo Comunal'];
        whereFamiliar.discapacidad_tipo = { [Op.ne]: null, [Op.not]: '' };
        rawData = await CensoCaracteristicaFamiliar.findAll({
          where: whereFamiliar,
          include: [includeEstudioBase]
        });
        break;

      case 'viviendas':
        title = 'Censo de Viviendas';
        headers = ['Tipo Vivienda', 'Dirección', 'Consejo Comunal'];
        const includeViv = [
          { model: ConsejoComunal, as: 'consejo', attributes: ['nombre_comunidad'] },
          { model: CensoSituacionVivienda, as: 'situacion_vivienda' }
        ];
        rawData = await EstudioDemografico.findAll({
          where: whereEstudio,
          include: includeViv
        });
        break;

      case 'adultos-mayores':
        title = 'Adultos Mayores (60+ años)';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        const hace60 = new Date();
        hace60.setFullYear(hace60.getFullYear() - 60);
        whereFamiliar.fecha_nacimiento = { [Op.lte]: hace60 };
        rawData = await CensoCaracteristicaFamiliar.findAll({
          where: whereFamiliar,
          include: [includeEstudioBase]
        });
        break;

      case 'ninos':
        title = 'Niños y Adolescentes';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        const hace18 = new Date();
        hace18.setFullYear(hace18.getFullYear() - 18);
        whereFamiliar.fecha_nacimiento = { [Op.gt]: hace18 };
        rawData = await CensoCaracteristicaFamiliar.findAll({
          where: whereFamiliar,
          include: [includeEstudioBase]
        });
        break;

      case 'electores':
        title = 'Registro Electoral Comunitario';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        const date18 = new Date(); date18.setFullYear(date18.getFullYear() - 18);
        whereFamiliar.fecha_nacimiento = { [Op.lte]: date18 };
        rawData = await CensoCaracteristicaFamiliar.findAll({ where: whereFamiliar, include: [includeEstudioBase] });
        break;

      case 'embarazadas':
      case 'lactantes':
        title = `Mujeres ${tipo === 'embarazadas' ? 'Embarazadas' : 'Lactantes'} (Censo Demográfico)`;
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        whereFamiliar.sexo = { [Op.in]: ['F', 'Femenino'] };
        rawData = await CensoCaracteristicaFamiliar.findAll({ where: whereFamiliar, include: [includeEstudioBase] });
        break;

      case 'encamados':
        title = 'Personas Encamadas o con Limitaciones Severas';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Tipo Incapacidad', 'Consejo Comunal'];
        whereFamiliar.discapacidad_tipo = { [Op.iLike]: '%encamado%' };
        rawData = await CensoCaracteristicaFamiliar.findAll({ where: whereFamiliar, include: [includeEstudioBase] });
        break;

      case 'por-cc':
        title = 'Padrón Ordenado por Consejo Comunal';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rawData = await CensoCaracteristicaFamiliar.findAll({ 
          where: whereFamiliar, 
          include: [includeEstudioBase]
        });
        break;

      case 'genero':
        title = 'Padrón Ordenado por Género';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rawData = await CensoCaracteristicaFamiliar.findAll({ where: whereFamiliar, include: [includeEstudioBase], order: [['sexo', 'ASC']] });
        break;

      case 'resumen-consejos':
        title = 'Resumen Detallado por Consejo Comunal';
        headers = ['Consejo Comunal', 'Total Hab.', 'Electores', 'Niños', 'Ad. Mayores', 'Discapacidad', 'Viviendas'];
        const resList = await CensoReportesService.getResumenPorConsejo(models, filtros);
        return {
          title, headers, 
          rows: resList.map(r => [r.consejo, r.total_hab, r.electores, r.ninos, r.mayores, r.disc, r.viviendas])
        };

      default:
        throw new Error('Tipo de reporte no soportado: ' + tipo);
    }

    // Identificar columnas extras solicitadas por el usuario
    const extraCols = filtros.extras ? filtros.extras.split(',') : [];
    if (tipo !== 'viviendas' && tipo !== 'resumen-consejos') {
      if (extraCols.includes('telefono')) headers.push('Teléfono');
      if (extraCols.includes('salud')) headers.push('Cond. Salud');
      if (extraCols.includes('trabajo')) headers.push('Labora');
      if (extraCols.includes('nivel_academico')) headers.push('Nivel Acad.');
    }

    // Calcular edad helper
    const calcEdad = (d) => {
      if(!d) return 'N/A';
      const diff = Date.now() - new Date(d).getTime();
      return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    // Mapeo de los resultados crudos a las filas de la tabla
    const rows = rawData.map(item => {
      if (tipo === 'viviendas') {
        return [
          item.situacion_vivienda ? item.situacion_vivienda.tipo_vivienda : 'N/A',
          item.direccion_comunidad || 'N/A',
          item.consejo ? item.consejo.nombre_comunidad : 'N/A'
        ];
      }

      // Para los reportes de personas (CensoCaracteristicaFamiliar)
      const fullName = item.nombres_apellidos || 'N/A';
      const consejoName = item.EstudioDemografico && item.EstudioDemografico.consejo ? item.EstudioDemografico.consejo.nombre_comunidad : 'N/A';
      const cedula = item.cedula_identidad || 'N/A';
      const fnac = item.fecha_nacimiento ? new Date(item.fecha_nacimiento).toISOString().split('T')[0] : 'N/A';
      const edad = calcEdad(item.fecha_nacimiento);

      let rowData = [];

      if (tipo === 'total-personas' || tipo === 'por-cc' || tipo === 'genero' || tipo === 'embarazadas' || tipo === 'lactantes') 
        rowData = [cedula, fullName, fnac, edad, item.sexo || 'N/A', consejoName];
      else if (tipo === 'discapacidad' || tipo === 'encamados') 
        rowData = [cedula, fullName, fnac, edad, item.discapacidad_tipo || 'N/A', consejoName];
      else if (tipo === 'electores' || tipo === 'adultos-mayores') 
        rowData = [cedula, fullName, fnac, edad, item.sexo || 'N/A', consejoName];
      else if (tipo === 'ninos') 
        rowData = [cedula, fullName, fnac, edad, item.sexo || 'N/A', consejoName];
      
      // Añadir extras al rowData si se solicitaron
      if (extraCols.includes('telefono')) rowData.push('N/A'); // No tenemos telefono individual
      if (extraCols.includes('salud')) rowData.push(item.discapacidad_tipo || 'N/A');
      if (extraCols.includes('trabajo')) rowData.push(item.profesion ? 'Sí' : 'No');
      if (extraCols.includes('nivel_academico')) rowData.push(item.grado_instruccion || 'N/A');

      return rowData;
    });

    if (tipo === 'por-cc') {
       rows.sort((a,b) => a[5].localeCompare(b[5])); // Sort by Consejo Comunal string
    }

    return { title, headers, rows };
  }
}

module.exports = CensoReportesService;

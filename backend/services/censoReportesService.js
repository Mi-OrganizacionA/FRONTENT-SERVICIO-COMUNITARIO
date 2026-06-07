const { Op } = require('sequelize');

class CensoReportesService {
  /**
   * Helper para construir where de Habitante unificado
   */
  static _buildFiltrosHabitante(filtros, Op) {
    const where = {};
    if (filtros.consejo_id || filtros.id_comunidad) {
      where.consejo_comunal_id = filtros.consejo_id || filtros.id_comunidad;
    }
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      where.fecha_registro = {
        [Op.between]: [new Date(filtros.fecha_desde), new Date(filtros.fecha_hasta + 'T23:59:59Z')]
      };
    } else if (filtros.desde && filtros.hasta) { // Alias común
      where.fecha_registro = {
        [Op.between]: [new Date(filtros.desde), new Date(filtros.hasta + 'T23:59:59Z')]
      };
    }
    
    // Edades
    if (filtros.edad_min || filtros.edad_max) {
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

    if (filtros.genero) where.genero = filtros.genero;
    if (filtros.salud) where.condicion_salud = filtros.salud;
    if (filtros.cne !== undefined && filtros.cne !== null && filtros.cne !== '') {
      // Inscrito_cne suele ser booleano
      where.inscrito_cne = filtros.cne === '1';
    }
    if (filtros.trabajo !== undefined && filtros.trabajo !== null && filtros.trabajo !== '') {
      where.trabaja_actualmente = filtros.trabajo === '1';
    }
    return where;
  }

  /**
   * Obtiene los KPIs generales del censo
   */
  static async getKpis(models, filtros = {}) {
    const { Habitante, Vivienda } = models;
    const whereHabitante = CensoReportesService._buildFiltrosHabitante(filtros, Op);
    const whereVivienda = {};

    if (filtros.consejo_id) {
      whereVivienda.id_comunidad = filtros.consejo_id;
    }
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      const fechaFilter = { [Op.between]: [new Date(filtros.fecha_desde), new Date(filtros.fecha_hasta + 'T23:59:59Z')] };
      whereVivienda.fecha_registro = fechaFilter;
    } else if (filtros.desde && filtros.hasta) {
      const fechaFilter = { [Op.between]: [new Date(filtros.desde), new Date(filtros.hasta + 'T23:59:59Z')] };
      whereVivienda.fecha_registro = fechaFilter;
    }

    // 1. Total Personas
    const totalPersonas = await Habitante.count({ where: whereHabitante });

    // 2. Discapacidad
    const conDiscapacidad = await Habitante.count({
      where: {
        ...whereHabitante,
        condicion_salud: 'discapacidad'
      }
    });

    // 3. Viviendas
    const totalViviendas = await Vivienda.count({ where: whereVivienda });

    // 4. Adultos mayores (60+ años)
    // fecha_nacimiento <= fecha_hace_60_años
    const hace60 = new Date();
    hace60.setFullYear(hace60.getFullYear() - 60);
    const adultosMayores = await Habitante.count({
      where: {
        ...whereHabitante,
        fecha_nacimiento: { [Op.lte]: hace60 }
      }
    });

    // Niños y adolescentes (< 18 años)
    const hace18 = new Date();
    hace18.setFullYear(hace18.getFullYear() - 18);
    const ninos = await Habitante.count({
      where: {
        ...whereHabitante,
        fecha_nacimiento: { [Op.gt]: hace18 }
      }
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
    const { ConsejoComunal, Habitante, Vivienda } = models;
    const consejos = await ConsejoComunal.findAll({ attributes: ['id', 'nombre_comunidad'] });
    const resumen = [];
    
    // Construir base de filtros global (fecha, edad, genero, etc.) excepto consejo_id
    const filtrosClon = { ...filtros };
    delete filtrosClon.consejo_id;
    const globalHabitanteWhere = CensoReportesService._buildFiltrosHabitante(filtrosClon, Op);

    // Cálculos de edad
    const hace18 = new Date(); hace18.setFullYear(hace18.getFullYear() - 18);
    const hace60 = new Date(); hace60.setFullYear(hace60.getFullYear() - 60);

    let [tHab, tElec, tNinos, tMayores, tDisc, tViv] = [0,0,0,0,0,0];

    for (let c of consejos) {
      // Si el filtro original forzaba UN SOLO consejo, omitir los demás
      if (filtros.consejo_id && filtros.consejo_id.toString() !== c.id.toString()) continue;

      const habs = await Habitante.findAll({ 
        where: { ...globalHabitanteWhere, consejo_comunal_id: c.id }, 
        attributes: ['fecha_nacimiento', 'condicion_salud'] 
      });
      const vivs = await Vivienda.count({ where: { id_comunidad: c.id } });

      let electores = 0, ninos = 0, mayores = 0, disc = 0;
      habs.forEach(h => {
        if (h.fecha_nacimiento) {
          const fn = new Date(h.fecha_nacimiento);
          if (fn <= hace18) electores++;
          if (fn > hace18) ninos++;
          if (fn <= hace60) mayores++;
        }
        if (h.condicion_salud === 'discapacidad') disc++;
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
    const { Habitante, Vivienda, ConsejoComunal } = models;
    let title = 'Reporte del Sistema';
    let headers = [];
    let rawData = [];

    const whereHabitante = CensoReportesService._buildFiltrosHabitante(filtros, Op);

    const includeConsejo = {
      model: ConsejoComunal,
      as: 'consejo',
      attributes: ['nombre_comunidad']
    };

    switch (tipo) {
      case 'total-personas':
        title = 'Listado Total de Personas';
        headers = ['Cédula', 'Nombres y Apellidos', 'Género', 'Consejo Comunal'];
        rawData = await Habitante.findAll({
          where: whereHabitante,
          include: [includeConsejo],
          order: [['id', 'DESC']]
        });
        break;

      case 'discapacidad':
        title = 'Personas con Discapacidad';
        headers = ['Cédula', 'Nombre Completo', 'Tipo Incapacidad', 'Consejo Comunal'];
        whereHabitante.condicion_salud = 'discapacidad';
        rawData = await Habitante.findAll({
          where: whereHabitante,
          include: [includeConsejo]
        });
        break;

      case 'viviendas':
        title = 'Censo de Viviendas';
        headers = ['Tipo Vivienda', 'Dirección', 'Consejo Comunal'];
        const whereVivienda = {};
        if (filtros.consejo_id) whereVivienda.id_comunidad = filtros.consejo_id;
        
        rawData = await Vivienda.findAll({
          where: whereVivienda,
          include: [{ model: ConsejoComunal, as: 'consejo', attributes: ['nombre_comunidad'] }]
        });
        break;

      case 'adultos-mayores':
        title = 'Adultos Mayores (60+ años)';
        headers = ['Cédula', 'Nombre Completo', 'Pensionado', 'Consejo Comunal'];
        const hace60 = new Date();
        hace60.setFullYear(hace60.getFullYear() - 60);
        whereHabitante.fecha_nacimiento = { [Op.lte]: hace60 };
        rawData = await Habitante.findAll({
          where: whereHabitante,
          include: [includeConsejo]
        });
        break;

      case 'ninos':
        title = 'Niños y Adolescentes';
        headers = ['Cédula', 'Nombre Completo', 'Fecha Nac.', 'Consejo Comunal'];
        const hace18 = new Date();
        hace18.setFullYear(hace18.getFullYear() - 18);
        whereHabitante.fecha_nacimiento = { [Op.gt]: hace18 };
        rawData = await Habitante.findAll({
          where: whereHabitante,
          include: [includeConsejo]
        });
        break;

      case 'electores':
        title = 'Registro Electoral Comunitario';
        headers = ['Cédula', 'Nombre Completo', 'Edad', 'Consejo Comunal'];
        const date18 = new Date(); date18.setFullYear(date18.getFullYear() - 18);
        whereHabitante.fecha_nacimiento = { [Op.lte]: date18 };
        rawData = await Habitante.findAll({ where: whereHabitante, include: [includeConsejo] });
        break;

      case 'embarazadas':
      case 'lactantes':
        // Como no hay campo estricto de embarazadas en la tabla actual, listamos Mujeres en edad fertil
        title = `Mujeres ${tipo === 'embarazadas' ? 'Embarazadas' : 'Lactantes'} (Censo Demográfico)`;
        headers = ['Cédula', 'Nombre Completo', 'Género', 'Consejo Comunal'];
        whereHabitante.genero = 'F';
        rawData = await Habitante.findAll({ where: whereHabitante, include: [includeConsejo] });
        break;

      case 'encamados':
        title = 'Personas Encamadas o con Limitaciones Severas';
        headers = ['Cédula', 'Nombre Completo', 'Tipo Incapacidad', 'Consejo Comunal'];
        whereHabitante.condicion_salud = 'encamado';
        rawData = await Habitante.findAll({ where: whereHabitante, include: [includeConsejo] });
        break;

      case 'por-cc':
        title = 'Padrón Ordenado por Consejo Comunal';
        headers = ['Cédula', 'Nombre Completo', 'Género', 'Consejo Comunal'];
        rawData = await Habitante.findAll({ where: whereHabitante, include: [includeConsejo], order: [['consejo_comunal_id', 'ASC']] });
        break;

      case 'genero':
        title = 'Padrón Ordenado por Género';
        headers = ['Cédula', 'Nombre Completo', 'Género', 'Consejo Comunal'];
        rawData = await Habitante.findAll({ where: whereHabitante, include: [includeConsejo], order: [['genero', 'ASC']] });
        break;

      case 'resumen-consejos':
        title = 'Resumen Detallado por Consejo Comunal';
        headers = ['Consejo Comunal', 'Total Hab.', 'Electores', 'Niños', 'Ad. Mayores', 'Discapacidad', 'Viviendas'];
        const resList = await CensoReportesService.getResumenPorConsejo(models);
        // Para reporte no mapeamos igual que rawData normal
        return {
          title, headers, 
          rows: resList.map(r => [r.consejo, r.total_hab, r.electores, r.ninos, r.mayores, r.disc, r.viviendas])
        };

      default:
        throw new Error('Tipo de reporte no soportado: ' + tipo);
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
          item.tipo_vivienda || 'N/A',
          item.direccion || 'N/A',
          item.consejo ? item.consejo.nombre_comunidad : 'N/A'
        ];
      }

      // Para los demás que son basados en Habitante
      const fullName = `${item.nombres} ${item.apellidos}`;
      const consejoName = item.consejo ? item.consejo.nombre_comunidad : 'N/A';
      const cedula = item.cedula || 'N/A';

      if (tipo === 'total-personas' || tipo === 'por-cc' || tipo === 'genero' || tipo === 'embarazadas' || tipo === 'lactantes') 
        return [cedula, fullName, item.genero || 'N/A', consejoName];
      if (tipo === 'discapacidad' || tipo === 'encamados') 
        return [cedula, fullName, item.incapacitado_tipo || 'N/A', consejoName];
      if (tipo === 'electores' || tipo === 'adultos-mayores') 
        return [cedula, fullName, typeof calcEdad !== 'undefined' ? calcEdad(item.fecha_nacimiento) : 'N/A', consejoName];
      if (tipo === 'ninos') 
        return [cedula, fullName, item.fecha_nacimiento ? item.fecha_nacimiento.toISOString().split('T')[0] : 'N/A', consejoName];
      
      return [];
    });

    return { title, headers, rows };
  }
}

module.exports = CensoReportesService;

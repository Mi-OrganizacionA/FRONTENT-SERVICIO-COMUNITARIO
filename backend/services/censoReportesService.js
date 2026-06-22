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
         // Ya que ahora discapacidad_tipo puede almacenar "saludable" u "enfermedad_cronica", usamos incapacitado
         where.incapacitado = true;
      } else if (filtros.salud === 'encamado') {
         where.discapacidad_tipo = { [Op.like]: '%encamado%' };
      } else {
         where.discapacidad_tipo = { [Op.like]: `%${filtros.salud}%` };
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
   * Ahora los conteos de personas se hacen estrictamente sobre la tabla Habitantes.
   */
  static async getKpis(models, filtros = {}) {
    const { EstudioDemografico, Habitante, Vivienda } = models;
    
    const whereEstudio = CensoReportesService._buildFiltrosEstudio(filtros, Op);
    const whereVivLegacy = CensoReportesService._buildFiltrosViviendaLegacy(filtros, Op);
    const whereHab = CensoReportesService._buildFiltrosHabitanteLegacy(filtros, Op);

    const includeConsejo = models.ConsejoComunal ? [{
      model: models.ConsejoComunal,
      as: 'consejo',
      attributes: ['id']
    }] : [];

    // 1. Total Personas (solo Habitantes)
    const resTotal = await Habitante.findAndCountAll({ where: whereHab, include: includeConsejo });
    const totalPersonas = resTotal.count;

    // 2. Discapacidad
    const resDisc = await Habitante.findAndCountAll({
      where: { ...whereHab, incapacitado: true }, include: includeConsejo
    });
    const conDiscapacidad = resDisc.count;

    // 3. Viviendas (Estudio Demográfico + Vivienda)
    const vivNuevos = await EstudioDemografico.count({ where: whereEstudio });
    const vivViejos = await Vivienda.count({ where: whereVivLegacy });
    const totalViviendas = vivNuevos + vivViejos;

    // 4. Adultos mayores (60+ años)
    const hace60 = new Date(); hace60.setFullYear(hace60.getFullYear() - 60);
    const resMayores = await Habitante.findAndCountAll({
      where: { ...whereHab, fecha_nacimiento: { [Op.lte]: hace60 } }, include: includeConsejo
    });
    const adultosMayores = resMayores.count;

    // 5. Niños y adolescentes (< 18 años)
    const hace18 = new Date(); hace18.setFullYear(hace18.getFullYear() - 18);
    const resNinos = await Habitante.findAndCountAll({
      where: { ...whereHab, fecha_nacimiento: { [Op.gt]: hace18 } }, include: includeConsejo
    });
    const ninos = resNinos.count;

    return { totalPersonas, conDiscapacidad, totalViviendas, adultosMayores, ninos };
  }

  /**
   * Obtiene la tabla resumen agrupada por Consejo Comunal
   */
  static async getResumenPorConsejo(models, filtros = {}) {
    const { ConsejoComunal, EstudioDemografico, Habitante, Vivienda } = models;
    const { Op } = require('sequelize');
    const consejos = await ConsejoComunal.findAll({ attributes: ['id', 'nombre_comunidad'] });
    const resumen = [];
    
    const fClon = { ...filtros }; delete fClon.consejo_id;
    
    const we = CensoReportesService._buildFiltrosEstudio(fClon, Op);
    const wh = CensoReportesService._buildFiltrosHabitanteLegacy(fClon, Op);
    const wv = CensoReportesService._buildFiltrosViviendaLegacy(fClon, Op);

    if (filtros.consejo_id) {
      we.id_comunidad = filtros.consejo_id;
      wh.consejo_comunal_id = filtros.consejo_id;
      wv.id_comunidad = filtros.consejo_id;
    }

    const hace18 = new Date(); hace18.setFullYear(hace18.getFullYear() - 18);
    const hace60 = new Date(); hace60.setFullYear(hace60.getFullYear() - 60);

    const vivsN_all = await EstudioDemografico.findAll({ where: we, attributes: ['id_comunidad'] });
    const habsV_all = await Habitante.findAll({
      where: wh, attributes: ['fecha_nacimiento', 'incapacitado', 'cedula', 'consejo_comunal_id']
    });
    const vivsV_all = await Vivienda.findAll({ where: wv, attributes: ['id_comunidad'] });

    let [tHab, tElec, tNinos, tMayores, tDisc, tViv] = [0,0,0,0,0,0];

    for (let c of consejos) {
      if (filtros.consejo_id && filtros.consejo_id.toString() !== c.id.toString()) continue;
      
      const cIdStr = c.id.toString();
      
      const vivsN = vivsN_all.filter(v => v.id_comunidad && v.id_comunidad.toString() === cIdStr).length;
      const habsV = habsV_all.filter(h => h.consejo_comunal_id && h.consejo_comunal_id.toString() === cIdStr);
      const vivsV = vivsV_all.filter(v => v.id_comunidad && v.id_comunidad.toString() === cIdStr).length;

      let electores = 0, ninos = 0, mayores = 0, disc = 0;
      
      habsV.forEach(h => {
        if (h.fecha_nacimiento) {
          const fn = new Date(h.fecha_nacimiento);
          if (fn <= hace18) electores++;
          if (fn > hace18) ninos++;
          if (fn <= hace60) mayores++;
        }
        if (h.incapacitado === true) disc++;
      });

      const totalH = habsV.length;
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
    const { EstudioDemografico, Habitante, Vivienda, ConsejoComunal, CensoSituacionVivienda, CensoServicios, CensoSalud, CensoSituacionEconomica, CensoCaracteristicaFamiliar, CensoOpcionMultiple } = models;
    let title = 'Reporte del Sistema';
    let headers = [];
    
    let rowsNuevos = [];
    let rowsViejos = [];

    const we = CensoReportesService._buildFiltrosEstudio(filtros, Op);
    const wh = CensoReportesService._buildFiltrosHabitanteLegacy(filtros, Op);
    const wv = CensoReportesService._buildFiltrosViviendaLegacy(filtros, Op);

    const incConsejoLegacy = [{ model: ConsejoComunal, as: 'consejo' }];

    const calcEdad = (d) => {
      if(!d) return 'N/A';
      return Math.abs(new Date(Date.now() - new Date(d).getTime()).getUTCFullYear() - 1970);
    };

    switch (tipo) {
      case 'total-personas':
        title = 'Listado Total de Personas';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'discapacidad':
        title = 'Personas con Discapacidad';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Tipo Incapacidad', 'Consejo Comunal'];
        wh.incapacitado = true; 
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'viviendas':
        title = 'Censo de Viviendas';
        headers = ['Tipo Vivienda', 'Dirección', 'Consejo Comunal', 'Cédula del Jefe', 'Nombre del Jefe', 'Nro. Habitantes'];
        
        rowsNuevos = await EstudioDemografico.findAll({ 
          where: we, 
          include: [
            { model: ConsejoComunal, as: 'consejo' }, 
            { model: CensoSituacionVivienda, as: 'situacion_vivienda' },
            { model: CensoCaracteristicaFamiliar, as: 'familiares', required: false }
          ] 
        });
        rowsViejos = await Vivienda.findAll({ where: wv, include: [...incConsejoLegacy, { model: Habitante, as: 'jefe' }] });
        break;

      case 'viviendas_avanzado':
        title = 'Censo Avanzado de Viviendas';
        headers = ['Planilla', 'Consejo Comunal', 'Dirección', 'Jefe de Familia', 'Cédula', 'Tipo Vivienda', 'Nro. Habitantes', 'Tenencia', 'Gas', 'Agua', 'Ingreso', 'Ayuda Médica'];
        
        // Includes básicos obligatorios
        const incAvanzado = [
          { model: ConsejoComunal, as: 'consejo' },
          { model: CensoSituacionVivienda, as: 'situacion_vivienda', required: false },
          { model: CensoServicios, as: 'servicios', required: false },
          { model: CensoSituacionEconomica, as: 'situacion_economica', required: false },
          { model: CensoSalud, as: 'salud', required: false },
          { model: CensoCaracteristicaFamiliar, as: 'familiares', required: false }
        ];

        // Lógica de Filtros Dinámicos
        if (filtros.planilla_nro) we.planilla_nro = filtros.planilla_nro;
        if (filtros.encuestador_cedula) we.encuestador_cedula = filtros.encuestador_cedula;
        if (filtros.rango_habitantes) {
          if (filtros.rango_habitantes === '1-3') we.cantidad_habitantes = { [Op.between]: [1, 3] };
          else if (filtros.rango_habitantes === '4-6') we.cantidad_habitantes = { [Op.between]: [4, 6] };
          else if (filtros.rango_habitantes === '7+') we.cantidad_habitantes = { [Op.gte]: 7 };
        }

        // Rango de Edad Jefe de Familia
        if (filtros.edad_min || filtros.edad_max) {
           const whereEdad = {};
           const hoy = new Date();
           if (filtros.edad_min) {
              const maxDate = new Date(hoy.getFullYear() - parseInt(filtros.edad_min), hoy.getMonth(), hoy.getDate());
              whereEdad.fecha_nacimiento = { [Op.lte]: maxDate };
           }
           if (filtros.edad_max) {
              const minDate = new Date(hoy.getFullYear() - parseInt(filtros.edad_max) - 1, hoy.getMonth(), hoy.getDate() + 1);
              whereEdad.fecha_nacimiento = { ...whereEdad.fecha_nacimiento, [Op.gte]: minDate };
           }
           // Obtener cédulas válidas
           const jefesValidos = await Habitante.findAll({ where: whereEdad, attributes: ['cedula'] });
           const cedulasValidas = jefesValidos.map(h => h.cedula);
           if (cedulasValidas.length === 0) {
             we.encuestado_cedula = 'NONE'; // Forzar 0 resultados
           } else {
             we.encuestado_cedula = { [Op.in]: cedulasValidas };
           }
        }

        // Filtros en Relaciones (forzan required: true en el JOIN si tienen valor)
        // Vivienda
        const whereVivienda = {};
        if (filtros.tipo_vivienda) whereVivienda.tipo_vivienda = filtros.tipo_vivienda;
        if (filtros.condiciones_salubridad) whereVivienda.condiciones_salubridad = filtros.condiciones_salubridad;
        if (Object.keys(whereVivienda).length > 0) {
          const vivInc = incAvanzado.find(i => i.as === 'situacion_vivienda');
          vivInc.where = whereVivienda;
          vivInc.required = true;
        }

        // Servicios (Gas, Agua)
        const whereServicios = {};
        if (filtros.gas_tipo) whereServicios.gas_tipo = filtros.gas_tipo;
        if (filtros.aguas_blancas_tipo) whereServicios.aguas_blancas_tipo = filtros.aguas_blancas_tipo;
        if (Object.keys(whereServicios).length > 0) {
          const servInc = incAvanzado.find(i => i.as === 'servicios');
          servInc.where = whereServicios;
          servInc.required = true;
        }

        // Economía
        const whereEco = {};
        if (filtros.ingreso_familiar_rango) whereEco.ingreso_familiar_rango = filtros.ingreso_familiar_rango;
        if (filtros.actividad_comercial_vivienda) whereEco.actividad_comercial_vivienda = filtros.actividad_comercial_vivienda;
        if (Object.keys(whereEco).length > 0) {
          const ecoInc = incAvanzado.find(i => i.as === 'situacion_economica');
          ecoInc.where = whereEco;
          ecoInc.required = true;
        }

        // Salud
        const whereSalud = {};
        if (filtros.necesita_ayuda_especial === 'true') whereSalud.necesita_ayuda_especial = 'Sí';
        if (Object.keys(whereSalud).length > 0) {
          const salInc = incAvanzado.find(i => i.as === 'salud');
          salInc.where = whereSalud;
          salInc.required = true;
        }

        // Familiares
        const whereFamiliar = {};
        if (filtros.tiene_menores_12 === 'true') {
          const doceAnos = new Date(); doceAnos.setFullYear(doceAnos.getFullYear() - 12);
          whereFamiliar.fecha_nacimiento = { [Op.gt]: doceAnos };
        }
        if (filtros.tiene_discapacitados === 'true') {
          whereFamiliar.discapacidad_tipo = { [Op.not]: null, [Op.ne]: '' }; // Verifica si tiene texto en discapacidad_tipo
        }
        if (Object.keys(whereFamiliar).length > 0) {
          const famInc = incAvanzado.find(i => i.as === 'familiares');
          famInc.where = whereFamiliar;
          famInc.required = true;
        }

        // Opciones Múltiples (Plagas, Animales y Enfermedades)
        if (filtros.insectos || filtros.enfermedades || filtros.animales) {
          const orConditions = [];
          if (filtros.insectos) {
            orConditions.push({ categoria: 'insectos_tipos', valor: { [Op.in]: filtros.insectos.split(',') } });
          }
          if (filtros.animales) {
            orConditions.push({ categoria: 'animales_tipos', valor: { [Op.in]: filtros.animales.split(',') } });
          }
          if (filtros.enfermedades) {
            orConditions.push({ categoria: 'enfermedades', valor: { [Op.in]: filtros.enfermedades.split(',') } });
          }
          incAvanzado.push({
            model: CensoOpcionMultiple,
            as: 'opciones_multiples',
            where: { [Op.or]: orConditions },
            required: true
          });
        }

        rowsNuevos = await EstudioDemografico.findAll({ where: we, include: incAvanzado });
        // Nota: viviendas_avanzado NO trae datos legacy (rowsViejos) porque las tablas antiguas no tenían este nivel de detalle.
        rowsViejos = []; 
        break;

      case 'adultos-mayores':
      case 'ninos':
      case 'electores':
        const h60 = new Date(); h60.setFullYear(h60.getFullYear() - 60);
        const h18 = new Date(); h18.setFullYear(h18.getFullYear() - 18);
        
        if (tipo === 'adultos-mayores') {
           title = 'Adultos Mayores (60+ años)';
           wh.fecha_nacimiento = { [Op.lte]: h60 };
        } else if (tipo === 'ninos') {
           title = 'Niños y Adolescentes';
           wh.fecha_nacimiento = { [Op.gt]: h18 };
        } else {
           title = 'Registro Electoral Comunitario';
           wh.fecha_nacimiento = { [Op.lte]: h18 };
        }
        
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'embarazadas':
      case 'lactantes':
        title = `Mujeres ${tipo === 'embarazadas' ? 'Embarazadas' : 'Lactantes'}`;
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
        wh.genero = { [Op.in]: ['F', 'Femenino'] };
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'encamados':
        title = 'Personas Encamadas o con Limitaciones Severas';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Tipo Incapacidad', 'Consejo Comunal'];
        wh.condicion_salud = { [Op.like]: '%encamado%' };
        rowsViejos = await Habitante.findAll({ where: wh, include: incConsejoLegacy });
        break;

      case 'por-cc':
      case 'genero':
        title = tipo === 'genero' ? 'Padrón Ordenado por Género' : 'Padrón Ordenado por Consejo Comunal';
        headers = ['Cédula', 'Nombres y Apellidos', 'Fecha Nac.', 'Edad', 'Género', 'Consejo Comunal'];
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

    // Mapear
    if (tipo === 'viviendas' || tipo === 'viviendas_avanzado') {
        rowsNuevos.forEach(v => {
          if (tipo === 'viviendas_avanzado') {
            rowsCombinados.push([
              v.planilla_nro || 'N/A',
              v.consejo ? v.consejo.nombre_comunidad : 'N/A',
              v.direccion || [v.calle_avenida, v.numero_casa, v.referencia_ubicacion].filter(Boolean).join(', ') || v.direccion_comunidad || 'N/A',
              v.encuestado_nombre || 'N/A',
              v.encuestado_cedula ? `V-${v.encuestado_cedula}` : 'N/A',
              v.situacion_vivienda ? v.situacion_vivienda.tipo_vivienda : 'N/A',
              v.familiares ? v.familiares.length : (v.cantidad_habitantes || 1),
              v.situacion_vivienda ? v.situacion_vivienda.forma_tenencia : 'N/A',
              v.servicios ? v.servicios.gas_tipo : 'N/A',
              v.servicios ? v.servicios.aguas_blancas_tipo : 'N/A',
              v.situacion_economica ? v.situacion_economica.ingreso_familiar_rango : 'N/A',
              (v.salud && v.salud.necesita_ayuda_especial === 'Sí') ? `Sí, ${v.salud.cual_ayuda_especial || 'No especificada'}` : 'No'
            ]);

            if (filtros.incluir_integrantes === 'true' && v.familiares && v.familiares.length > 0) {
              v.familiares.forEach(f => {
                const edad = f.fecha_nacimiento ? Math.floor((new Date() - new Date(f.fecha_nacimiento)) / (1000 * 60 * 60 * 24 * 365.25)) + ' años' : 'N/A';
                rowsCombinados.push([
                  '  ↳ [Familiar]',
                  '',
                  f.parentesco || 'N/A',
                  f.nombres_apellidos || 'N/A',
                  f.cedula_identidad ? `V-${f.cedula_identidad}` : 'N/A',
                  edad,
                  '',
                  '',
                  '',
                  '',
                  f.ocupacion || '',
                  ''
                ]);
              });
            }
          } else {
            rowsCombinados.push([
              v.situacion_vivienda ? v.situacion_vivienda.tipo_vivienda : 'N/A',
              v.direccion || [v.calle_avenida, v.numero_casa, v.referencia_ubicacion].filter(Boolean).join(', ') || v.direccion_comunidad || 'N/A',
              v.consejo ? v.consejo.nombre_comunidad : 'N/A',
              v.encuestado_cedula ? `V-${v.encuestado_cedula}` : 'N/A',
              v.encuestado_nombre || 'N/A',
              v.familiares ? v.familiares.length : (v.cantidad_habitantes || 1)
            ]);
          }
        });
        if (tipo !== 'viviendas_avanzado') {
          rowsViejos.forEach(v => rowsCombinados.push([
            v.tipo_vivienda || 'N/A',
            v.direccion || 'N/A',
            v.consejo ? v.consejo.nombre_comunidad : 'N/A',
            v.jefe && v.jefe.cedula ? `V-${v.jefe.cedula}` : 'N/A',
            v.jefe ? `${v.jefe.nombres || ''} ${v.jefe.apellidos || ''}`.trim() : 'N/A',
            'N/A'
          ]));
        }
    } else {
       const mapPersona = (item) => {
         let cedula = item.cedula;
         if (cedula && String(cedula).startsWith('SC-')) {
           cedula = 'Sin Cédula';
         }
         const nombre = `${item.nombres || ''} ${item.apellidos || ''}`.trim();
         const fnac = item.fecha_nacimiento ? new Date(item.fecha_nacimiento).toISOString().split('T')[0] : 'N/A';
         const edad = calcEdad(item.fecha_nacimiento);
         const genero = item.genero;
         const saludStr = item.incapacitado_tipo;
         const consejo = item.consejo ? item.consejo.nombre_comunidad : 'N/A';

         let rd = [];
         if (tipo === 'discapacidad' || tipo === 'encamados') rd = [cedula || 'N/A', nombre || 'N/A', fnac, edad, saludStr || 'N/A', consejo];
         else rd = [cedula || 'N/A', nombre || 'N/A', fnac, edad, genero || 'N/A', consejo];
         
         if (extraCols.includes('telefono')) rd.push(item.telefono || 'N/A');
         if (extraCols.includes('salud')) rd.push(saludStr || 'N/A');
         if (extraCols.includes('trabajo')) rd.push(item.trabaja_actualmente ? 'Sí' : 'No');
         if (extraCols.includes('nivel_academico')) rd.push(item.nivel_educativo || 'N/A');
         
         rowsCombinados.push(rd);
       };
       rowsViejos.forEach(p => mapPersona(p));
    }

    if (tipo === 'por-cc') rowsCombinados.sort((a,b) => a[5].localeCompare(b[5]));
    if (tipo === 'genero') rowsCombinados.sort((a,b) => a[4].localeCompare(b[4]));

    return { title, headers, rows: rowsCombinados };
  }
}

module.exports = CensoReportesService;

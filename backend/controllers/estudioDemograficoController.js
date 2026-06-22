const logger = require("../utils/logger");
const AuditService = require("../services/auditService");

let EstudioDemografico;
let models;

// Función auxiliar para mapear datos del frontend a los nombres de columna exactos de Sequelize
// y transformar "Si"/"No" en booleanos verdaderos.
function mapFrontendData(datos, paso) {
  if (!datos) return {};
  const mapped = { ...datos };

  // 1. SANITIZAR cadenas vacías a null ANTES de convertir booleanos.
  //    PostgreSQL rechaza "" en columnas de tipo BOOLEAN, así que lo limpiamos.
  for (const key in mapped) {
    if (mapped[key] === '') mapped[key] = null;
  }
  
  // Limpiar campos exclusivos de la interfaz de usuario que no van en la BD
  delete mapped.chk_planilla_auto;
  delete mapped.chk_fecha_auto;
  delete mapped.chk_encuestado_es_jefe;
  delete mapped.consejo_comunal_cab;

  // 2. Transformar booleanos 'Si'/'No' a true/false
  for (const key in mapped) {
    if (mapped[key] === 'Si') mapped[key] = true;
    if (mapped[key] === 'No') mapped[key] = false;
  }

  // 3. Mapeos específicos por paso
  if (paso === 3 || paso === 4) {
    if (mapped.familiares) {
      mapped.familiares = mapped.familiares.map(f => {
        const nf = { ...f };
        // Preservar id_habitante si ya fue resuelto desde la tabla habitantes
        if (nf.id_habitante) nf.id_habitante = parseInt(nf.id_habitante) || null;
        if (nf.genero) nf.sexo = nf.genero;
        if (nf.nivel_educativo) nf.grado_instruccion = nf.nivel_educativo;
        if (nf.ocupacion) nf.profesion = nf.ocupacion;
        if (nf.jef_telf_cel) nf.telefono_celular = nf.jef_telf_cel;
        if (nf.jef_telf_hab) nf.telefono_habitacion = nf.jef_telf_hab;
        if (nf.jef_email) nf.email_familiar = nf.jef_email;
        if (nf.jef_estado_civil !== undefined) nf.estado_civil = nf.jef_estado_civil;
        if (nf.jef_tiempo_comunidad !== undefined) nf.tiempo_comunidad = nf.jef_tiempo_comunidad;
        if (nf.jef_incapacitado !== undefined) nf.incapacitado = nf.jef_incapacitado === 'Si' || nf.jef_incapacitado === true;
        if (nf.jef_tipo_incapacidad !== undefined) nf.discapacidad_tipo = nf.jef_tipo_incapacidad;
        if (nf.jef_pensionado_institucion !== undefined) nf.pensionado_institucion = nf.jef_pensionado_institucion;
        if (nf.clasificacion_ingreso !== undefined) nf.clasificacion_ingreso_familiar = nf.clasificacion_ingreso;
        
        // Ensure salud condition is stored in discapacidad_tipo for the report filtering to work properly
        if (nf.condicion_salud) {
          if (nf.condicion_salud === 'discapacidad' || nf.condicion_salud === 'encamado') {
             nf.discapacidad_tipo = nf.discapacidad_tipo ? nf.discapacidad_tipo : nf.condicion_salud;
             nf.incapacitado = true;
          } else {
             nf.discapacidad_tipo = nf.condicion_salud;
          }
        }

        delete nf.genero;
        delete nf.nivel_educativo;
        delete nf.ocupacion;
        delete nf.es_jefe_familia;
        delete nf.jef_telf_cel;
        delete nf.jef_telf_hab;
        delete nf.jef_email;
        delete nf.jef_estado_civil;
        delete nf.jef_tiempo_comunidad;
        delete nf.jef_incapacitado;
        delete nf.jef_tipo_incapacidad;
        delete nf.jef_pensionado_institucion;
        delete nf.clasificacion_ingreso;
        delete nf.condicion_salud; // Deleted since we mapped it to discapacidad_tipo
        // datos_nuevos_habitante se maneja en la bandeja de validaciones al aprobar
        delete nf.datos_nuevos_habitante;
        return nf;
      });
    }
  }

  if (paso === 5) {
    // ingreso_bs es alias del frontend para ingreso_familiar_rango
    if (mapped.ingreso_bs !== undefined) mapped.ingreso_familiar_rango = mapped.ingreso_bs;
    if (mapped.actividad_comercial_vivienda !== undefined) mapped.actividad_comercial_vivienda = mapped.actividad_comercial_vivienda === 'Si' || mapped.actividad_comercial_vivienda === true;
    // ventas_de no existe en el modelo, lo ignoramos
  }

  if (paso === 6) {
    // Mapear alias del frontend a columnas reales
    if (mapped.tenencia !== undefined)           mapped.forma_tenencia              = mapped.tenencia;
    if (mapped.material_paredes !== undefined)   mapped.tipo_paredes                = mapped.material_paredes;
    if (mapped.material_techo !== undefined)     mapped.tipo_techo                  = mapped.material_techo;
    if (mapped.num_cuartos !== undefined)        mapped.cantidad_habitaciones       = parseInt(mapped.num_cuartos) || 0;
    if (mapped.cantidad_habitaciones !== undefined) mapped.cantidad_habitaciones    = parseInt(mapped.cantidad_habitaciones) || 0;
    if (mapped.num_banos !== undefined)          mapped.cantidad_banos              = parseInt(mapped.num_banos) || 0;
    if (mapped.cantidad_banos !== undefined)     mapped.cantidad_banos              = parseInt(mapped.cantidad_banos) || 0;
    if (mapped.inscrita_s_i_v_i_h !== undefined) mapped.inscrita_sivih              = mapped.inscrita_s_i_v_i_h === 'Si' || mapped.inscrita_s_i_v_i_h === true;
    if (mapped.inscrita_sivih !== undefined)     mapped.inscrita_sivih              = mapped.inscrita_sivih === 'Si' || mapped.inscrita_sivih === true;
    if (mapped.terreno_propio !== undefined)     mapped.terreno_propio              = mapped.terreno_propio === 'Si' || mapped.terreno_propio === true;
    if (mapped.requiere_ayuda !== undefined)     mapped.requiere_ayuda_mejora       = mapped.requiere_ayuda;
    if (mapped.presencia_insectos !== undefined) mapped.presencia_insectos_roedores = mapped.presencia_insectos === 'Si' || mapped.presencia_insectos === true;
    if (mapped.tiene_animales !== undefined)     mapped.tiene_animales_domesticos   = mapped.tiene_animales === 'Si' || mapped.tiene_animales === true;
    delete mapped.cotiza_politica_habitacional;
  }

  if (paso === 7) {
    // Mapear alias del frontend a columnas reales del modelo CensoServicios
    if (mapped.aguas_blancas !== undefined)      mapped.aguas_blancas_tipo          = mapped.aguas_blancas;
    if (mapped.aguas_servidas !== undefined)     mapped.aguas_servidas_tipo         = mapped.aguas_servidas;
    if (mapped.sistema_electrico !== undefined)  mapped.sistema_electrico_tipo      = mapped.sistema_electrico;
    if (mapped.gas_domestico !== undefined)      mapped.gas_tipo                    = mapped.gas_domestico;
    if (mapped.gas_empresa !== undefined)        mapped.gas_empresa_suministra      = mapped.gas_empresa;
    if (mapped.recoleccion_basura !== undefined) mapped.recoleccion_basura_tipo     = mapped.recoleccion_basura;
    if (mapped.telefonia_servicio !== undefined) mapped.telefonia_tipo              = mapped.telefonia_servicio;
    if (mapped.transporte !== undefined)         mapped.transporte_tipo             = mapped.transporte;
    if (mapped.tiene_tanque !== undefined)       mapped.tiene_tanque_litros         = parseInt(mapped.tiene_tanque) || 0;
    if (mapped.bombillos_necesita !== undefined) mapped.bombillos_ahorradores_necesita = parseInt(mapped.bombillos_necesita) || 0;
    if (mapped.cantidad_cilindros_gas !== undefined) mapped.cantidad_cilindros_gas  = parseInt(mapped.cantidad_cilindros_gas) || 0;
    if (mapped.tiene_medidor_agua !== undefined) mapped.tiene_medidor_agua = (mapped.tiene_medidor_agua === 'Si' || mapped.tiene_medidor_agua === true);
    if (mapped.tiene_medidor_luz !== undefined)  mapped.tiene_medidor_luz  = (mapped.tiene_medidor_luz === 'Si' || mapped.tiene_medidor_luz === true);
  }

  if (paso === 8) {
    if (mapped.exclusion_ninos_calle !== undefined)   mapped.exclusion_ninos_calle_cant   = parseInt(mapped.exclusion_ninos_calle)   || 0;
    if (mapped.exclusion_discapacitados !== undefined) mapped.exclusion_discapacitados_cant = parseInt(mapped.exclusion_discapacitados) || 0;
    if (mapped.exclusion_tercera_edad !== undefined)  mapped.exclusion_tercera_edad_cant  = parseInt(mapped.exclusion_tercera_edad)  || 0;
    
    if (mapped.necesita_ayuda_especial !== undefined) mapped.necesita_ayuda_especial = mapped.necesita_ayuda_especial === 'Si' || mapped.necesita_ayuda_especial === true;

    // Eliminar obsoletos si vienen en el payload
    delete mapped.exclusion_indigentes;
    delete mapped.exclusion_enfermos_term;
    delete mapped.exclusion_indigentes_cant;
    delete mapped.exclusion_enfermos_term_cant;
    delete mapped.exclusion_otros;
    // opciones (checkboxes) se manejan aparte en el controlador
  }

  if (paso === 9) {
    // Mapear alias del frontend a columnas reales del modelo CensoParticipacionComunitaria
    if (mapped.asiste_asambleas !== undefined)  mapped.asiste_asambleas_ciudadanos  = mapped.asiste_asambleas === 'Si' || mapped.asiste_asambleas === true;
    if (mapped.asiste_asambleas_ciudadanos !== undefined) mapped.asiste_asambleas_ciudadanos = mapped.asiste_asambleas_ciudadanos === 'Si' || mapped.asiste_asambleas_ciudadanos === true;
    
    if (mapped.dispuesto_apoyar !== undefined)  mapped.dispuesto_apoyar_consejo      = mapped.dispuesto_apoyar === 'Si' || mapped.dispuesto_apoyar === true;
    if (mapped.dispuesto_apoyar_consejo !== undefined) mapped.dispuesto_apoyar_consejo = mapped.dispuesto_apoyar_consejo === 'Si' || mapped.dispuesto_apoyar_consejo === true;

    if (mapped.como_resolver_problemas !== undefined) mapped.como_resolver_problemas_sector = mapped.como_resolver_problemas;
    
    if (mapped.existen_org_comunitarias !== undefined) mapped.existen_org_comunitarias = mapped.existen_org_comunitarias === 'Si' || mapped.existen_org_comunitarias === true;
    if (mapped.participa_usted !== undefined) mapped.participa_usted = mapped.participa_usted === 'Si' || mapped.participa_usted === true;
    if (mapped.participa_familiar !== undefined) mapped.participa_familiar = mapped.participa_familiar === 'Si' || mapped.participa_familiar === true;
    if (mapped.cree_pueblo_interviene_decisiones !== undefined) mapped.cree_pueblo_interviene_decisiones = mapped.cree_pueblo_interviene_decisiones === 'Si' || mapped.cree_pueblo_interviene_decisiones === true;
    if (mapped.acuerdo_pueblo_protagonismo_presupuesto !== undefined) mapped.acuerdo_pueblo_protagonismo_presupuesto = mapped.acuerdo_pueblo_protagonismo_presupuesto === 'Si' || mapped.acuerdo_pueblo_protagonismo_presupuesto === true;

    // Las demás columnas (como_apoyaria_proyectos, area_trabajo_interes, etc.) llegarán en snake_case
  }

  if (paso === 10) {
    if (mapped.potencialidades_comunidad !== undefined) mapped.principales_potencialidades_ventajas = mapped.potencialidades_comunidad;
    if (mapped.problemas_comunidad !== undefined)       mapped.principales_problemas_debilidades = mapped.problemas_comunidad;
  }

  return mapped;
}


class EstudioDemograficoController {
  static setModel(model) {
    EstudioDemografico = model;
  }
  
  static setModels(m) {
    models = m;
  }

  static async getAll(req, res, next) {
    try {
      const { consejoId } = req.query;
      const where = { activo: true };
      
      // Seguridad Backend: Forzar filtro de comunidad si es vocero
      if (req.user && req.user.rol === 'vocero') {
        const idComunidad = req.user.consejo_comunal_id || req.user.id_comunidad_asignada;
        where.id_comunidad = idComunidad;
      } else if (consejoId) {
        where.id_comunidad = consejoId;
      }
      
      const db = models;
      const data = await EstudioDemografico.findAll({
        where,
        order: [["fecha_creacion", "DESC"]],
        include: [
          { model: db.ConsejoComunal, as: 'consejo', attributes: ['nombre_comunidad'] },
          { model: db.CensoCaracteristicaFamiliar, as: 'familiares' },
          { model: db.CensoSituacionEconomica, as: 'situacion_economica' },
          { model: db.CensoSituacionVivienda, as: 'situacion_vivienda' },
          { model: db.CensoSalud, as: 'salud' },
          { model: db.CensoServicios, as: 'servicios' },
          { model: db.CensoParticipacionComunitaria, as: 'participacion_comunitaria' },
          { model: db.CensoSituacionComunidad, as: 'situacion_comunidad' },
          { model: db.CensoOpcionMultiple, as: 'opciones_multiples' }
        ]
      });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async getById(req, res, next) {
    try {
      const db = models;
      const data = await EstudioDemografico.findByPk(req.params.id, {
        include: [
          { model: db.ConsejoComunal, as: 'consejo', attributes: ['nombre_comunidad'] },
          { model: db.CensoCaracteristicaFamiliar, as: 'familiares' },
          { model: db.CensoSituacionEconomica, as: 'situacion_economica' },
          { model: db.CensoSituacionVivienda, as: 'situacion_vivienda' },
          { model: db.CensoSalud, as: 'salud' },
          { model: db.CensoServicios, as: 'servicios' },
          { model: db.CensoParticipacionComunitaria, as: 'participacion_comunitaria' },
          { model: db.CensoSituacionComunidad, as: 'situacion_comunidad' },
          { model: db.CensoOpcionMultiple, as: 'opciones_multiples' }
        ]
      });
      if (!data) return res.status(404).json({ error: "Estudio demográfico no encontrado" });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async getPorConsejo(req, res, next) {
    try {
      const { consejoId } = req.params;
      const db = models;
      const data = await EstudioDemografico.findAll({
        where: { id_comunidad: consejoId, activo: true },
        order: [["fecha_creacion", "DESC"]],
        include: [
          { model: db.ConsejoComunal, as: 'consejo', attributes: ['nombre_comunidad'] },
          { model: db.CensoCaracteristicaFamiliar, as: 'familiares' },
          { model: db.CensoSituacionEconomica, as: 'situacion_economica' },
          { model: db.CensoSituacionVivienda, as: 'situacion_vivienda' },
          { model: db.CensoSalud, as: 'salud' },
          { model: db.CensoServicios, as: 'servicios' },
          { model: db.CensoParticipacionComunitaria, as: 'participacion_comunitaria' },
          { model: db.CensoSituacionComunidad, as: 'situacion_comunidad' },
          { model: db.CensoOpcionMultiple, as: 'opciones_multiples' }
        ]
      });
      res.json(data);
    } catch (error) { next(error); }
  }

  static async crear(req, res, next) {
    const db = models; 
    // Asegurar que obtenemos la instancia de sequelize correctamente
    const sequelize = (db && db.sequelize) || (EstudioDemografico && EstudioDemografico.sequelize);

    if (!sequelize) {
      return next(new Error('Sequelize instance no disponible para transacciones en crear'));
    }

    const t = await sequelize.transaction();
    try {
      const { 
        id_comunidad, 
        cabecera, 
        familiares, 
        economia, 
        vivienda, 
        salud, 
        servicios, 
        participacion, 
        comunidad, 
        opciones,
        id_estudio_borrador
      } = req.body;

      // Si se envió un id_estudio_borrador, significa que el wizard guardó progresivamente.
      // Para asegurar la integridad total de los datos según el envío final, eliminamos el borrador
      // y lo recreamos completamente con el payload final.
      if (id_estudio_borrador) {
        await EstudioDemografico.destroy({ where: { id: id_estudio_borrador }, transaction: t });
      }

      if (!id_comunidad && !cabecera?.id_comunidad) {
        throw new Error("id_comunidad es requerido");
      }

      // PASO PREVIO 1: Crear Jefe si es nuevo
      if (req.body.datos_nuevos_jefe && req.body.jefe_habitante_id != null && String(req.body.jefe_habitante_id).startsWith('tmp_')) {
        if (req.body.datos_nuevos_jefe.cedula === 'SC-AUTO' || req.body.datos_nuevos_jefe.cedula === 'SC-GENERATE') {
          req.body.datos_nuevos_jefe.cedula = 'SC-' + Date.now() + Math.floor(Math.random() * 100);
        }
        const nuevoJefe = await models.Habitante.create({
          ...req.body.datos_nuevos_jefe,
          consejo_comunal_id: id_comunidad || (cabecera ? cabecera.id_comunidad : null),
          activo: true,
          fecha_registro: new Date()
        }, { transaction: t });
        req.body.jefe_habitante_id = nuevoJefe.id;
        if (cabecera) cabecera.jefe_habitante_id = nuevoJefe.id;
      }

      // PASO PREVIO 2: Crear familiares nuevos
      if (req.body.familiares && req.body.familiares.length > 0) {
        req.body.familiares = await Promise.all(req.body.familiares.map(async (fam) => {
          if (fam.datos_nuevos_habitante && fam.id_habitante != null && String(fam.id_habitante).startsWith('tmp_')) {
            if (fam.datos_nuevos_habitante.cedula === 'SC-AUTO' || fam.datos_nuevos_habitante.cedula === 'SC-GENERATE') {
              fam.datos_nuevos_habitante.cedula = 'SC-' + Date.now() + Math.floor(Math.random() * 100);
            }
            const nuevoHab = await models.Habitante.create({
              ...fam.datos_nuevos_habitante,
              consejo_comunal_id: id_comunidad || (cabecera ? cabecera.id_comunidad : null),
              activo: true,
              fecha_registro: new Date()
            }, { transaction: t });
            fam.id_habitante = nuevoHab.id;
          }
          return fam;
        }));
      }

      // 1. Crear Cabecera (EstudioDemografico)
      const colsEstudio = Object.keys(EstudioDemografico.getAttributes());
      const rawDatosCabecera = { ...(cabecera || req.body), id_comunidad: id_comunidad || (cabecera ? cabecera.id_comunidad : null) };
      const safeCabecera = Object.fromEntries(colsEstudio.filter(c => c in rawDatosCabecera).map(c => [c, rawDatosCabecera[c]]));

      const data = await EstudioDemografico.create({
        ...safeCabecera,
        fecha_creacion: new Date(),
        activo: true
      }, { transaction: t });

      const id_estudio = data.id;

      // Procesar cada sección pasándole el payload plano (req.body) al traductor de cada paso
      if (req.body.familiares && req.body.familiares.length > 0) {
        const mappedFam = mapFrontendData(req.body, 3).familiares;
        if (mappedFam) {
          const colsFam = Object.keys(db.CensoCaracteristicaFamiliar.getAttributes());
          const fams = mappedFam.map(f => {
            const safeFam = {};
            colsFam.forEach(col => { if (col in f) safeFam[col] = f[col]; });
            return { ...safeFam, id_estudio: data.id };
          });
          await db.CensoCaracteristicaFamiliar.bulkCreate(fams, { transaction: t });
        }
      }

      const mappedEco = mapFrontendData(req.body, 5);
      const colsEco = Object.keys(db.CensoSituacionEconomica.getAttributes());
      const safeEco = Object.fromEntries(colsEco.filter(c => c in mappedEco).map(c => [c, mappedEco[c]]));
      await db.CensoSituacionEconomica.create({ ...safeEco, id_estudio: data.id }, { transaction: t });

      const mappedViv = mapFrontendData(req.body, 6);
      const colsViv = Object.keys(db.CensoSituacionVivienda.getAttributes());
      const safeViv = Object.fromEntries(colsViv.filter(c => c in mappedViv).map(c => [c, mappedViv[c]]));
      await db.CensoSituacionVivienda.create({ ...safeViv, id_estudio: data.id }, { transaction: t });

      const mappedSer = mapFrontendData(req.body, 7);
      const colsSer = Object.keys(db.CensoServicios.getAttributes());
      const safeSer = Object.fromEntries(colsSer.filter(c => c in mappedSer).map(c => [c, mappedSer[c]]));
      await db.CensoServicios.create({ ...safeSer, id_estudio: data.id }, { transaction: t });

      const mappedSal = mapFrontendData(req.body, 8);
      const colsSal = Object.keys(db.CensoSalud.getAttributes());
      const safeSal = Object.fromEntries(colsSal.filter(c => c in mappedSal).map(c => [c, mappedSal[c]]));
      await db.CensoSalud.create({ ...safeSal, id_estudio: data.id }, { transaction: t });

      const mappedPar = mapFrontendData(req.body, 9);
      const colsPar = Object.keys(db.CensoParticipacionComunitaria.getAttributes());
      const safePar = Object.fromEntries(colsPar.filter(c => c in mappedPar).map(c => [c, mappedPar[c]]));
      await db.CensoParticipacionComunitaria.create({ ...safePar, id_estudio: data.id }, { transaction: t });

      const mappedCom = mapFrontendData(req.body, 10);
      const colsCom = Object.keys(db.CensoSituacionComunidad.getAttributes());
      const safeCom = Object.fromEntries(colsCom.filter(c => c in mappedCom).map(c => [c, mappedCom[c]]));
      await db.CensoSituacionComunidad.create({ ...safeCom, id_estudio: data.id }, { transaction: t });

      // 9. Crear Opciones Multiples (Checkboxes separados)
      if (opciones && opciones.length > 0) {
        const ops = opciones.map(o => ({ ...o, id_estudio }));
        await db.CensoOpcionMultiple.bulkCreate(ops, { transaction: t });
      }

      await t.commit();

      if (req.user) {
        await AuditService.log(req.user.id, "CREATE", "estudios_demograficos", data.id, null, data.toJSON());
      }
      res.status(201).json({ success: true, id_estudio });
    } catch (error) { 
      await t.rollback();
      next(error); 
    }
  }

  static async guardarPaso(req, res, next) {
    const db = models;
    // db may be an object with models or a function; derive sequelize instance reliably
    const sequelize = db && db.sequelize ? db.sequelize : (EstudioDemografico && EstudioDemografico.sequelize);
    if (!sequelize) {
      throw new Error('Sequelize instance no disponible para transacciones');
    }
    const t = await sequelize.transaction();
    try {
      const { paso, id_estudio, datos } = req.body;
      
      if (!paso || !datos) {
        throw new Error("Paso y datos son requeridos");
      }

      // Paso 1 y 2: Cabecera y Ubicación
      if (paso === 1 || paso === 2) {
        if (!id_estudio) throw new Error("id_estudio es requerido para guardar la cabecera");
        
        const colsEstudio = Object.keys(EstudioDemografico.getAttributes());
        const safeDatos = Object.fromEntries(colsEstudio.filter(c => c in datos).map(c => [c, datos[c]]));

        const [estudio, created] = await EstudioDemografico.findOrCreate({
          where: { id: id_estudio },
          // Los borradores se crean inactivos para no mostrarse en getAll hasta ser aprobados
          defaults: { ...safeDatos, activo: false, fecha_creacion: new Date() },
          transaction: t
        });
        
        if (!created) {
          await estudio.update(safeDatos, { transaction: t });
        }
      } 
      // Pasos posteriores requieren que exista el id_estudio
      else {
        if (!id_estudio) throw new Error("Falta el id_estudio para vincular el paso " + paso);
        
        // Mapear los datos al esquema de la base de datos
        const dbDatos = mapFrontendData(datos, paso);
        
        switch (paso) {
          case 3: // Jefe
            if (dbDatos.encuestado_cedula) {
              const { Op } = require('sequelize');
              const existenteJefe = await EstudioDemografico.findOne({
                where: { 
                  encuestado_cedula: dbDatos.encuestado_cedula,
                  id: { [Op.ne]: id_estudio }
                },
                transaction: t
              });
              if (existenteJefe) {
                throw new Error(`CONFLICTO: La cédula ${dbDatos.encuestado_cedula} ya está registrada como jefe en la planilla ${existenteJefe.planilla_nro}`);
              }
              const existenteFam = await db.CensoCaracteristicaFamiliar.findOne({
                where: { 
                  cedula_identidad: dbDatos.encuestado_cedula,
                  id_estudio: { [Op.ne]: id_estudio }
                },
                include: [{ model: EstudioDemografico, as: 'estudio', attributes: ['planilla_nro', 'encuestado_cedula'] }],
                transaction: t
              });
              if (existenteFam) {
                const num = existenteFam.estudio ? existenteFam.estudio.planilla_nro : '';
                throw new Error(`CONFLICTO: La cédula ${dbDatos.encuestado_cedula} ya está registrada como familiar en la planilla ${num}`);
              }
            }
            // Update the Jefe in EstudioDemografico table:
            await EstudioDemografico.update({
              encuestado_cedula: dbDatos.encuestado_cedula,
              encuestado_nombre: dbDatos.encuestado_nombre,
              jefe_habitante_id: dbDatos.jefe_habitante_id || null
            }, { where: { id: id_estudio }, transaction: t });

            // Ensure the main Jefe is in the familiares table as well
            if (dbDatos.familiares && dbDatos.familiares.length > 0) {
              await db.CensoCaracteristicaFamiliar.destroy({ where: { id_estudio, parentesco: 'Jefe(a) de Familia' }, transaction: t });
              const fams = dbDatos.familiares.map(f => ({ ...f, id_estudio }));
              await db.CensoCaracteristicaFamiliar.bulkCreate(fams, { transaction: t });
            }
            break;
          case 4: // Otros Familiares
            if (dbDatos.familiares && dbDatos.familiares.length > 0) {
              const { Op } = require('sequelize');
              
              // Validate duplicate cedulas in the incoming data against the DB
              for (const f of dbDatos.familiares) {
                if (f.cedula_identidad) {
                  const checkJefe = await EstudioDemografico.findOne({
                    where: { encuestado_cedula: f.cedula_identidad, id: { [Op.ne]: id_estudio } },
                    transaction: t
                  });
                  if (checkJefe) throw new Error(`CONFLICTO: El integrante con cédula ${f.cedula_identidad} ya es jefe en otra planilla (${checkJefe.planilla_nro}).`);

                  const checkFam = await db.CensoCaracteristicaFamiliar.findOne({
                    where: { cedula_identidad: f.cedula_identidad, id_estudio: { [Op.ne]: id_estudio } },
                    include: [{ model: EstudioDemografico, as: 'estudio', attributes: ['planilla_nro'] }],
                    transaction: t
                  });
                  if (checkFam) {
                    const num = checkFam.estudio ? checkFam.estudio.planilla_nro : '';
                    throw new Error(`CONFLICTO: El integrante con cédula ${f.cedula_identidad} ya pertenece a otra planilla (${num}).`);
                  }
                }
              }

              await db.CensoCaracteristicaFamiliar.destroy({ where: { id_estudio, parentesco: { [Op.ne]: 'Jefe(a) de Familia' } }, transaction: t });
              const fams = dbDatos.familiares.map(f => ({ ...f, id_estudio }));
              await db.CensoCaracteristicaFamiliar.bulkCreate(fams, { transaction: t });
            } else {
              // si envían lista vacía de familiares, se borran los existentes menos el jefe
              const { Op } = require('sequelize');
              await db.CensoCaracteristicaFamiliar.destroy({ where: { id_estudio, parentesco: { [Op.ne]: 'Jefe(a) de Familia' } }, transaction: t });
            }
            break;
          case 5: { // Economía
            const cols5 = Object.keys(db.CensoSituacionEconomica.getAttributes());
            const safe5 = Object.fromEntries(cols5.filter(c => c in dbDatos).map(c => [c, dbDatos[c]]));
            const [eco, ecoC] = await db.CensoSituacionEconomica.findOrCreate({ where: { id_estudio }, defaults: { ...safe5 }, transaction: t });
            if (!ecoC) await eco.update(safe5, { transaction: t });
            break;
          }
          case 6: { // Vivienda
            const cols6 = Object.keys(db.CensoSituacionVivienda.getAttributes());
            const safe6 = Object.fromEntries(cols6.filter(c => c in dbDatos).map(c => [c, dbDatos[c]]));
            const [viv, vivC] = await db.CensoSituacionVivienda.findOrCreate({ where: { id_estudio }, defaults: { ...safe6 }, transaction: t });
            if (!vivC) await viv.update(safe6, { transaction: t });
            break;
          }
          case 7: { // Servicios
            const cols7 = Object.keys(db.CensoServicios.getAttributes());
            const safe7 = Object.fromEntries(cols7.filter(c => c in dbDatos).map(c => [c, dbDatos[c]]));
            const [ser, serC] = await db.CensoServicios.findOrCreate({ where: { id_estudio }, defaults: { ...safe7 }, transaction: t });
            if (!serC) await ser.update(safe7, { transaction: t });
            break;
          }
          case 8: { // Salud
            const cols8 = Object.keys(db.CensoSalud.getAttributes());
            const safe8 = Object.fromEntries(cols8.filter(c => c in dbDatos).map(c => [c, dbDatos[c]]));
            const [sal, salC] = await db.CensoSalud.findOrCreate({ where: { id_estudio }, defaults: { ...safe8 }, transaction: t });
            if (!salC) await sal.update(safe8, { transaction: t });
            break;
          }
          case 9: { // Participación
            const cols9 = Object.keys(db.CensoParticipacionComunitaria.getAttributes());
            const safe9 = Object.fromEntries(cols9.filter(c => c in dbDatos).map(c => [c, dbDatos[c]]));
            const [par, parC] = await db.CensoParticipacionComunitaria.findOrCreate({ where: { id_estudio }, defaults: { ...safe9 }, transaction: t });
            if (!parC) await par.update(safe9, { transaction: t });
            break;
          }
          case 10: { // Comunidad
            const cols10 = Object.keys(db.CensoSituacionComunidad.getAttributes());
            const safe10 = Object.fromEntries(cols10.filter(c => c in dbDatos).map(c => [c, dbDatos[c]]));
            const [com, comC] = await db.CensoSituacionComunidad.findOrCreate({ where: { id_estudio }, defaults: { ...safe10 }, transaction: t });
            if (!comC) await com.update(safe10, { transaction: t });
            break;
          }
          default:
            throw new Error("Paso no reconocido");
        }

        // Destruir categorías específicas del paso para manejar el caso donde se desmarcan todas
        const categoriasDelPaso = {
          6: ['enseres_vivienda', 'insectos_tipos', 'animales_tipos'],
          7: ['gas_cilindros'],
          8: ['enfermedades'],
          9: ['misiones']
        };

        if (categoriasDelPaso[paso]) {
          await db.CensoOpcionMultiple.destroy({ 
            where: { id_estudio, categoria: categoriasDelPaso[paso] }, 
            transaction: t 
          });
        }

        // Manejar opciones múltiples enviadas
        if (dbDatos.opciones && dbDatos.opciones.length > 0) {
          const ops = dbDatos.opciones.map(o => ({ ...o, id_estudio }));
          await db.CensoOpcionMultiple.bulkCreate(ops, { transaction: t });
        }
      }

      await t.commit();
      res.json({ success: true, message: `Paso ${paso} guardado correctamente`, id_estudio });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  static async actualizar(req, res, next) {
    const db = models;
    const sequelize = (db && db.sequelize) || (EstudioDemografico && EstudioDemografico.sequelize);
    if (!sequelize) return next(new Error('Sequelize no disponible'));

    const id = req.params.id;
    const autoApprove = req.user?.rol === 'admin';

    // Si es Vocero, enviar a la Bandeja de Validaciones
    if (!autoApprove) {
      await db.BandejaValidaciones.create({
        id_vocero: req.user.id,
        tabla_afectada: 'estudios_demograficos',
        tipo_accion: 'UPDATE',
        datos_temporales: { id, ...req.body },
        estado_tramite: 'Pendiente'
      });
      return res.status(202).json({ validacion: true, mensaje: 'Solicitud de edición enviada al administrador para revisión.' });
    }

    // Si es Admin, procesar directo con transacción completa
    const t = await sequelize.transaction();
    try {
      const estudio = await EstudioDemografico.findByPk(id);
      if (!estudio) {
        await t.rollback();
        return res.status(404).json({ error: 'Estudio demográfico no encontrado' });
      }

      const datosAntiguos = estudio.toJSON();
      const body = req.body;

      // PASO PREVIO 1: Crear Jefe si es nuevo
      if (body.datos_nuevos_jefe && body.jefe_habitante_id != null && String(body.jefe_habitante_id).startsWith('tmp_')) {
        const nuevoJefe = await models.Habitante.create({
          ...body.datos_nuevos_jefe,
          consejo_comunal_id: estudio.id_comunidad,
          activo: true,
          fecha_registro: new Date()
        }, { transaction: t });
        body.jefe_habitante_id = nuevoJefe.id;
      }

      // PASO PREVIO 2: Crear familiares nuevos
      if (body.familiares && body.familiares.length > 0) {
        body.familiares = await Promise.all(body.familiares.map(async (fam) => {
          if (fam.datos_nuevos_habitante && fam.id_habitante != null && String(fam.id_habitante).startsWith('tmp_')) {
            const nuevoHab = await models.Habitante.create({
              ...fam.datos_nuevos_habitante,
              consejo_comunal_id: estudio.id_comunidad,
              activo: true,
              fecha_registro: new Date()
            }, { transaction: t });
            fam.id_habitante = nuevoHab.id;
          }
          return fam;
        }));
      }

      // 1. Actualizar cabecera principal
      await estudio.update(mapFrontendData(body, 2), { transaction: t });

      // 2. Actualizar Familiares (si vienen en el body)
      if (body.familiares && body.familiares.length > 0) {
        await db.CensoCaracteristicaFamiliar.destroy({ where: { id_estudio: id }, transaction: t });
        const mappedFam = mapFrontendData(body, 3).familiares || body.familiares;
        const fams = mappedFam.map(f => ({ ...f, id_estudio: id }));
        await db.CensoCaracteristicaFamiliar.bulkCreate(fams, { transaction: t });
      }

      // 3. Actualizar módulos hijos (findOrCreate + update)
      const updateChild = async (Modelo, paso) => {
        const dbDatos = mapFrontendData(body, paso);
        // Evitamos crear con campos vacíos si no hay datos significativos
        if (Object.keys(dbDatos).length === 0) return;

        // Filtrar estrictamente a las columnas que el modelo acepta
        const columnasValidas = Object.keys(Modelo.getAttributes());
        const safeData = {};
        for (const col of columnasValidas) {
          if (col in dbDatos) safeData[col] = dbDatos[col];
        }

        const [record, created] = await Modelo.findOrCreate({ 
          where: { id_estudio: id }, 
          defaults: { ...safeData, id_estudio: id }, 
          transaction: t 
        });
        if (!created) await record.update(safeData, { transaction: t });
      };

      await updateChild(db.CensoSituacionEconomica, 5);
      await updateChild(db.CensoSituacionVivienda, 6);
      await updateChild(db.CensoServicios, 7);
      await updateChild(db.CensoSalud, 8);
      await updateChild(db.CensoParticipacionComunitaria, 9);
      await updateChild(db.CensoSituacionComunidad, 10);

      // 4. Actualizar opciones múltiples (checkboxes)
      // Se actualiza si 'opciones' viene explícitamente en el body (incluso si está vacío),
      // para soportar el caso donde el usuario desmarca todos los checkboxes.
      if (Array.isArray(body.opciones)) {
        // Categorías conocidas que pueden venir en el payload
        const todasLasCategorias = ['enseres_vivienda', 'insectos_tipos', 'animales_tipos', 'gas_cilindros', 'enfermedades', 'misiones'];
        if (body.opciones.length > 0) {
          // Borrar solo las categorías que vienen en el payload, e insertar las nuevas
          const categorias = [...new Set(body.opciones.map(o => o.categoria))];
          await db.CensoOpcionMultiple.destroy({ where: { id_estudio: id, categoria: categorias }, transaction: t });
          await db.CensoOpcionMultiple.bulkCreate(body.opciones.map(o => ({ ...o, id_estudio: id })), { transaction: t });
        } else {
          // Array vacío = se desmarcaron todos los checkboxes → borrar todas las categorías
          await db.CensoOpcionMultiple.destroy({ where: { id_estudio: id, categoria: todasLasCategorias }, transaction: t });
        }
      }

      await t.commit();

      if (req.user) {
        await AuditService.log(req.user.id, 'UPDATE', 'estudios_demograficos', id, datosAntiguos, estudio.toJSON());
      }
      res.json({ success: true, message: 'Censo actualizado correctamente' });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  static async finalizar(req, res, next) {
    try {
      const data = await EstudioDemografico.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Estudio demogrfico no encontrado" });

      // No hay campo explicito de finalizado, as que lo representamos con fecha_censo
      // y asumimos que actualizar validar en el futuro si lo desea.
      const datosAntiguos = data.toJSON();
      await data.update({ fecha_censo: new Date() }); // Marcar como completado hoy si no lo estaba

      if (req.user) {
        await AuditService.log(req.user.id, "UPDATE", "estudios_demograficos", data.id, datosAntiguos, data.toJSON());
      }
      res.json({ success: true, message: "Estudio demogrfico finalizado y bloqueado para ediciones.", data });
    } catch (error) { next(error); }
  }

  static async eliminar(req, res, next) {
    try {
      const data = await EstudioDemografico.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Estudio demogrfico no encontrado" });

      const datosAntiguos = data.toJSON();
      await data.update({ activo: false });

      if (req.user) {
        await AuditService.log(req.user.id, "DELETE", "estudios_demograficos", data.id, datosAntiguos, data.toJSON());
      }
      res.json({ success: true, message: "Estudio eliminado lógicamente" });
    } catch (error) { next(error); }
  }

  static async exportarPdf(req, res, next) {
    try {
      const { id } = req.params;
      const db = models;
      const PdfGeneradorViviendas = require('../services/pdfGeneradorViviendas');

      // Cargar el estudio demográfico con TODAS sus relaciones
      const estudio = await EstudioDemografico.findByPk(id, {
        include: [
          { model: db.CensoCaracteristicaFamiliar,  as: 'familiares'    },
          { model: db.CensoSituacionVivienda,        as: 'situacion_vivienda' },
          { model: db.CensoSalud,                    as: 'salud'         },
          { model: db.CensoServicios,                as: 'servicios'     },
          { model: db.CensoParticipacionComunitaria, as: 'participacion_comunitaria' },
          { model: db.CensoSituacionEconomica,       as: 'situacion_economica' },
          { model: db.CensoSituacionComunidad,       as: 'situacion_comunidad' },
          { model: db.ConsejoComunal,                as: 'consejo'       },
          { model: db.CensoOpcionMultiple,           as: 'opciones_multiples' }
        ]
      });

      if (!estudio) return res.status(404).json({ error: 'Estudio demográfico no encontrado' });

      const pdfBuffer = await PdfGeneradorViviendas.generarPdfEstudio(estudio.toJSON());

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=censo_demografico_${id}.pdf`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error exportando PDF del estudio demográfico:', error);
      res.status(500).json({ error: 'Error generando el PDF: ' + error.message });
    }
  }
  /**
   * Verificar si un habitante ya está en un censo
   */
  static async verificarHabitanteCensado(req, res) {
    try {
      const db = models;
      const { cedula } = req.params;
      if (!cedula) return res.status(400).json({ error: 'Cédula es requerida' });

      // Clean the cedula if it has extra characters (assuming V-12345 format might come in)
      const cedulaLimpia = cedula.replace(/^V-|^E-/i, '').trim();

      // Check if is Jefe in any census
      const jefe = await EstudioDemografico.findOne({
        where: { encuestado_cedula: cedulaLimpia }
      });
      if (jefe) {
        return res.json({
          censado: true,
          rol: 'Jefe(a) de Familia',
          planilla_nro: jefe.planilla_nro,
          jefe_cedula: jefe.encuestado_cedula
        });
      }

      // Check if is Familiar in any census
      const familiar = await db.CensoCaracteristicaFamiliar.findOne({
        where: { cedula_identidad: cedulaLimpia },
        include: [{
          model: EstudioDemografico,
          as: 'estudio',
          attributes: ['planilla_nro', 'encuestado_cedula']
        }]
      });

      if (familiar && familiar.estudio) {
        return res.json({
          censado: true,
          rol: familiar.parentesco,
          planilla_nro: familiar.estudio.planilla_nro,
          jefe_cedula: familiar.estudio.encuestado_cedula
        });
      }

      res.json({ censado: false });
    } catch (error) {
      logger.error('Error verificando habitante en censo:', error);
      res.status(500).json({ error: 'Error verificando habitante' });
    }
  }
}

module.exports = EstudioDemograficoController;
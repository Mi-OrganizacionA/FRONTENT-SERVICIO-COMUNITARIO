module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('censo_caracteristicas_familiar', {
        id_familiar: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        id_estudio: { type: Sequelize.INTEGER, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE', allowNull: false },
        nombres_apellidos: Sequelize.STRING(200),
        sexo: Sequelize.STRING(20),
        cedula_identidad: Sequelize.STRING(20),
        fecha_nacimiento: Sequelize.DATEONLY,
        discapacidad_tipo: Sequelize.STRING(100),
        embarazo_temprano: { type: Sequelize.BOOLEAN, defaultValue: false },
        parentesco: Sequelize.STRING(100),
        grado_instruccion: Sequelize.STRING(100),
        inscrito_cne: { type: Sequelize.BOOLEAN, defaultValue: false },
        profesion: Sequelize.STRING(100),
        pensionado: { type: Sequelize.BOOLEAN, defaultValue: false },
        ingreso_mensual_bs: Sequelize.DECIMAL(10, 2)
      });

      await queryInterface.createTable('censo_situacion_economica', {
        id_estudio: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
        trabaja: { type: Sequelize.BOOLEAN, defaultValue: false },
        donde_trabaja: Sequelize.STRING(200),
        ingreso_familiar_rango: Sequelize.STRING(100),
        actividad_comercial_vivienda: { type: Sequelize.BOOLEAN, defaultValue: false }
      });

      await queryInterface.createTable('censo_situacion_vivienda', {
        id_estudio: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
        condiciones_terreno: Sequelize.STRING(200),
        forma_tenencia: Sequelize.STRING(100),
        tipo_vivienda: Sequelize.STRING(100),
        cantidad_habitaciones: { type: Sequelize.INTEGER, defaultValue: 0 },
        pertenece_ocv: { type: Sequelize.BOOLEAN, defaultValue: false },
        terreno_propio: { type: Sequelize.BOOLEAN, defaultValue: false },
        tipo_paredes: Sequelize.STRING(100),
        tipo_techo: Sequelize.STRING(100),
        inscrita_sivih: { type: Sequelize.BOOLEAN, defaultValue: false },
        cotiza_politica_habitacional: { type: Sequelize.BOOLEAN, defaultValue: false },
        condiciones_salubridad: Sequelize.TEXT,
        requiere_ayuda_mejora: Sequelize.STRING(100),
        presencia_insectos_roedores: { type: Sequelize.BOOLEAN, defaultValue: false },
        tiene_animales_domesticos: { type: Sequelize.BOOLEAN, defaultValue: false }
      });

      await queryInterface.createTable('censo_salud', {
        id_estudio: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
        necesita_ayuda_especial: { type: Sequelize.BOOLEAN, defaultValue: false },
        cual_ayuda_especial: Sequelize.TEXT,
        exclusion_ninos_calle_cant: { type: Sequelize.INTEGER, defaultValue: 0 },
        exclusion_indigentes_cant: { type: Sequelize.INTEGER, defaultValue: 0 },
        exclusion_enfermos_term_cant: { type: Sequelize.INTEGER, defaultValue: 0 },
        exclusion_discapacitados_cant: { type: Sequelize.INTEGER, defaultValue: 0 },
        exclusion_tercera_edad_cant: { type: Sequelize.INTEGER, defaultValue: 0 },
        exclusion_otros: Sequelize.TEXT
      });

      await queryInterface.createTable('censo_servicios', {
        id_estudio: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
        aguas_blancas_tipo: Sequelize.STRING(100),
        tiene_tanque_litros: Sequelize.INTEGER,
        tiene_pipotes_cantidad: Sequelize.INTEGER,
        tiene_medidor_agua: { type: Sequelize.BOOLEAN, defaultValue: false },
        aguas_servidas_tipo: Sequelize.STRING(100),
        gas_tipo: Sequelize.STRING(100),
        gas_empresa_suministra: Sequelize.STRING(100),
        gas_duracion_y_precio: Sequelize.STRING(200),
        sistema_electrico_tipo: Sequelize.STRING(100),
        tiene_medidor_luz: { type: Sequelize.BOOLEAN, defaultValue: false },
        bombillos_ahorradores_necesita: { type: Sequelize.INTEGER, defaultValue: 0 },
        recoleccion_basura_tipo: Sequelize.STRING(100),
        telefonia_tipo: Sequelize.STRING(100),
        transporte_tipo: Sequelize.STRING(100)
      });

      await queryInterface.createTable('censo_participacion_comunitaria', {
        id_estudio: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
        existen_org_comunitarias: { type: Sequelize.BOOLEAN, defaultValue: false },
        cuales_org_comunitarias: Sequelize.STRING(255),
        participa_usted: { type: Sequelize.BOOLEAN, defaultValue: false },
        participa_familiar: { type: Sequelize.BOOLEAN, defaultValue: false },
        cree_pueblo_interviene_decisiones: { type: Sequelize.BOOLEAN, defaultValue: false },
        acuerdo_pueblo_protagonismo_presupuesto: { type: Sequelize.BOOLEAN, defaultValue: false },
        info_sobre_consejos_comunales: { type: Sequelize.BOOLEAN, defaultValue: false },
        como_obtuvo_info_consejos: Sequelize.STRING(200),
        dispuesto_apoyar_consejo: { type: Sequelize.BOOLEAN, defaultValue: false },
        asiste_asambleas_ciudadanos: { type: Sequelize.BOOLEAN, defaultValue: false },
        porque_no_asiste: Sequelize.TEXT,
        como_resolver_problemas_sector: Sequelize.TEXT,
        quien_resolver_problemas: Sequelize.STRING(200),
        tipo_proyectos_deseados: Sequelize.TEXT,
        como_apoyaria_proyectos: Sequelize.TEXT,
        compromiso_con_sector: Sequelize.TEXT,
        opinion_censo_energetico: Sequelize.TEXT
      });

      await queryInterface.createTable('censo_situacion_comunidad', {
        id_estudio: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
        principales_potencialidades_ventajas: Sequelize.TEXT,
        principales_problemas_debilidades: Sequelize.TEXT
      });

      await queryInterface.createTable('censo_opciones_multiples', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        id_estudio: { type: Sequelize.INTEGER, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE', allowNull: false },
        categoria: { type: Sequelize.STRING(50), allowNull: false },
        valor: { type: Sequelize.STRING(100), allowNull: false },
        cantidad: { type: Sequelize.INTEGER, defaultValue: 1 }
      });

    } catch (error) {
      console.error('Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('censo_opciones_multiples');
    await queryInterface.dropTable('censo_situacion_comunidad');
    await queryInterface.dropTable('censo_participacion_comunitaria');
    await queryInterface.dropTable('censo_servicios');
    await queryInterface.dropTable('censo_salud');
    await queryInterface.dropTable('censo_situacion_vivienda');
    await queryInterface.dropTable('censo_situacion_economica');
    await queryInterface.dropTable('censo_caracteristicas_familiar');
  }
};

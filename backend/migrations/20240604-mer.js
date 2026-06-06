module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Extender tabla habitantes
    await queryInterface.addColumn('habitantes', 'nacionalidad', { type: Sequelize.STRING(50) });
    await queryInterface.addColumn('habitantes', 'fecha_nacimiento', { type: Sequelize.DATE });
    await queryInterface.addColumn('habitantes', 'isincapacitado', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('habitantes', 'incapacitado_tipo', { type: Sequelize.STRING(150) });
    await queryInterface.addColumn('habitantes', 'pensionado', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('habitantes', 'pensionado_institucion', { type: Sequelize.STRING(150) });
    await queryInterface.addColumn('habitantes', 'estado_civil', { type: Sequelize.STRING(50) });
    await queryInterface.addColumn('habitantes', 'nivel_instruccion', { type: Sequelize.STRING(100) });
    await queryInterface.addColumn('habitantes', 'profesion_oficio', { type: Sequelize.STRING(150) });
    await queryInterface.addColumn('habitantes', 'tiempo_comunidad', { type: Sequelize.STRING(50) });
    await queryInterface.addColumn('habitantes', 'inscrito_cne', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('habitantes', 'trabaja_actualmente', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('habitantes', 'clasificacion_ingreso_familiar', { type: Sequelize.STRING(100) });
    await queryInterface.addColumn('habitantes', 'ingreso_mensual_bs', { type: Sequelize.DECIMAL });

    // Tabla: estudios_demograficos
    await queryInterface.createTable('estudios_demograficos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      consejo_comunal_id: { type: Sequelize.INTEGER, references: { model: 'consejos_comunales', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      codigo_comuna: Sequelize.STRING(50),
      rif: Sequelize.STRING(50),
      nro_cuenta: Sequelize.STRING(100),
      planilla_nro: Sequelize.STRING(50),
      fecha_censo: Sequelize.DATE,
      encuestador_nombre: Sequelize.STRING(200),
      encuestador_cedula: Sequelize.STRING(20),
      encuestado_nombre: Sequelize.STRING(200),
      encuestado_cedula: Sequelize.STRING(20),
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Tabla: produccion_agricola
    await queryInterface.createTable('produccion_agricola', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      consejo_comunal_id: { type: Sequelize.INTEGER, references: { model: 'consejos_comunales', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      habitante_id: { type: Sequelize.INTEGER, references: { model: 'habitantes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      rubro: Sequelize.STRING(150),
      hectareas_cultivadas: Sequelize.FLOAT,
      tipo_cultivo: Sequelize.STRING(150),
      ubicacion_cultivo: Sequelize.STRING(200),
      latitud: Sequelize.STRING(50),
      longitud: Sequelize.STRING(50),
      rendimiento_estimado: Sequelize.STRING(100),
      productos_secundarios: Sequelize.STRING(250),
      fecha_inicio_cultivo: Sequelize.DATE,
      observaciones: Sequelize.TEXT
    });

    // Tabla: organizaciones_sociales
    await queryInterface.createTable('organizaciones_sociales', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_organizacion: Sequelize.STRING(200),
      tipo_organizacion: Sequelize.STRING(100),
      mision: Sequelize.TEXT,
      contacto_telefono: Sequelize.STRING(50),
      contacto_email: Sequelize.STRING(150),
      id_habitante_responsable: { type: Sequelize.INTEGER, references: { model: 'habitantes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' }
    });

    // Tabla asociación: persona_grupo_social
    await queryInterface.createTable('persona_grupo_social', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_organizacion: { type: Sequelize.INTEGER, references: { model: 'organizaciones_sociales', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      id_habitante: { type: Sequelize.INTEGER, references: { model: 'habitantes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      rol_en_grupo: Sequelize.STRING(100),
      fecha_ingreso: Sequelize.DATE,
      fecha_salida: Sequelize.DATE
    });

    // Tabla: bandeja_validaciones
    await queryInterface.createTable('bandeja_validaciones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_vocero: { type: Sequelize.INTEGER, references: { model: 'usuarios', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      id_validador: { type: Sequelize.INTEGER, references: { model: 'usuarios', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      tabla_afectada: Sequelize.STRING(100),
      registro_id: Sequelize.INTEGER,
      tipo_accion: Sequelize.STRING(50),
      datos_temporales: Sequelize.JSON,
      estado_tramite: Sequelize.STRING(50),
      motivo_rechazo: Sequelize.TEXT,
      comentarios_validador: Sequelize.TEXT,
      fecha_solicitud: Sequelize.DATE,
      fecha_validacion: Sequelize.DATE
    });

    // Tabla: cartelera_digital
    await queryInterface.createTable('cartelera_digital', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_autor: { type: Sequelize.INTEGER, references: { model: 'usuarios', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      tipo_publicacion: Sequelize.STRING(50),
      titulo: Sequelize.STRING(250),
      contenido: Sequelize.TEXT,
      fecha_publicacion: Sequelize.DATE,
      publicado: { type: Sequelize.BOOLEAN, defaultValue: false }
    });

    // Tabla: logs_auditoria
    await queryInterface.createTable('logs_auditoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      accion: Sequelize.STRING(100),
      cambios_antes: Sequelize.JSON,
      cambios_despues: Sequelize.JSON,
      ip_address: Sequelize.STRING(100),
      user_agent: Sequelize.STRING(500),
      fecha: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      mes_ano: Sequelize.STRING(7)
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('logs_auditoria');
    await queryInterface.dropTable('cartelera_digital');
    await queryInterface.dropTable('bandeja_validaciones');
    await queryInterface.dropTable('persona_grupo_social');
    await queryInterface.dropTable('organizaciones_sociales');
    await queryInterface.dropTable('produccion_agricola');
    await queryInterface.dropTable('estudios_demograficos');

    // Eliminar columnas añadidas a habitantes (si existen)
    const cols = ['nacionalidad','fecha_nacimiento','isincapacitado','incapacitado_tipo','pensionado','pensionado_institucion','estado_civil','nivel_instruccion','profesion_oficio','tiempo_comunidad','inscrito_cne','trabaja_actualmente','clasificacion_ingreso_familiar','ingreso_mensual_bs'];
    for (const c of cols) {
      try { await queryInterface.removeColumn('habitantes', c); } catch (e) { /* ignore */ }
    }
  }
};

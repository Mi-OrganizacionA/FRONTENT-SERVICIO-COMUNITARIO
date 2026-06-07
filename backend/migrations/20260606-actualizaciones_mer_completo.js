module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // ============ ACTUALIZAR TABLA HABITANTES ============
      
      // Renombrar columnas y agregar nuevas
      const traits = await queryInterface.describeTable('habitantes');
      
      if (traits.nombre) {
        await queryInterface.renameColumn('habitantes', 'nombre', 'nombres');
      }
      if (traits.apellido) {
        await queryInterface.renameColumn('habitantes', 'apellido', 'apellidos');
      }
      
      // Agregar campos faltantes en habitantes
      if (!traits.nacionalidad) {
        await queryInterface.addColumn('habitantes', 'nacionalidad', { 
          type: Sequelize.STRING(1), 
          defaultValue: 'V' 
        });
      }
      
      if (!traits.fecha_nacimiento) {
        await queryInterface.addColumn('habitantes', 'fecha_nacimiento', { 
          type: Sequelize.DATE,
          allowNull: true 
        });
      }
      
      if (traits.edad) {
        await queryInterface.removeColumn('habitantes', 'edad');
      }
      
      if (!traits.ocupacion) {
        await queryInterface.addColumn('habitantes', 'ocupacion', { 
          type: Sequelize.STRING(150) 
        });
      }
      
      if (!traits.nivel_educativo) {
        await queryInterface.addColumn('habitantes', 'nivel_educativo', { 
          type: Sequelize.STRING(100) 
        });
      }
      
      if (!traits.condicion_salud) {
        await queryInterface.addColumn('habitantes', 'condicion_salud', { 
          type: Sequelize.ENUM('saludable', 'enfermedad_cronica', 'discapacidad', 'encamado'),
          defaultValue: 'saludable'
        });
      }
      
      if (!traits.incapacitado) {
        await queryInterface.addColumn('habitantes', 'incapacitado', { 
          type: Sequelize.BOOLEAN,
          defaultValue: false
        });
      }
      
      if (!traits.tiene_cedula_ampliada) {
        await queryInterface.addColumn('habitantes', 'tiene_cedula_ampliada', { 
          type: Sequelize.BOOLEAN,
          defaultValue: false
        });
      }
      
      if (traits.foto_cedula_url && !traits.fotografia_cedula_url) {
        await queryInterface.renameColumn('habitantes', 'foto_cedula_url', 'fotografia_cedula_url');
      }
      
      if (traits.elector || traits.clasificacion || traits.centro_electoral) {
        if (traits.elector) await queryInterface.removeColumn('habitantes', 'elector');
        if (traits.clasificacion) await queryInterface.removeColumn('habitantes', 'clasificacion');
        if (traits.centro_electoral) await queryInterface.removeColumn('habitantes', 'centro_electoral');
      }
      
      // ============ ACTUALIZAR TABLA USUARIOS ============
      
      const usersTraits = await queryInterface.describeTable('usuarios');
      
      if (usersTraits.usuario && !usersTraits.email) {
        await queryInterface.renameColumn('usuarios', 'usuario', 'email');
      }
      
      if (usersTraits.contraseña && !usersTraits.credenciales) {
        await queryInterface.renameColumn('usuarios', 'contraseña', 'credenciales');
      }
      
      if (usersTraits.consejo_comunal_id && !usersTraits.id_comunidad_asignada) {
        await queryInterface.renameColumn('usuarios', 'consejo_comunal_id', 'id_comunidad_asignada');
      }
      
      // ============ ACTUALIZAR TABLA CONSEJOS_COMUNALES ============
      
      const comunesTraits = await queryInterface.describeTable('consejos_comunales');
      
      if (comunesTraits.nombre && !comunesTraits.nombre_comunidad) {
        await queryInterface.renameColumn('consejos_comunales', 'nombre', 'nombre_comunidad');
      }
      
      if (!comunesTraits.habitantes_count) {
        await queryInterface.addColumn('consejos_comunales', 'habitantes_count', { 
          type: Sequelize.INTEGER,
          defaultValue: 0
        });
      }
      
      if (!comunesTraits.responsable) {
        await queryInterface.addColumn('consejos_comunales', 'responsable', { 
          type: Sequelize.STRING(150) 
        });
      }
      
      if (!comunesTraits.ubicacion) {
        await queryInterface.addColumn('consejos_comunales', 'ubicacion', { 
          type: Sequelize.TEXT 
        });
      }
      
      if (comunesTraits.direccion && comunesTraits.telefono && comunesTraits.email) {
        await queryInterface.removeColumn('consejos_comunales', 'direccion');
        await queryInterface.removeColumn('consejos_comunales', 'telefono');
        await queryInterface.removeColumn('consejos_comunales', 'email');
      }
      
      // ============ ACTUALIZAR TABLA CARTELERA_DIGITAL ============
      
      const carteTraits = await queryInterface.describeTable('cartelera_digital');
      
      if (!carteTraits.id_autor) {
        await queryInterface.addColumn('cartelera_digital', 'id_autor', { 
          type: Sequelize.INTEGER,
          references: { model: 'usuarios', key: 'id' },
          allowNull: true
        });
      }
      
      if (carteTraits.publicado && !carteTraits.activo) {
        await queryInterface.renameColumn('cartelera_digital', 'publicado', 'activo');
      }
      
      if (!carteTraits.fecha_publicacion) {
        await queryInterface.addColumn('cartelera_digital', 'fecha_publicacion', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      // ============ ACTUALIZAR TABLA LOGS_AUDITORIA ============
      
      const logsTraits = await queryInterface.describeTable('logs_auditoria');
      
      if (!logsTraits.id_usuario) {
        await queryInterface.addColumn('logs_auditoria', 'id_usuario', { 
          type: Sequelize.INTEGER,
          references: { model: 'usuarios', key: 'id' },
          allowNull: true
        });
      }
      
      if (!logsTraits.tabla_afectada) {
        await queryInterface.addColumn('logs_auditoria', 'tabla_afectada', { 
          type: Sequelize.STRING(100) 
        });
      }
      
      if (!logsTraits.registro_id) {
        await queryInterface.addColumn('logs_auditoria', 'registro_id', { 
          type: Sequelize.INTEGER 
        });
      }
      
      // ============ ACTUALIZAR TABLA BANDEJA_VALIDACIONES ============
      
      const bandejaTraits = await queryInterface.describeTable('bandeja_validaciones');
      
      if (!bandejaTraits.id_vocero) {
        await queryInterface.addColumn('bandeja_validaciones', 'id_vocero', { 
          type: Sequelize.INTEGER,
          references: { model: 'usuarios', key: 'id' },
          allowNull: true
        });
      }
      
      if (!bandejaTraits.id_validador) {
        await queryInterface.addColumn('bandeja_validaciones', 'id_validador', { 
          type: Sequelize.INTEGER,
          references: { model: 'usuarios', key: 'id' },
          allowNull: true
        });
      }
      
      if (!bandejaTraits.fecha_registro) {
        await queryInterface.addColumn('bandeja_validaciones', 'fecha_registro', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      // ============ ACTUALIZAR TABLA PRODUCCION_AGRICOLA ============
      
      const prodTraits = await queryInterface.describeTable('produccion_agricola');
      
      if (!prodTraits.id_habitante) {
        await queryInterface.addColumn('produccion_agricola', 'id_habitante', { 
          type: Sequelize.INTEGER,
          references: { model: 'habitantes', key: 'id' },
          allowNull: true
        });
      }
      
      if (!prodTraits.fecha_registro) {
        await queryInterface.addColumn('produccion_agricola', 'fecha_registro', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      if (!prodTraits.activo) {
        await queryInterface.addColumn('produccion_agricola', 'activo', { 
          type: Sequelize.BOOLEAN,
          defaultValue: true
        });
      }
      
      // ============ ACTUALIZAR TABLA ORGANIZACIONES_SOCIALES ============
      
      const orgsTraits = await queryInterface.describeTable('organizaciones_sociales');
      
      if (!orgsTraits.id_comunidad) {
        await queryInterface.addColumn('organizaciones_sociales', 'id_comunidad', { 
          type: Sequelize.INTEGER,
          references: { model: 'consejos_comunales', key: 'id' },
          allowNull: true
        });
      }
      
      if (!orgsTraits.descripcion) {
        await queryInterface.addColumn('organizaciones_sociales', 'descripcion', { 
          type: Sequelize.TEXT 
        });
      }
      
      if (!orgsTraits.fecha_creacion) {
        await queryInterface.addColumn('organizaciones_sociales', 'fecha_creacion', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      if (!orgsTraits.activo) {
        await queryInterface.addColumn('organizaciones_sociales', 'activo', { 
          type: Sequelize.BOOLEAN,
          defaultValue: true
        });
      }
      
      // ============ ACTUALIZAR TABLA PERSONA_GRUPO_SOCIAL ============
      
      const personasTraits = await queryInterface.describeTable('persona_grupo_social');
      
      if (!personasTraits.id_habitante) {
        await queryInterface.addColumn('persona_grupo_social', 'id_habitante', { 
          type: Sequelize.INTEGER,
          references: { model: 'habitantes', key: 'id' },
          allowNull: true
        });
      }
      
      if (!personasTraits.id_organizacion) {
        await queryInterface.addColumn('persona_grupo_social', 'id_organizacion', { 
          type: Sequelize.INTEGER,
          references: { model: 'organizaciones_sociales', key: 'id' },
          allowNull: true
        });
      }
      
      if (!personasTraits.activo) {
        await queryInterface.addColumn('persona_grupo_social', 'activo', { 
          type: Sequelize.BOOLEAN,
          defaultValue: true
        });
      }
      
      if (!personasTraits.fecha_registro) {
        await queryInterface.addColumn('persona_grupo_social', 'fecha_registro', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      // ============ ACTUALIZAR TABLA ESTUDIOS_DEMOGRAFICOS ============
      
      const estudiosTraits = await queryInterface.describeTable('estudios_demograficos');
      
      if (!estudiosTraits.id_comunidad) {
        await queryInterface.addColumn('estudios_demograficos', 'id_comunidad', { 
          type: Sequelize.INTEGER,
          references: { model: 'consejos_comunales', key: 'id' },
          allowNull: true
        });
      }
      
      if (!estudiosTraits.activo) {
        await queryInterface.addColumn('estudios_demograficos', 'activo', { 
          type: Sequelize.BOOLEAN,
          defaultValue: true
        });
      }
      
      if (estudiosTraits.created_at && !estudiosTraits.fecha_creacion) {
        await queryInterface.renameColumn('estudios_demograficos', 'created_at', 'fecha_creacion');
      }
      
      // ============ ACTUALIZAR TABLA VIVIENDAS ============
      
      const viviendaTraits = await queryInterface.describeTable('viviendas');
      
      if (!viviendaTraits.id_comunidad) {
        await queryInterface.addColumn('viviendas', 'id_comunidad', { 
          type: Sequelize.INTEGER,
          references: { model: 'consejos_comunales', key: 'id' },
          allowNull: true
        });
      }
      
      if (viviendaTraits.consejo_comunal_id) {
        await queryInterface.removeColumn('viviendas', 'consejo_comunal_id');
      }
      
      if (!viviendaTraits.id_jefe_familia) {
        await queryInterface.addColumn('viviendas', 'id_jefe_familia', { 
          type: Sequelize.INTEGER,
          references: { model: 'habitantes', key: 'id' },
          allowNull: true
        });
      }
      
      if (viviendaTraits.tipo && !viviendaTraits.tipo_vivienda) {
        await queryInterface.renameColumn('viviendas', 'tipo', 'tipo_vivienda');
      }
      
      if (viviendaTraits.tamaño_m2) {
        await queryInterface.changeColumn('viviendas', 'tamaño_m2', { 
          type: Sequelize.DECIMAL(10, 2) 
        });
      }
      
      if (!viviendaTraits.cantidad_habitaciones) {
        await queryInterface.addColumn('viviendas', 'cantidad_habitaciones', { 
          type: Sequelize.INTEGER 
        });
      }
      
      if (!viviendaTraits.tipo_paredes) {
        await queryInterface.addColumn('viviendas', 'tipo_paredes', { 
          type: Sequelize.STRING(100) 
        });
      }
      
      if (!viviendaTraits.tipo_techo) {
        await queryInterface.addColumn('viviendas', 'tipo_techo', { 
          type: Sequelize.STRING(100) 
        });
      }
      
      if (!viviendaTraits.condiciones_salubridad) {
        await queryInterface.addColumn('viviendas', 'condiciones_salubridad', { 
          type: Sequelize.TEXT 
        });
      }
      
      if (!viviendaTraits.requiere_ayuda_mejora) {
        await queryInterface.addColumn('viviendas', 'requiere_ayuda_mejora', { 
          type: Sequelize.STRING(100) 
        });
      }
      
      if (!viviendaTraits.enseres_vivienda) {
        await queryInterface.addColumn('viviendas', 'enseres_vivienda', { 
          type: Sequelize.JSON 
        });
      }
      
      if (!viviendaTraits.fecha_registro) {
        await queryInterface.addColumn('viviendas', 'fecha_registro', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      if (!viviendaTraits.activo) {
        await queryInterface.addColumn('viviendas', 'activo', { 
          type: Sequelize.BOOLEAN,
          defaultValue: true
        });
      }
      
      // ============ ACTUALIZAR TABLA PROYECTOS ============
      
      const proyectoTraits = await queryInterface.describeTable('proyectos');
      
      if (!proyectoTraits.id_comunidad) {
        await queryInterface.addColumn('proyectos', 'id_comunidad', { 
          type: Sequelize.INTEGER,
          references: { model: 'consejos_comunales', key: 'id' },
          allowNull: true
        });
      }
      
      if (proyectoTraits.consejo_comunal_id) {
        await queryInterface.removeColumn('proyectos', 'consejo_comunal_id');
      }
      
      if (!proyectoTraits.fecha_inicio) {
        await queryInterface.addColumn('proyectos', 'fecha_inicio', { 
          type: Sequelize.DATE 
        });
      }
      
      if (!proyectoTraits.fecha_fin) {
        await queryInterface.addColumn('proyectos', 'fecha_fin', { 
          type: Sequelize.DATE 
        });
      }
      
      if (!proyectoTraits.activo) {
        await queryInterface.addColumn('proyectos', 'activo', { 
          type: Sequelize.BOOLEAN,
          defaultValue: true
        });
      }
      
      // ============ ACTUALIZAR TABLA VOTACIONES ============
      
      const votTraits = await queryInterface.describeTable('votaciones');
      
      if (!votTraits.id_comunidad) {
        await queryInterface.addColumn('votaciones', 'id_comunidad', { 
          type: Sequelize.INTEGER,
          references: { model: 'consejos_comunales', key: 'id' },
          allowNull: true
        });
      }
      
      if (votTraits.consejo_comunal_id) {
        await queryInterface.removeColumn('votaciones', 'consejo_comunal_id');
      }
      
      if (!votTraits.fecha_creacion) {
        await queryInterface.addColumn('votaciones', 'fecha_creacion', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      // ============ ACTUALIZAR TABLA NOTICIAS ============
      
      const notTraits = await queryInterface.describeTable('noticias');
      
      if (!notTraits.id_autor) {
        await queryInterface.addColumn('noticias', 'id_autor', { 
          type: Sequelize.INTEGER,
          references: { model: 'usuarios', key: 'id' },
          allowNull: true
        });
      }
      
      if (!notTraits.fecha_creacion) {
        await queryInterface.addColumn('noticias', 'fecha_creacion', { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        });
      }
      
      // ============ ACTUALIZAR TABLA REPORTES_7T ============
      
      const repTraits = await queryInterface.describeTable('reportes_7t');
      
      if (!repTraits.id_comunidad) {
        await queryInterface.addColumn('reportes_7t', 'id_comunidad', { 
          type: Sequelize.INTEGER,
          references: { model: 'consejos_comunales', key: 'id' },
          allowNull: true
        });
      }
      
      if (repTraits.consejo_comunal_id) {
        await queryInterface.removeColumn('reportes_7t', 'consejo_comunal_id');
      }
      
      if (repTraits.fecha && !repTraits.fecha_creacion) {
        await queryInterface.renameColumn('reportes_7t', 'fecha', 'fecha_creacion');
      }
      
      if (!repTraits.activo) {
        await queryInterface.addColumn('reportes_7t', 'activo', { 
          type: Sequelize.BOOLEAN,
          defaultValue: true
        });
      }
      
      console.log('✅ Migración 20260606-actualizaciones_mer_completo completada exitosamente');
    } catch (error) {
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⚠️ Reversión no implementada para esta migración');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── EstudioDemografico ──
    const colsEst = await queryInterface.describeTable('estudios_demograficos').catch(() => ({}));
    if (!colsEst.observacion) await queryInterface.addColumn('estudios_demograficos', 'observacion', { type: Sequelize.TEXT, allowNull: true });

    // ── CensoCaracteristicaFamiliar ──
    const colsFam = await queryInterface.describeTable('censo_caracteristicas_familiar').catch(() => ({}));
    if (!colsFam.tiempo_comunidad)              await queryInterface.addColumn('censo_caracteristicas_familiar', 'tiempo_comunidad',              { type: Sequelize.STRING(100), allowNull: true });
    if (!colsFam.incapacitado)                  await queryInterface.addColumn('censo_caracteristicas_familiar', 'incapacitado',                  { type: Sequelize.BOOLEAN, defaultValue: false });
    if (!colsFam.pensionado_institucion)        await queryInterface.addColumn('censo_caracteristicas_familiar', 'pensionado_institucion',        { type: Sequelize.STRING(200), allowNull: true });
    if (!colsFam.telefono_celular)              await queryInterface.addColumn('censo_caracteristicas_familiar', 'telefono_celular',              { type: Sequelize.STRING(30), allowNull: true });
    if (!colsFam.telefono_habitacion)           await queryInterface.addColumn('censo_caracteristicas_familiar', 'telefono_habitacion',           { type: Sequelize.STRING(30), allowNull: true });
    if (!colsFam.telefono_oficina)              await queryInterface.addColumn('censo_caracteristicas_familiar', 'telefono_oficina',              { type: Sequelize.STRING(30), allowNull: true });
    if (!colsFam.email_familiar)                await queryInterface.addColumn('censo_caracteristicas_familiar', 'email_familiar',                { type: Sequelize.STRING(200), allowNull: true });
    if (!colsFam.estado_civil)                  await queryInterface.addColumn('censo_caracteristicas_familiar', 'estado_civil',                  { type: Sequelize.STRING(50), allowNull: true });
    if (!colsFam.trabaja_actualmente)           await queryInterface.addColumn('censo_caracteristicas_familiar', 'trabaja_actualmente',           { type: Sequelize.BOOLEAN, defaultValue: false });
    if (!colsFam.clasificacion_ingreso_familiar) await queryInterface.addColumn('censo_caracteristicas_familiar', 'clasificacion_ingreso_familiar', { type: Sequelize.STRING(100), allowNull: true });

    // ── CensoSituacionComunidad ──
    const colsCom = await queryInterface.describeTable('censo_situacion_comunidad').catch(() => ({}));
    if (!colsCom.como_resolver_problemas) await queryInterface.addColumn('censo_situacion_comunidad', 'como_resolver_problemas', { type: Sequelize.TEXT, allowNull: true });
    if (!colsCom.tipo_proyectos_deseados) await queryInterface.addColumn('censo_situacion_comunidad', 'tipo_proyectos_deseados', { type: Sequelize.TEXT, allowNull: true });
    if (!colsCom.observaciones)           await queryInterface.addColumn('censo_situacion_comunidad', 'observaciones',           { type: Sequelize.TEXT, allowNull: true });

    // ── CensoParticipacionComunitaria ──
    const colsPar = await queryInterface.describeTable('censo_participacion_comunitaria').catch(() => ({}));
    if (!colsPar.tiene_info_consejos_comunales) await queryInterface.addColumn('censo_participacion_comunitaria', 'tiene_info_consejos_comunales', { type: Sequelize.BOOLEAN, defaultValue: false });
    if (!colsPar.como_obtuvo_info_consejo)      await queryInterface.addColumn('censo_participacion_comunitaria', 'como_obtuvo_info_consejo',      { type: Sequelize.TEXT, allowNull: true });
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir
    await queryInterface.removeColumn('estudios_demograficos', 'observacion').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'tiempo_comunidad').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'incapacitado').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'pensionado_institucion').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'telefono_celular').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'telefono_habitacion').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'telefono_oficina').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'email_familiar').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'estado_civil').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'trabaja_actualmente').catch(() => {});
    await queryInterface.removeColumn('censo_caracteristicas_familiar', 'clasificacion_ingreso_familiar').catch(() => {});
    await queryInterface.removeColumn('censo_situacion_comunidad', 'como_resolver_problemas').catch(() => {});
    await queryInterface.removeColumn('censo_situacion_comunidad', 'tipo_proyectos_deseados').catch(() => {});
    await queryInterface.removeColumn('censo_situacion_comunidad', 'observaciones').catch(() => {});
    await queryInterface.removeColumn('censo_participacion_comunitaria', 'tiene_info_consejos_comunales').catch(() => {});
    await queryInterface.removeColumn('censo_participacion_comunitaria', 'como_obtuvo_info_consejo').catch(() => {});
  }
};

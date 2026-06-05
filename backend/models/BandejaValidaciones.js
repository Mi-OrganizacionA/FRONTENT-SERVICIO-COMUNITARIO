const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BandejaValidaciones = sequelize.define('BandejaValidaciones', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tabla_afectada: DataTypes.STRING(100),
    registro_id: DataTypes.INTEGER,
    tipo_accion: DataTypes.STRING(50),
    datos_temporales: DataTypes.JSON,
    estado_tramite: DataTypes.STRING(50),
    motivo_rechazo: DataTypes.TEXT,
    comentarios_validador: DataTypes.TEXT,
    fecha_solicitud: DataTypes.DATE,
    fecha_validacion: DataTypes.DATE
  }, { tableName: 'bandeja_validaciones', timestamps: false });

  return BandejaValidaciones;
};

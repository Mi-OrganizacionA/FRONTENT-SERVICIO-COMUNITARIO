const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EstudioDemografico = sequelize.define('EstudioDemografico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo_comuna: DataTypes.STRING(50),
    rif: DataTypes.STRING(50),
    nro_cuenta: DataTypes.STRING(100),
    planilla_nro: DataTypes.STRING(50),
    fecha_censo: DataTypes.DATE,
    encuestador_nombre: DataTypes.STRING(200),
    encuestador_cedula: DataTypes.STRING(20),
    encuestado_nombre: DataTypes.STRING(200),
    encuestado_cedula: DataTypes.STRING(20),
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'estudios_demograficos', timestamps: false });

  return EstudioDemografico;
};

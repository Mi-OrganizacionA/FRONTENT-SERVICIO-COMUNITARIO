const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EstudioDemografico = sequelize.define('EstudioDemografico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_comunidad: { 
      type: DataTypes.INTEGER, 
      references: { model: 'consejos_comunales', key: 'id' }, 
      allowNull: false 
    },
    codigo_comuna: DataTypes.STRING(50),
    rif: DataTypes.STRING(50),
    nro_cuenta: DataTypes.STRING(100),
    planilla_nro: DataTypes.STRING(50),
    fecha_censo: DataTypes.DATE,
    encuestador_nombre: DataTypes.STRING(200),
    encuestador_cedula: DataTypes.STRING(20),
    encuestado_nombre: DataTypes.STRING(200),
    encuestado_cedula: DataTypes.STRING(20),
    // Secciones del censo
    estado: DataTypes.STRING(100),
    municipio: DataTypes.STRING(100),
    parroquia: DataTypes.STRING(100),
    sector: DataTypes.STRING(100),
    nombre_comunidad: DataTypes.STRING(200),
    direccion_comunidad: DataTypes.TEXT,
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'estudios_demograficos', timestamps: false });

  return EstudioDemografico;
};

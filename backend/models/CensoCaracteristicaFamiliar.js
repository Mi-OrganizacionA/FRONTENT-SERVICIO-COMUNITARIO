const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoCaracteristicaFamiliar = sequelize.define('CensoCaracteristicaFamiliar', {
    id_familiar: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_estudio: { type: DataTypes.INTEGER, references: { model: 'estudios_demograficos', key: 'id' }, allowNull: false, onDelete: 'CASCADE' },
    nombres_apellidos: DataTypes.STRING(200),
    sexo: DataTypes.STRING(20),
    cedula_identidad: DataTypes.STRING(20),
    fecha_nacimiento: DataTypes.DATEONLY,
    discapacidad_tipo: DataTypes.STRING(100),
    embarazo_temprano: { type: DataTypes.BOOLEAN, defaultValue: false },
    parentesco: DataTypes.STRING(100),
    grado_instruccion: DataTypes.STRING(100),
    inscrito_cne: { type: DataTypes.BOOLEAN, defaultValue: false },
    profesion: DataTypes.STRING(100),
    pensionado: { type: DataTypes.BOOLEAN, defaultValue: false },
    ingreso_mensual_bs: DataTypes.DECIMAL(10, 2),
    tiempo_comunidad: DataTypes.STRING(100),
    incapacitado: { type: DataTypes.BOOLEAN, defaultValue: false },
    pensionado_institucion: DataTypes.STRING(200),
    telefono_celular: DataTypes.STRING(30),
    telefono_habitacion: DataTypes.STRING(30),
    telefono_oficina: DataTypes.STRING(30),
    email_familiar: DataTypes.STRING(200),
    estado_civil: DataTypes.STRING(50),
    trabaja_actualmente: { type: DataTypes.BOOLEAN, defaultValue: false },
    clasificacion_ingreso_familiar: DataTypes.STRING(100)
  }, { tableName: 'censo_caracteristicas_familiar', timestamps: false });

  return CensoCaracteristicaFamiliar;
};

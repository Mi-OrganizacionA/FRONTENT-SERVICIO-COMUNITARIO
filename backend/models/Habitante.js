const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Habitante = sequelize.define('Habitante', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cedula: { type: DataTypes.STRING(20), unique: true, allowNull: false },
    nombres: { type: DataTypes.STRING(100), allowNull: false },
    apellidos: { type: DataTypes.STRING(100), allowNull: false },
    nacionalidad: { type: DataTypes.STRING(1), defaultValue: 'V' }, // V=Venezolano, E=Extranjero
    fecha_nacimiento: { type: DataTypes.DATE, allowNull: false }, // Campo maestro para calcular edad y elector_activo
    genero: { type: DataTypes.ENUM('M','F','Otro'), allowNull: false },
    email: DataTypes.STRING(100),
    telefono: DataTypes.STRING(20),
    direccion: DataTypes.TEXT,
    ocupacion: DataTypes.STRING(150),
    nivel_educativo: DataTypes.STRING(100),
    condicion_salud: { 
      type: DataTypes.ENUM('saludable', 'enfermedad_cronica', 'discapacidad', 'encamado'), 
      defaultValue: 'saludable' 
    },
    incapacitado: DataTypes.BOOLEAN,
    incapacitado_tipo: DataTypes.STRING(150),
    pensionado: DataTypes.BOOLEAN,
    pensionado_institucion: DataTypes.STRING(150),
    estado_civil: DataTypes.STRING(50),
    tiempo_comunidad: DataTypes.STRING(50),
    inscrito_cne: DataTypes.BOOLEAN,
    trabaja_actualmente: DataTypes.BOOLEAN,
    clasificacion_ingreso_familiar: DataTypes.STRING(100),
    ingreso_mensual_bs: DataTypes.DECIMAL(12, 2),
    consejo_comunal_id: { type: DataTypes.INTEGER, references: { model: 'consejos_comunales', key: 'id' }, allowNull: false },
    tiene_cedula_ampliada: DataTypes.BOOLEAN,
    fotografia_cedula_url: DataTypes.STRING(500),
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'habitantes', timestamps: false });

  return Habitante;
};

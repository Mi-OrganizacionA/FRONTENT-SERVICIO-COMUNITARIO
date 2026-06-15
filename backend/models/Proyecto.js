const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proyecto = sequelize.define('Proyecto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_comunidad: { 
      type: DataTypes.INTEGER, 
      references: { model: 'consejos_comunales', key: 'id' }, 
      allowNull: false 
    },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    descripcion: DataTypes.TEXT,
    estado: { 
      type: DataTypes.ENUM('propuesto','aprobado','rechazado','en_ejecucion','finalizado'), 
      defaultValue: 'propuesto' 
    },
    presupuesto: DataTypes.DECIMAL(12, 2),
    avance: { type: DataTypes.INTEGER, defaultValue: 0 },
    tipo_proyecto: { type: DataTypes.STRING(50) },
    responsable: { type: DataTypes.STRING(150) },
    observaciones: DataTypes.TEXT,
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_inicio: DataTypes.DATE,
    fecha_fin: DataTypes.DATE,
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'proyectos', timestamps: false });

  return Proyecto;
};

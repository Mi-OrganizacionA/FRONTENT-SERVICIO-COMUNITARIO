const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proyecto = sequelize.define('Proyecto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    descripcion: DataTypes.TEXT,
    estado: { type: DataTypes.ENUM('propuesto','aprobado','rechazado','en_ejecucion','finalizado'), defaultValue: 'propuesto' },
    presupuesto: DataTypes.DECIMAL,
    consejo_comunal_id: DataTypes.INTEGER,
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'proyectos', timestamps: false });

  return Proyecto;
};

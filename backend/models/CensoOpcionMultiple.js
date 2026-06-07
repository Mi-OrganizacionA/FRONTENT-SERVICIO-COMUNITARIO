const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoOpcionMultiple = sequelize.define('CensoOpcionMultiple', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_estudio: { type: DataTypes.INTEGER, references: { model: 'estudios_demograficos', key: 'id' }, allowNull: false, onDelete: 'CASCADE' },
    categoria: { type: DataTypes.STRING(50), allowNull: false }, // 'ventas_vivienda', 'ambientes', 'enseres', 'plagas', 'animales', 'enfermedades', 'gas_cilindros', 'mecanismos_info', 'servicios_cercanos', 'misiones', 'areas_trabajo'
    valor: { type: DataTypes.STRING(100), allowNull: false }, // 'Nevera', 'Cáncer', 'Radio'
    cantidad: { type: DataTypes.INTEGER, defaultValue: 1 } // Útil para 'gas_cilindros_cantidad_y_tipo'
  }, { tableName: 'censo_opciones_multiples', timestamps: false });

  return CensoOpcionMultiple;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CensoServicios = sequelize.define('CensoServicios', {
    id_estudio: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'estudios_demograficos', key: 'id' }, onDelete: 'CASCADE' },
    aguas_blancas_tipo: DataTypes.STRING(100),
    tiene_tanque_litros: DataTypes.INTEGER,
    tiene_pipotes_cantidad: DataTypes.INTEGER,
    tiene_medidor_agua: { type: DataTypes.BOOLEAN, defaultValue: false },
    aguas_servidas_tipo: DataTypes.STRING(100),
    gas_tipo: DataTypes.STRING(100),
    gas_empresa_suministra: DataTypes.STRING(100),
    gas_duracion_y_precio: DataTypes.STRING(200),
    sistema_electrico_tipo: DataTypes.STRING(100),
    tiene_medidor_luz: { type: DataTypes.BOOLEAN, defaultValue: false },
    bombillos_ahorradores_necesita: { type: DataTypes.INTEGER, defaultValue: 0 },
    recoleccion_basura_tipo: DataTypes.STRING(100),
    telefonia_tipo: DataTypes.STRING(100),
    transporte_tipo: DataTypes.STRING(100)
  }, { tableName: 'censo_servicios', timestamps: false });

  return CensoServicios;
};

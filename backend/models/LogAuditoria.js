const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LogAuditoria = sequelize.define('LogAuditoria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    accion: DataTypes.STRING(100),
    cambios_antes: DataTypes.JSON,
    cambios_despues: DataTypes.JSON,
    ip_address: DataTypes.STRING(100),
    user_agent: DataTypes.STRING(500),
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    mes_ano: DataTypes.STRING(7)
  }, { tableName: 'logs_auditoria', timestamps: false });

  return LogAuditoria;
};

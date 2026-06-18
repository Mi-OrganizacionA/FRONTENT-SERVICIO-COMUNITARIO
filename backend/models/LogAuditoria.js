const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LogAuditoria = sequelize.define('LogAuditoria', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { 
      type: DataTypes.INTEGER, 
      references: { model: 'usuarios', key: 'id' }, 
      allowNull: true 
    },
    accion: { 
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VALIDACION'), 
      allowNull: false 
    },
    tabla_afectada: { type: DataTypes.STRING(100), allowNull: false },
    registro_id: DataTypes.INTEGER,
    cambios_antes: DataTypes.JSON,
    cambios_despues: DataTypes.JSON,
    ip_address: DataTypes.STRING(50),
    user_agent: DataTypes.STRING(500),
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    mes_ano: DataTypes.STRING(7) // ej: "2026-05" para facilitar políticas de retención
  }, { 
    tableName: 'logs_auditoria', 
    timestamps: false,
    hooks: {
      beforeUpdate: () => {
        throw new Error('Los logs de auditoría no pueden ser modificados');
      },
      beforeDestroy: () => {
        throw new Error('Los logs de auditoría no pueden ser eliminados');
      }
    }
  });

  return LogAuditoria;
};

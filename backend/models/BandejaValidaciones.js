const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BandejaValidaciones = sequelize.define('BandejaValidaciones', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_vocero: { 
      type: DataTypes.INTEGER, 
      references: { model: 'usuarios', key: 'id' }, 
      allowNull: false 
    },
    id_validador: { 
      type: DataTypes.INTEGER, 
      references: { model: 'usuarios', key: 'id' }, 
      allowNull: true // NULL mientras esté pendiente
    },
    tabla_afectada: { type: DataTypes.STRING(100), allowNull: false },
    registro_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo_accion: { 
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'), 
      allowNull: false 
    },
    datos_temporales: { 
      type: DataTypes.JSON, 
      allowNull: false 
    }, // Campo mágico que empaqueta toda la información del formulario
    estado_tramite: { 
      type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'), 
      defaultValue: 'Pendiente' 
    },
    motivo_rechazo: DataTypes.TEXT,
    comentarios_validador: DataTypes.TEXT,
    fecha_solicitud: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_validacion: DataTypes.DATE
  }, { 
    tableName: 'bandeja_validaciones', 
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['id_vocero', 'tabla_afectada', 'registro_id', 'tipo_accion']
      }
    ]
  });

  return BandejaValidaciones;
};

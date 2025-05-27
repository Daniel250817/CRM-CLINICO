const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Notificacion extends Model {
    static associate(models) {
      // Relación con Usuario
      Notificacion.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario'
      });
    }
  }
  
  Notificacion.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    mensaje: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tipo: {
      type: DataTypes.ENUM('info', 'alerta', 'recordatorio', 'error'),
      defaultValue: 'info'
    },
    entidadTipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tipo de entidad relacionada (cita, tarea, etc.)'
    },
    entidadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de la entidad relacionada'
    },
    accion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Acción relacionada (crear, actualizar, cancelar, etc.)'
    }
  }, {
    sequelize,
    modelName: 'Notificacion',
    tableName: 'notificaciones',
    timestamps: true,
    indexes: [
      {
        name: 'idx_notificacion_usuario',
        fields: ['usuarioId']
      },
      {
        name: 'idx_notificacion_leida',
        fields: ['leida']
      }
    ]
  });
  
  return Notificacion;
};

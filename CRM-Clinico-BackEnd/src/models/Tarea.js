const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Tarea extends Model {
    static associate(models) {
      // Relación con Usuario (asignado a)
      Tarea.belongsTo(models.Usuario, {
        foreignKey: 'asignadoA',
        as: 'responsable'
      });
      
      // Relación con Usuario (creado por)
      Tarea.belongsTo(models.Usuario, {
        foreignKey: 'creadoPor',
        as: 'creador'
      });
    }
  }
  
  Tarea.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titulo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'El título es obligatorio' },
        notEmpty: { msg: 'El título no puede estar vacío' }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    asignadoA: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    creadoPor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    fechaLimite: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: { msg: 'La fecha límite debe ser válida' }
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en progreso', 'completada', 'cancelada'),
      defaultValue: 'pendiente'
    },
    prioridad: {
      type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
      defaultValue: 'media'
    },
    completadoEn: {
      type: DataTypes.DATE,
      allowNull: true
    },
    recordatorioEnviado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Tarea',
    tableName: 'tareas',
    timestamps: true,
    indexes: [
      {
        name: 'idx_tarea_asignado',
        fields: ['asignadoA']
      },
      {
        name: 'idx_tarea_estado',
        fields: ['estado']
      },
      {
        name: 'idx_tarea_fecha_limite',
        fields: ['fechaLimite']
      }
    ]
  });
  
  return Tarea;
};

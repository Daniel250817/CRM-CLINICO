const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Cita extends Model {
    static associate(models) {
      // Relación con Cliente
      Cita.belongsTo(models.Cliente, {
        foreignKey: 'clienteId',
        as: 'cliente'
      });
      
      // Relación con Dentista
      Cita.belongsTo(models.Dentista, {
        foreignKey: 'dentistaId',
        as: 'dentista'
      });
      
      // Relación con Servicio
      Cita.belongsTo(models.Servicio, {
        foreignKey: 'servicioId',
        as: 'servicio'
      });
    }
  }
  
  Cita.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    dentistaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dentistas',
        key: 'id'
      }
    },
    servicioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'servicios',
        key: 'id'
      }
    },
    fechaHora: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: { msg: 'La fecha debe ser válida' },
        isAfter: {
          args: new Date().toISOString(),
          msg: 'La fecha de la cita debe ser en el futuro'
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no asistió'),
      defaultValue: 'pendiente'
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duracion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duración en minutos'
    },
    motivoCancelacion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    recordatorioEnviado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    confirmada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Cita',
    tableName: 'citas',
    timestamps: true,
    indexes: [
      {
        name: 'idx_cita_fecha',
        fields: ['fechaHora']
      },
      {
        name: 'idx_cita_dentista_fecha',
        fields: ['dentistaId', 'fechaHora']
      },
      {
        name: 'idx_cita_cliente_fecha',
        fields: ['clienteId', 'fechaHora']
      }
    ]
  });
  
  return Cita;
};

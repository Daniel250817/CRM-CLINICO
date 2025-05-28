const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Tratamiento extends Model {
    static associate(models) {
      // Relación con Cliente
      Tratamiento.belongsTo(models.Cliente, {
        foreignKey: 'clienteId',
        as: 'cliente'
      });

      // Relación con Dentista
      Tratamiento.belongsTo(models.Dentista, {
        foreignKey: 'dentistaId',
        as: 'dentista'
      });
    }
  }

  Tratamiento.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('activo', 'completado', 'cancelado'),
      defaultValue: 'activo'
    },
    progreso: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    sesionesTotales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    sesionesCompletadas: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Tratamiento',
    tableName: 'tratamientos'
  });

  return Tratamiento;
}; 
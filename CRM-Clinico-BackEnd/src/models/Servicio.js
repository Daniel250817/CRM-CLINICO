const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Servicio extends Model {
    static associate(models) {
      // Relación con Citas
      Servicio.hasMany(models.Cita, {
        foreignKey: 'servicioId',
        as: 'citas'
      });
    }
  }
  
  Servicio.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'El nombre es obligatorio' },
        notEmpty: { msg: 'El nombre no puede estar vacío' }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'El precio debe ser un valor decimal válido' },
        min: {
          args: [0],
          msg: 'El precio no puede ser negativo'
        }
      }
    },
    duracion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duración en minutos',
      validate: {
        isInt: { msg: 'La duración debe ser un número entero' },
        min: {
          args: [1],
          msg: 'La duración debe ser mayor a 0 minutos'
        }
      }
    },
    imagen: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    codigoServicio: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Servicio',
    tableName: 'servicios',
    timestamps: true
  });
  
  return Servicio;
};

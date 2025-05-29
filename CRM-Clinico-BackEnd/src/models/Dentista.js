const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Dentista extends Model {
    static associate(models) {
      // Relación con Usuario
      Dentista.belongsTo(models.Usuario, { 
        foreignKey: 'userId', 
        as: 'usuario',
        onDelete: 'CASCADE' 
      });
      
      // Relación con Citas
      Dentista.hasMany(models.Cita, {
        foreignKey: 'dentistaId',
        as: 'citas'
      });
    }
  }
  
  Dentista.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      unique: true
    },
    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    horarioTrabajo: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON con los horarios de trabajo por día de la semana'
    },
    status: {
      type: DataTypes.ENUM('activo', 'inactivo', 'vacaciones'),
      defaultValue: 'activo'
    },
    titulo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    numeroColegiado: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    añosExperiencia: {
      type: DataTypes.INTEGER,
      allowNull: true
    },    biografia: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Dentista',
    tableName: 'dentistas',
    timestamps: true
  });
  
  return Dentista;
};

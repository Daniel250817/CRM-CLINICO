const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Cliente extends Model {
    static associate(models) {
      // Relación con Usuario (opcional ahora)
      Cliente.belongsTo(models.Usuario, { 
        foreignKey: 'userId', 
        as: 'usuario',
        onDelete: 'SET NULL' 
      });
      
      // Relación con Citas
      Cliente.hasMany(models.Cita, {
        foreignKey: 'clienteId',
        as: 'citas'
      });

      // Relación con Documentos
      Cliente.hasMany(models.Documento, {
        foreignKey: 'clienteId',
        as: 'documentos'
      });
    }
  }
  
  Cliente.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    historialMedico: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    alergias: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fechaRegistro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fechaNacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    genero: {
      type: DataTypes.ENUM('masculino', 'femenino', 'otro', 'prefiero no decir', 'no_especificado'),
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    ocupacion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contactoEmergencia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    telefonoEmergencia: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ultimaVisita: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Cliente',
    tableName: 'clientes',
    timestamps: true,
    indexes: [
      {
        name: 'idx_cliente_user',
        fields: ['userId']
      },
      {
        name: 'idx_cliente_fecha_registro',
        fields: ['fechaRegistro']
      }
    ]
  });
  
  return Cliente;
};

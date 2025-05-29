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
      type: DataTypes.STRING(9),
      allowNull: false,
      validate: {
        isNumeric: true,
        len: {
          args: [8,9],
          msg: 'El teléfono debe contener entre 8 y 9 dígitos numéricos'
        }
      }
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
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    codigoPostal: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    ocupacion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estadoCivil: {
      type: DataTypes.ENUM('soltero', 'casado', 'divorciado', 'viudo'),
      allowNull: true
    },
    contactoEmergencia: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isValidContacto(value) {
          if (!value) return; // Si es null o undefined, no validar
          
          try {
            const contacto = JSON.parse(value);
            if (!contacto.telefono) return;
            
            // Validar que el teléfono tenga entre 8 y 9 dígitos numéricos
            const telefonoRegex = /^[0-9]{8,9}$/;
            if (!telefonoRegex.test(contacto.telefono)) {
              throw new Error('El teléfono del contacto de emergencia debe contener entre 8 y 9 dígitos numéricos');
            }
          } catch (error) {
            throw new Error(error.message || 'El formato del contacto de emergencia es inválido');
          }
        }
      }
    },    telefonoEmergencia: {
      type: DataTypes.STRING(8),
      allowNull: true, // Changed to true to make it optional
      validate: {
        isOptionalPhone(value) {
          if (!value) return; // Skip validation if empty
          if (!/^[0-9]{8}$/.test(value)) {
            throw new Error('El teléfono debe contener exactamente 8 dígitos numéricos');
          }
        }
      }
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

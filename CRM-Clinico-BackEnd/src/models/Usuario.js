const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class Usuario extends Model {
    static associate(models) {
      // Un usuario puede ser un cliente o un dentista
      Usuario.hasOne(models.Cliente, { foreignKey: 'userId', as: 'cliente' });
      Usuario.hasOne(models.Dentista, { foreignKey: 'userId', as: 'dentista' });
      
      // Un usuario puede tener muchas notificaciones
      Usuario.hasMany(models.Notificacion, { 
        foreignKey: 'usuarioId', 
        as: 'notificaciones' 
      });
      
      // Un usuario puede ser asignado a muchas tareas
      Usuario.hasMany(models.Tarea, {
        foreignKey: 'asignadoA',
        as: 'tareasAsignadas'
      });

      // Un usuario tiene una configuración
      Usuario.hasOne(models.UserSettings, {
        foreignKey: 'userId',
        as: 'settings'
      });
    }
    
    async validarPassword(passwordIngresado) {
      return await bcrypt.compare(passwordIngresado, this.password);
    }
  }
  
  Usuario.init({
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
        notEmpty: { msg: 'El nombre no puede estar vacío' },
        len: {
          args: [2, 100],
          msg: 'El nombre debe tener entre 2 y 100 caracteres'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'email_unico',
        msg: 'El email ya está registrado'
      },
      validate: {
        notNull: { msg: 'El email es obligatorio' },
        isEmail: { msg: 'Debe proporcionar un email válido' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        passwordRequiredIfNotClient(value) {
          if (this.rol !== 'cliente' && !value) {
            throw new Error('La contraseña es obligatoria para administradores y dentistas');
          }
        },
        len: {
          args: [6, 100],
          msg: 'La contraseña debe tener al menos 6 caracteres',
          skipNull: true
        }
      }
    },
    rol: {
      type: DataTypes.ENUM('admin', 'dentista', 'cliente'),
      allowNull: false,
      defaultValue: 'cliente'
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[0-9+\-\s]+$/i,
          msg: 'El teléfono solo puede contener números, +, - y espacios'
        }
      }
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultimoLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true,
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.password) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      }
    }
  });
  
  return Usuario;
};

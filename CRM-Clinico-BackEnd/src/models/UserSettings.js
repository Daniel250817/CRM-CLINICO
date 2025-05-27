const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserSettings extends Model {
    static associate(models) {
      // Relación con Usuario
      UserSettings.belongsTo(models.Usuario, {
        foreignKey: 'userId',
        as: 'usuario'
      });
    }
  }
  
  UserSettings.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark'),
      defaultValue: 'light'
    },
    language: {
      type: DataTypes.STRING(5),
      defaultValue: 'es'
    },
    notificationEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notificationApp: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notificationSMS: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserSettings',
    tableName: 'user_settings',
    timestamps: true
  });
  
  return UserSettings;
}; 
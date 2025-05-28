const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Documento extends Model {
    static associate(models) {
      // Relación con Cliente
      Documento.belongsTo(models.Cliente, {
        foreignKey: 'clienteId',
        as: 'cliente'
      });
    }
  }

  Documento.init({
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
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tamano: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ruta: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Documento',
    tableName: 'documentos',
    timestamps: true
  });

  return Documento;
}; 
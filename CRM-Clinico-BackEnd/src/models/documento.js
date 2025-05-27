module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const Documento = sequelize.define('Documento', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Clientes',
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
    tableName: 'documentos',
    timestamps: true
  });

  return Documento;
}; 
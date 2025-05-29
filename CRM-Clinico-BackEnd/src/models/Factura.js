const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Factura extends Model {
    static associate(models) {
      // Relación con Cita
      Factura.belongsTo(models.Cita, {
        foreignKey: 'citaId',
        as: 'cita'
      });
      
      // Relación con Cliente
      Factura.belongsTo(models.Cliente, {
        foreignKey: 'clienteId',
        as: 'cliente'
      });
      
      // Relación con Dentista
      Factura.belongsTo(models.Dentista, {
        foreignKey: 'dentistaId',
        as: 'dentista'
      });
    }
  }

  Factura.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numeroFactura: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    citaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Citas',
        key: 'id'
      }
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clientes',
        key: 'id'
      }
    },
    dentistaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Dentistas',
        key: 'id'
      }
    },
    concepto: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    servicios: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    impuestos: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    estadoPago: {
      type: DataTypes.ENUM('pendiente', 'pagada', 'vencida', 'cancelada'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    metodoPago: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'paypal', 'otro'),
      allowNull: true
    },
    fechaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fechaPago: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Campos PayPal
    paypalOrderId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paypalPaymentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paypalPayerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paypalStatus: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Factura',
    tableName: 'facturas',
    timestamps: true,
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion',
    hooks: {
      beforeCreate: async (factura, options) => {
        if (!factura.numeroFactura) {
          // Generar número de factura automático
          const ahora = new Date();
          const año = ahora.getFullYear();
          const mes = String(ahora.getMonth() + 1).padStart(2, '0');
          const día = String(ahora.getDate()).padStart(2, '0');
          
          // Buscar la última factura del día para obtener el número consecutivo
          const ultimaFactura = await Factura.findOne({
            where: {
              numeroFactura: {
                [sequelize.Sequelize.Op.like]: `FAC-${año}${mes}${día}-%`
              }
            },
            order: [['numeroFactura', 'DESC']]
          });
          
          let contador = 1;
          if (ultimaFactura) {
            const ultimoNumero = ultimaFactura.numeroFactura.split('-')[1];
            const ultimoContador = parseInt(ultimoNumero.slice(-3));
            contador = ultimoContador + 1;
          }
          
          factura.numeroFactura = `FAC-${año}${mes}${día}-${String(contador).padStart(3, '0')}`;
        }
      }
    }
  });

  return Factura;
};

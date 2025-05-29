const db = require('../models');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, ForbiddenError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

// Para PayPal, vamos a usar una configuración más simple por ahora
const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'
};

class FacturaController {
  /**
   * Crear una nueva factura
   */
  static async crearFactura(req, res, next) {
    try {
      const { citaId, servicios, descuento = 0, impuestosPorcentaje = 19 } = req.body;

      // Verificar que la cita existe
      const cita = await db.Cita.findByPk(citaId, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' }
        ]
      });

      if (!cita) {
        return next(new NotFoundError('La cita especificada no existe'));
      }

      // Verificar que los servicios existen y calcular totales
      let subtotal = 0;
      const serviciosFactura = [];

      for (const servicioData of servicios) {
        const servicio = await db.Servicio.findByPk(servicioData.servicioId);
        if (!servicio) {
          return next(new ValidationError(`El servicio con ID ${servicioData.servicioId} no existe`));
        }

        const cantidad = servicioData.cantidad || 1;
        const precio = servicioData.precio || servicio.precio;
        const totalServicio = cantidad * precio;

        serviciosFactura.push({
          servicioId: servicio.id,
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          cantidad,
          precio,
          total: totalServicio
        });

        subtotal += totalServicio;
      }

      // Calcular totales
      const montoDescuento = subtotal * (descuento / 100);
      const baseImponible = subtotal - montoDescuento;
      const impuestos = baseImponible * (impuestosPorcentaje / 100);
      const total = baseImponible + impuestos;

      // Establecer fecha de vencimiento (30 días por defecto)
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

      const factura = await db.Factura.create({
        citaId: cita.id,
        clienteId: cita.clienteId,
        dentistaId: cita.dentistaId,
        servicios: serviciosFactura,
        subtotal,
        impuestos,
        descuento: montoDescuento,
        total,
        fechaVencimiento
      });

      // Obtener la factura completa con relaciones
      const facturaCompleta = await db.Factura.findByPk(factura.id, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' },
          { model: db.Cita, as: 'cita' }
        ]
      });

      res.status(201).json({
        status: 'success',
        data: facturaCompleta
      });
    } catch (error) {
      logger.error(`Error al crear factura: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener todas las facturas
   */
  static async obtenerFacturas(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        fechaInicio, 
        fechaFin,
        clienteId,
        dentistaId 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (estado) whereClause.estado = estado;
      if (clienteId) whereClause.clienteId = clienteId;
      if (dentistaId) whereClause.dentistaId = dentistaId;      if (fechaInicio && fechaFin) {
        whereClause.fechaCreacion = {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
      }

      const { count, rows: facturas } = await db.Factura.findAndCountAll({
        where: whereClause,
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' },
          { model: db.Cita, as: 'cita' }
        ],
        order: [['fechaCreacion', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        status: 'success',
        data: {
          facturas,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error(`Error al obtener facturas: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener una factura por ID
   */
  static async obtenerFacturaPorId(req, res, next) {
    try {
      const { id } = req.params;

      const factura = await db.Factura.findByPk(id, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { 
            model: db.Dentista, 
            as: 'dentista',
            include: [{ model: db.Usuario, as: 'usuario' }]
          },
          { model: db.Cita, as: 'cita' }
        ]
      });

      if (!factura) {
        return next(new NotFoundError('Factura no encontrada'));
      }

      res.status(200).json({
        status: 'success',
        data: factura
      });
    } catch (error) {
      logger.error(`Error al obtener factura: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar estado de factura
   */
  static async actualizarEstadoFactura(req, res, next) {
    try {
      const { id } = req.params;
      const { estado, metodoPago, transaccionId } = req.body;

      const factura = await db.Factura.findByPk(id);

      if (!factura) {
        return next(new NotFoundError('Factura no encontrada'));
      }

      const updateData = { estado };

      if (estado === 'pagada') {
        updateData.fechaPago = new Date();
        if (metodoPago) updateData.metodoPago = metodoPago;
        if (transaccionId) updateData.transaccionId = transaccionId;
      }

      await factura.update(updateData);

      const facturaActualizada = await db.Factura.findByPk(id, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' },
          { model: db.Cita, as: 'cita' }
        ]
      });

      res.status(200).json({
        status: 'success',
        data: facturaActualizada
      });
    } catch (error) {
      logger.error(`Error al actualizar estado de factura: ${error}`);
      next(error);
    }
  }  /**
   * Crear orden de PayPal
   */
  static async crearOrdenPayPal(req, res, next) {
    try {
      const { id } = req.params;

      const factura = await db.Factura.findByPk(id, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' }
        ]
      });

      if (!factura) {
        return next(new NotFoundError('Factura no encontrada'));
      }

      if (factura.estadoPago === 'pagada') {
        return next(new ValidationError('Esta factura ya ha sido pagada'));
      }

      // Por ahora, simular la creación de orden PayPal
      const orderID = `PAYPAL_ORDER_${Date.now()}_${factura.id}`;
      
      // Actualizar factura con el orderID temporal
      await factura.update({
        paypalOrderId: orderID
      });

      res.status(200).json({
        status: 'success',
        data: {
          orderID: orderID,
          status: 'CREATED',
          links: []
        }
      });
    } catch (error) {
      logger.error(`Error al crear orden PayPal: ${error}`);
      next(error);
    }
  }

  /**
   * Capturar pago de PayPal
   */
  static async capturarPagoPayPal(req, res, next) {
    try {
      const { id } = req.params;
      const { paypalOrderId, transaccionId } = req.body;

      const factura = await db.Factura.findByPk(id);

      if (!factura) {
        return next(new NotFoundError('Factura no encontrada'));
      }

      if (factura.estado === 'pagada') {
        return next(new ValidationError('Esta factura ya ha sido pagada'));
      }

      // Capturar el pago en PayPal
      const request = {
        id: paypalOrderId
      };

      const response = await paypalClient.orders.capture(request);

      if (response.status === 'COMPLETED') {
        // Actualizar factura con información de PayPal
        await factura.update({
          estado: 'pagada',
          metodoPago: 'paypal',
          paypalOrderId,
          transaccionId: transaccionId || response.id,
          fechaPago: new Date()
        });

        const facturaActualizada = await db.Factura.findByPk(id, {
          include: [
            { model: db.Cliente, as: 'cliente' },
            { model: db.Dentista, as: 'dentista' },
            { model: db.Cita, as: 'cita' }
          ]
        });

        res.status(200).json({
          status: 'success',
          message: 'Pago procesado exitosamente',
          data: facturaActualizada,
          paypalResponse: response
        });
      } else {
        return next(new ValidationError('El pago no pudo ser procesado'));
      }
    } catch (error) {
      logger.error(`Error al capturar pago PayPal: ${error}`);
      next(error);
    }
  }

  /**
   * Procesar pago con PayPal (método legacy)
   */
  static async procesarPagoPayPal(req, res, next) {
    try {
      const { id } = req.params;
      const { paypalOrderId } = req.body;

      const factura = await db.Factura.findByPk(id);

      if (!factura) {
        return next(new NotFoundError('Factura no encontrada'));
      }

      if (factura.estado === 'pagada') {
        return next(new ValidationError('Esta factura ya ha sido pagada'));
      }

      // Actualizar factura con información de PayPal
      await factura.update({
        estado: 'pagada',
        metodoPago: 'paypal',
        paypalOrderId,
        transaccionId: paypalOrderId,
        fechaPago: new Date()
      });

      const facturaActualizada = await db.Factura.findByPk(id, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' },
          { model: db.Cita, as: 'cita' }
        ]
      });

      res.status(200).json({
        status: 'success',
        message: 'Pago procesado exitosamente',
        data: facturaActualizada
      });
    } catch (error) {
      logger.error(`Error al procesar pago PayPal: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener estadísticas de facturación
   */  static async obtenerEstadisticasFacturacion(req, res, next) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      
      let whereClause = {};
      if (fechaInicio && fechaFin) {
        whereClause.fechaCreacion = {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
      }      // Use estadoPago instead of estado to match the column name in the database
      const estadisticas = await db.Factura.findAll({
        where: whereClause,
        attributes: [
          'estadoPago', // Changed from 'estado' to 'estadoPago' to match the database schema
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cantidad'],
          [db.sequelize.fn('SUM', db.sequelize.col('total')), 'total']
        ],
        group: ['estadoPago']
      });

      // Convert to the format expected by the frontend
      const estadisticasMapeadas = estadisticas.map(item => ({
        estado: item.estadoPago, // Map estadoPago to estado for frontend compatibility
        cantidad: item.dataValues.cantidad,
        total: item.dataValues.total
      }));

      const totalFacturas = await db.Factura.count({ where: whereClause });
      const totalIngresos = await db.Factura.sum('total', { 
        where: { ...whereClause, estadoPago: 'pagada' } // Changed from 'estado' to 'estadoPago'
      });      res.status(200).json({
        status: 'success',
        data: {
          estadisticas: estadisticasMapeadas,
          resumen: {
            totalFacturas,
            totalIngresos: totalIngresos || 0
          }
        }
      });
    } catch (error) {      logger.error(`Error al obtener estadísticas de facturación: ${error}`);
      next(error);
    }
  }

  /**
   * Marcar factura como pagada (para métodos de pago no digitales)
   */
  static async marcarComoPagada(req, res, next) {
    try {
      const { id } = req.params;
      const { metodoPago, transaccionId } = req.body;

      const factura = await db.Factura.findByPk(id);

      if (!factura) {
        return next(new NotFoundError('Factura no encontrada'));
      }

      if (factura.estado === 'pagada') {
        return next(new ValidationError('Esta factura ya ha sido pagada'));
      }

      if (!['efectivo', 'tarjeta', 'transferencia'].includes(metodoPago)) {
        return next(new ValidationError('Método de pago no válido'));
      }

      await factura.update({
        estado: 'pagada',
        metodoPago,
        transaccionId: transaccionId || `MANUAL_${Date.now()}`,
        fechaPago: new Date()
      });

      const facturaActualizada = await db.Factura.findByPk(id, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' },
          { model: db.Cita, as: 'cita' }
        ]
      });

      res.status(200).json({
        status: 'success',
        message: 'Factura marcada como pagada exitosamente',
        data: facturaActualizada
      });
    } catch (error) {
      logger.error(`Error al marcar factura como pagada: ${error}`);
      next(error);
    }
  }

  /**
   * Cancelar factura
   */
  static async cancelarFactura(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const factura = await db.Factura.findByPk(id);

      if (!factura) {
        return next(new NotFoundError('Factura no encontrada'));
      }

      if (factura.estado === 'pagada') {
        return next(new ValidationError('No se puede cancelar una factura que ya ha sido pagada'));
      }

      if (factura.estado === 'cancelada') {
        return next(new ValidationError('Esta factura ya ha sido cancelada'));
      }

      await factura.update({
        estado: 'cancelada',
        notas: factura.notas ? `${factura.notas}\n\nMotivo de cancelación: ${motivo}` : `Motivo de cancelación: ${motivo}`
      });

      const facturaActualizada = await db.Factura.findByPk(id, {
        include: [
          { model: db.Cliente, as: 'cliente' },
          { model: db.Dentista, as: 'dentista' },
          { model: db.Cita, as: 'cita' }
        ]
      });

      res.status(200).json({
        status: 'success',
        message: 'Factura cancelada exitosamente',
        data: facturaActualizada
      });
    } catch (error) {
      logger.error(`Error al cancelar factura: ${error}`);
      next(error);
    }
  }
}

module.exports = FacturaController;

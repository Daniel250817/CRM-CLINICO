const db = require('../models');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { Op, Sequelize } = require('sequelize');

// Añadimos Sequelize al objeto db para facilitar su uso
db.Sequelize = Sequelize;

// Para PayPal, vamos a usar una configuración más simple por ahora
const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'
};

class FacturaController {  /**
   * Crear una nueva factura
   */
  static async crearFactura(req, res, next) {
    try {
      console.log('Datos recibidos en el backend:', req.body);
      
      const { 
        citaId, 
        clienteId, 
        dentistaId, 
        servicios, 
        descuento = 0, 
        fechaVencimiento,
        notas = ''
      } = req.body;

      // Validaciones básicas
      if (!citaId || !clienteId || !dentistaId) {
        return next(new ValidationError('Se requiere citaId, clienteId y dentistaId'));
      }

      if (!servicios || !Array.isArray(servicios) || servicios.length === 0) {
        return next(new ValidationError('Se requiere al menos un servicio'));
      }

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

      // Verificar que el cliente existe
      const cliente = await db.Cliente.findByPk(clienteId);
      if (!cliente) {
        return next(new NotFoundError('El cliente especificado no existe'));
      }

      // Verificar que el dentista existe
      const dentista = await db.Dentista.findByPk(dentistaId);
      if (!dentista) {
        return next(new NotFoundError('El dentista especificado no existe'));
      }

      // Verificar que los servicios existen y calcular totales
      let subtotal = 0;
      const serviciosFactura = [];

      for (const servicioData of servicios) {
        // El frontend envía 'id' en lugar de 'servicioId'
        const servicioId = servicioData.id;
        
        if (!servicioId) {
          return next(new ValidationError('Cada servicio debe tener un ID válido'));
        }

        const servicio = await db.Servicio.findByPk(servicioId);
        if (!servicio) {
          return next(new ValidationError(`El servicio con ID ${servicioId} no existe`));
        }

        const cantidad = servicioData.cantidad || 1;
        const precio = servicioData.precio || servicio.precio;
        const totalServicio = cantidad * precio;

        serviciosFactura.push({
          servicioId: servicio.id,
          nombre: servicio.nombre,
          descripcion: servicio.descripcion || servicioData.descripcion,
          cantidad,
          precio,
          total: totalServicio
        });

        subtotal += totalServicio;
      }

      // Calcular impuestos (15% por defecto)
      const impuestos = subtotal * 0.15;
      
      // El descuento ya viene calculado desde el frontend en valor absoluto
      const montoDescuento = typeof descuento === 'number' ? descuento : 0;
      
      // Calcular total
      const total = subtotal + impuestos - montoDescuento;

      // Usar fecha de vencimiento del frontend o establecer 30 días por defecto
      let fechaVenc = fechaVencimiento;
      if (!fechaVenc) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + 30);
        fechaVenc = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }

      // Generar concepto automáticamente
      const concepto = `Servicios dentales - ${serviciosFactura.map(s => s.nombre).join(', ')}`;      // Generar número de factura
      const ahora = new Date();
      const año = ahora.getFullYear();
      const mes = String(ahora.getMonth() + 1).padStart(2, '0');
      const día = String(ahora.getDate()).padStart(2, '0');
      
      let numeroFactura;
      try {
        // Buscar la última factura del día para obtener el número consecutivo
        const ultimaFactura = await db.Factura.findOne({
          where: {
            numeroFactura: {
              [db.Sequelize.Op.like]: `FAC-${año}${mes}${día}-%`
            }
          },
          order: [['numeroFactura', 'DESC']]
        });
        
        let contador = 1;
        if (ultimaFactura) {
          // Extraer el contador de la última parte del número de factura
          const partes = ultimaFactura.numeroFactura.split('-');
          const ultimaParte = partes[partes.length - 1];
          const ultimoContador = parseInt(ultimaParte);
          
          // Verificar que sea un número válido
          if (!isNaN(ultimoContador)) {
            contador = ultimoContador + 1;
          }
        }
        
        numeroFactura = `FAC-${año}${mes}${día}-${String(contador).padStart(3, '0')}`;
      } catch (err) {
        logger.error(`Error al generar número de factura: ${err.message}`);
        // Generar un número aleatorio como fallback para evitar errores
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        numeroFactura = `FAC-${año}${mes}${día}-${random}`;
      }
      const factura = await db.Factura.create({
        numeroFactura,
        citaId: cita.id,
        clienteId: clienteId,
        dentistaId: dentistaId,
        concepto: concepto,
        servicios: serviciosFactura,
        subtotal: parseFloat(subtotal.toFixed(2)),
        impuestos: parseFloat(impuestos.toFixed(2)),
        descuento: parseFloat(montoDescuento.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        fechaVencimiento: fechaVenc,
        notas: notas || '',
        estadoPago: 'pendiente'
      });

      // Obtener la factura completa con relaciones
      const facturaCompleta = await db.Factura.findByPk(factura.id, {
        include: [
          { 
            model: db.Cliente, 
            as: 'cliente',
            include: [{ model: db.Usuario, as: 'usuario' }]
          },
          { 
            model: db.Dentista, 
            as: 'dentista',
            include: [{ model: db.Usuario, as: 'usuario' }]
          },
          { model: db.Cita, as: 'cita' }
        ]
      });

      console.log('Factura creada exitosamente:', facturaCompleta.id);

      res.status(201).json({
        status: 'success',
        data: facturaCompleta
      });
    } catch (error) {
      console.error('Error detallado al crear factura:', error);
      logger.error(`Error al crear factura: ${error.message}`);
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

      if (estado) whereClause.estadoPago = estado;
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

  /**
   * Obtener facturas agrupadas por mes
   */
  static async obtenerFacturasPorMes(req, res, next) {
    try {
      const { anio } = req.query;
      const currentYear = anio ? parseInt(anio) : new Date().getFullYear();
      
      // Obtener los últimos 6 meses de facturas agrupadas por mes
      const facturasPorMes = await db.sequelize.query(`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') AS yearMonth,
          DATE_FORMAT(createdAt, '%M') AS mes,
          COUNT(*) AS cantidad,
          SUM(total) AS total
        FROM facturas
        WHERE 
          YEAR(createdAt) = :currentYear
        GROUP BY yearMonth, mes
        ORDER BY yearMonth DESC
        LIMIT 6
      `, {
        replacements: { currentYear },
        type: db.sequelize.QueryTypes.SELECT
      });

      // Ordenar por mes cronológicamente (de más antiguo a más reciente)
      const facturasPorMesOrdenadas = [...facturasPorMes].reverse();
      
      res.status(200).json({
        status: 'success',
        data: facturasPorMesOrdenadas
      });
    } catch (error) {
      logger.error(`Error al obtener facturas por mes: ${error}`);
      next(error);
    }
  }
}

module.exports = FacturaController;

const express = require('express');
const facturaController = require('../controllers/facturaController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

/**
 * @swagger
 * /api/facturas:
 *   get:
 *     summary: Obtener todas las facturas
 *     tags: [Facturas]
 *     description: Obtiene una lista paginada de facturas con filtros opcionales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de facturas por página
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, pagada, cancelada, vencida]
 *         description: Filtrar por estado
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente
 *       - in: query
 *         name: dentistaId
 *         schema:
 *           type: integer
 *         description: Filtrar por dentista
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar
 *     responses:
 *       200:
 *         description: Lista de facturas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     facturas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Factura'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', facturaController.obtenerFacturas);

/**
 * @swagger
 * /api/facturas/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de facturación
 *     tags: [Facturas]
 *     description: Obtiene estadísticas de facturación por estado y período
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para el período
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para el período
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     estadisticas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           estado:
 *                             type: string
 *                           cantidad:
 *                             type: integer
 *                           total:
 *                             type: number
 *                     resumen:
 *                       type: object
 *                       properties:
 *                         totalFacturas:
 *                           type: integer
 *                         totalIngresos:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/estadisticas', restringirA('admin', 'dentista'), facturaController.obtenerEstadisticasFacturacion);

/**
 * @swagger
 * /api/facturas/{id}:
 *   get:
 *     summary: Obtener una factura por ID
 *     tags: [Facturas]
 *     description: Obtiene los detalles completos de una factura específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', facturaController.obtenerFacturaPorId);

/**
 * @swagger
 * /api/facturas:
 *   post:
 *     summary: Crear una nueva factura
 *     tags: [Facturas]
 *     description: Crea una nueva factura basada en una cita y servicios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - citaId
 *               - servicios
 *             properties:
 *               citaId:
 *                 type: integer
 *                 description: ID de la cita asociada
 *               servicios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     servicioId:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *                       default: 1
 *                     precio:
 *                       type: number
 *                       description: Precio personalizado (opcional)
 *               descuento:
 *                 type: number
 *                 default: 0
 *                 description: Porcentaje de descuento
 *               impuestosPorcentaje:
 *                 type: number
 *                 default: 19
 *                 description: Porcentaje de impuestos
 *     responses:
 *       201:
 *         description: Factura creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', restringirA('admin', 'dentista'), facturaController.crearFactura);

/**
 * @swagger
 * /api/facturas/{id}/estado:
 *   patch:
 *     summary: Actualizar estado de una factura
 *     tags: [Facturas]
 *     description: Actualiza el estado de una factura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, pagada, cancelada, vencida]
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, paypal, transferencia]
 *               transaccionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado de factura actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/estado', restringirA('admin', 'dentista'), facturaController.actualizarEstadoFactura);

/**
 * @swagger
 * /api/facturas/{id}/pago-paypal:
 *   post:
 *     summary: Procesar pago con PayPal
 *     tags: [Facturas]
 *     description: Procesa el pago de una factura usando PayPal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paypalOrderId
 *             properties:
 *               paypalOrderId:
 *                 type: string
 *                 description: ID de la orden de PayPal
 *     responses:
 *       200:
 *         description: Pago procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Pago procesado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/pago-paypal', facturaController.procesarPagoPayPal);

// Nuevas rutas para PayPal
/**
 * @swagger
 * /api/facturas/{id}/paypal/create-order:
 *   post:
 *     summary: Crear orden de PayPal
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Orden de PayPal creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderID:
 *                       type: string
 *                     status:
 *                       type: string
 *                     links:
 *                       type: array
 */
router.post('/:id/paypal/create-order', facturaController.crearOrdenPayPal);

/**
 * @swagger
 * /api/facturas/{id}/paypal/capture:
 *   post:
 *     summary: Capturar pago de PayPal
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paypalOrderId
 *               - transaccionId
 *             properties:
 *               paypalOrderId:
 *                 type: string
 *                 description: ID de la orden de PayPal
 *               transaccionId:
 *                 type: string
 *                 description: ID de la transacción
 *     responses:
 *       200:
 *         description: Pago capturado exitosamente
 */
router.post('/:id/paypal/capture', facturaController.capturarPagoPayPal);

/**
 * @swagger
 * /api/facturas/{id}/mark-paid:
 *   post:
 *     summary: Marcar factura como pagada
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metodoPago
 *             properties:
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia]
 *               transaccionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Factura marcada como pagada exitosamente
 */
router.post('/:id/mark-paid', facturaController.marcarComoPagada);

/**
 * @swagger
 * /api/facturas/{id}/cancel:
 *   post:
 *     summary: Cancelar factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la factura
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 description: Motivo de la cancelación
 *     responses:
 *       200:
 *         description: Factura cancelada exitosamente
 */
router.post('/:id/cancel', facturaController.cancelarFactura);

/**
 * @swagger
 * /api/facturas/por-mes:
 *   get:
 *     summary: Obtener facturas agrupadas por mes
 *     tags: [Facturas]
 *     description: Retorna datos de facturación agrupados por mes para los últimos 6 meses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         required: false
 *         description: Año para el que se quieren obtener los datos (opcional, por defecto es el año actual)
 *     responses:
 *       200:
 *         description: Datos de facturación agrupados por mes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mes:
 *                         type: string
 *                       yearMonth:
 *                         type: string
 *                       cantidad:
 *                         type: integer
 *                       total:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/por-mes', restringirA('admin', 'dentista'), facturaController.obtenerFacturasPorMes);

module.exports = router;

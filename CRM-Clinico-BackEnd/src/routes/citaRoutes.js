const express = require('express');
const citaController = require('../controllers/citaController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { citaSchemas } = require('../utils/validaciones');

const router = express.Router();

/**
 * @swagger
 * /api/citas:
 *   get:
 *     summary: Obtener todas las citas
 *     tags: [Citas]
 *     description: Retorna una lista de citas con opciones de filtrado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dentista
 *         schema:
 *           type: string
 *         description: ID del dentista para filtrar sus citas
 *       - in: query
 *         name: cliente
 *         schema:
 *           type: string
 *         description: ID del cliente para filtrar sus citas
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha específica para filtrar citas (YYYY-MM-DD)
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, confirmada, cancelada, completada]
 *         description: Estado de las citas a filtrar
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha inicial para filtrar citas
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha final para filtrar citas
 *     responses:
 *       200:
 *         description: Lista de citas obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cita'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', protegerRuta, citaController.obtenerCitas);

/**
 * @swagger
 * /api/citas:
 *   post:
 *     summary: Crear una nueva cita
 *     tags: [Citas]
 *     description: |
 *       Crea una nueva cita verificando la disponibilidad del dentista.
 *       La cita debe estar dentro del horario de trabajo del dentista.
 *       Se recomienda verificar primero la disponibilidad del dentista usando el endpoint GET /api/citas/dentista/{id}/disponibilidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clienteId
 *               - dentistaId
 *               - servicioId
 *               - fechaHora
 *             properties:
 *               clienteId:
 *                 type: integer
 *                 description: ID del cliente
 *                 example: 2
 *               dentistaId:
 *                 type: integer
 *                 description: ID del dentista
 *                 example: 3
 *               servicioId:
 *                 type: integer
 *                 description: ID del servicio
 *                 example: 3
 *               fechaHora:
 *                 type: string
 *                 format: date-time
 *                 description: |
 *                   Fecha y hora de la cita (formato ISO).
 *                   Debe estar dentro del horario de trabajo del dentista.
 *                   Por ejemplo, si el dentista trabaja de 09:00 a 14:00,
 *                   la cita debe estar en ese rango horario.
 *                 example: "2025-05-28T09:30:00.000Z"
 *               duracion:
 *                 type: integer
 *                 description: |
 *                   Duración en minutos (opcional, por defecto según el servicio).
 *                   La cita completa debe estar dentro del horario de trabajo.
 *                 example: 60
 *               notas:
 *                 type: string
 *                 description: Notas adicionales sobre la cita
 *                 example: "Cita de limpieza dental"
 *               estado:
 *                 type: string
 *                 enum: [pendiente, confirmada]
 *                 default: pendiente
 *                 description: Estado inicial de la cita
 *                 example: "pendiente"
 *     responses:
 *       201:
 *         description: Cita creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       400:
 *         description: Datos inválidos o dentista no disponible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: El dentista no está disponible en el horario seleccionado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflicto de horario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Ya existe una cita programada en ese horario
 */
router.post('/', protegerRuta, validarDatos(citaSchemas.crearCita), citaController.crearCita);

/**
 * @swagger
 * /api/citas/{id}:
 *   get:
 *     summary: Obtener una cita por ID
 *     tags: [Citas]
 *     description: Retorna los detalles de una cita específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Detalles de la cita obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', protegerRuta, citaController.obtenerCitaPorId);

/**
 * @swagger
 * /api/citas/{id}/estado:
 *   patch:
 *     summary: Actualizar estado de una cita
 *     tags: [Citas]
 *     description: Actualiza el estado de una cita existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cita
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
 *                 enum: [pendiente, confirmada, cancelada, completada]
 *                 description: Nuevo estado de la cita
 *               notas:
 *                 type: string
 *                 description: Notas adicionales sobre el cambio de estado
 *     responses:
 *       200:
 *         description: Estado de la cita actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       400:
 *         description: Estado inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Estado no válido
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/estado', protegerRuta, validarDatos(citaSchemas.actualizarEstado), citaController.actualizarEstadoCita);

/**
 * @swagger
 * /api/citas/dentista/{id}/disponibilidad:
 *   get:
 *     summary: Obtener disponibilidad de un dentista
 *     tags: [Citas]
 *     description: Retorna los slots disponibles para un dentista en una fecha específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dentista
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para consultar disponibilidad (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Disponibilidad obtenida correctamente
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
 *                     fecha:
 *                       type: string
 *                       format: date
 *                     horarioTrabajo:
 *                       type: object
 *                       properties:
 *                         lunes:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               inicio:
 *                                 type: string
 *                                 example: "09:00"
 *                               fin:
 *                                 type: string
 *                                 example: "14:00"
 *                     slotsDisponibles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           inicio:
 *                             type: string
 *                             format: date-time
 *                           fin:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/dentista/:id/disponibilidad', protegerRuta, citaController.obtenerDisponibilidadDentista);

/**
 * @swagger
 * /api/citas/{id}/fecha:
 *   patch:
 *     summary: Actualizar fecha y hora de una cita
 *     tags: [Citas]
 *     description: Actualiza la fecha, hora y opcionalmente la duración de una cita existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fechaHora
 *             properties:
 *               fechaHora:
 *                 type: string
 *                 format: date-time
 *                 description: Nueva fecha y hora de la cita (formato ISO)
 *               duracion:
 *                 type: integer
 *                 description: Nueva duración en minutos (opcional)
 *     responses:
 *       200:
 *         description: Fecha y hora de la cita actualizadas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Cita'
 *       400:
 *         description: Horario no disponible o conflicto con otra cita
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/fecha', protegerRuta, citaController.actualizarFechaHoraCita);

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Actualizar estado de cita (accesible para todos los roles autenticados)
router.patch('/:id/estado', validarDatos(citaSchemas.actualizarEstado), citaController.actualizarEstadoCita);

module.exports = router;

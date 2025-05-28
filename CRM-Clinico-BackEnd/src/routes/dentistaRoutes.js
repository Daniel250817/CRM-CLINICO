const express = require('express');
const dentistaController = require('../controllers/dentistaController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { dentistaSchemas } = require('../utils/validaciones');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

/**
 * @swagger
 * /api/dentistas:
 *   get:
 *     summary: Obtener todos los dentistas
 *     tags: [Dentistas]
 *     description: Retorna una lista de todos los dentistas registrados en el sistema
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de dentistas obtenida correctamente
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
 *                     $ref: '#/components/schemas/Dentista'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', dentistaController.obtenerTodosLosDentistas);

/**
 * @swagger
 * /api/dentistas/especialidades:
 *   get:
 *     summary: Obtener todas las especialidades
 *     tags: [Dentistas]
 *     description: Retorna una lista de todas las especialidades disponibles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de especialidades obtenida correctamente
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
 *                     type: string
 *                     example: ["Ortodoncia", "Endodoncia", "Periodoncia"]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/especialidades', dentistaController.obtenerEspecialidades);

/**
 * @swagger
 * /api/dentistas/{id}/disponibilidad:
 *   get:
 *     summary: Obtener disponibilidad de un dentista
 *     tags: [Dentistas]
 *     description: Retorna la disponibilidad horaria de un dentista específico para una fecha específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del dentista
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para consultar disponibilidad (YYYY-MM-DD)
 *         example: "2024-03-20"
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
 *                       example: "2024-03-20"
 *                     horarioTrabajo:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           inicio:
 *                             type: string
 *                             example: "09:00"
 *                           fin:
 *                             type: string
 *                             example: "18:00"
 *                     slotsDisponibles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           inicio:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-03-20T09:00:00Z"
 *                           fin:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-03-20T09:30:00Z"
 *       400:
 *         description: Parámetros de fecha inválidos
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
 *                   example: "Debe proporcionar una fecha"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/disponibilidad', dentistaController.obtenerDisponibilidad);

/**
 * @swagger
 * /api/dentistas/perfil:
 *   get:
 *     summary: Obtener perfil del dentista actual
 *     tags: [Dentistas]
 *     description: Retorna el perfil completo del dentista autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dentista'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/perfil', restringirA('dentista'), dentistaController.obtenerPerfil);

/**
 * @swagger
 * /api/dentistas/perfil:
 *   patch:
 *     summary: Actualizar perfil del dentista actual
 *     tags: [Dentistas]
 *     description: Actualiza la información del perfil del dentista autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dentista'
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dentista'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/perfil', restringirA('dentista'), validarDatos(dentistaSchemas.crearDentista), dentistaController.actualizarDentista);

/**
 * @swagger
 * /api/dentistas:
 *   post:
 *     summary: Crear un nuevo dentista
 *     tags: [Dentistas]
 *     description: Crea un nuevo registro de dentista (solo admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dentista'
 *     responses:
 *       201:
 *         description: Dentista creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dentista'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', restringirA('admin'), validarDatos(dentistaSchemas.crearDentista), dentistaController.crearDentista);

/**
 * @swagger
 * /api/dentistas/{id}:
 *   patch:
 *     summary: Actualizar un dentista
 *     tags: [Dentistas]
 *     description: Actualiza la información de un dentista específico (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del dentista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dentista'
 *     responses:
 *       200:
 *         description: Dentista actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dentista'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', restringirA('admin'), validarDatos(dentistaSchemas.crearDentista), dentistaController.actualizarDentista);

module.exports = router;

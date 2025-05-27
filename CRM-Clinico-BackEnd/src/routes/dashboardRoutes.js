const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protegerRuta } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/estadisticas:
 *   get:
 *     summary: Obtiene estadísticas generales para el dashboard
 *     tags: [Dashboard]
 *     description: Devuelve estadísticas generales de la clínica para el dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estadisticas:
 *                   type: object
 *                   properties:
 *                     resumen:
 *                       type: object
 *                       properties:
 *                         totalClientes:
 *                           type: integer
 *                         totalCitas:
 *                           type: integer
 *                         totalDentistas:
 *                           type: integer
 *                         citasPendientes:
 *                           type: integer
 *                         ingresosTotales:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/estadisticas', protegerRuta, dashboardController.obtenerEstadisticasGenerales);

/**
 * @swagger
 * /api/dashboard/dentista/{id}:
 *   get:
 *     summary: Obtiene estadísticas de un dentista
 *     tags: [Dashboard]
 *     description: Devuelve estadísticas específicas de un dentista
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del dentista
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/dentista/:id', protegerRuta, dashboardController.obtenerEstadisticasDentista);

/**
 * @swagger
 * /api/dashboard/cliente/{id}:
 *   get:
 *     summary: Obtiene estadísticas de un cliente
 *     tags: [Dashboard]
 *     description: Devuelve estadísticas específicas de un cliente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/cliente/:id', protegerRuta, dashboardController.obtenerEstadisticasCliente);

/**
 * @swagger
 * /api/dashboard/prevision-ingresos:
 *   get:
 *     summary: Obtiene previsión de ingresos
 *     tags: [Dashboard]
 *     description: Devuelve una proyección de ingresos para los próximos meses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Previsión obtenida correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/prevision-ingresos', protegerRuta, dashboardController.obtenerPrevisionIngresos);

module.exports = router;

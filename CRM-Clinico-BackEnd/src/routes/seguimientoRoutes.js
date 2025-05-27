const express = require('express');
const seguimientoController = require('../controllers/seguimientoController');
const { protegerRuta, restringirA } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y ser admin o dentista
router.use(protegerRuta);
router.use(restringirA('admin', 'dentista'));

/**
 * @swagger
 * /api/seguimiento/pacientes-recurrentes:
 *   get:
 *     summary: Obtiene pacientes recurrentes
 *     tags: [Seguimiento]
 *     description: Devuelve lista de pacientes recurrentes que han tenido más de N visitas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minVisitas
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Número mínimo de visitas para considerar un paciente como recurrente
 *     responses:
 *       200:
 *         description: Lista de pacientes recurrentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 pacientes:
 *                   type: array
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/pacientes-recurrentes', seguimientoController.obtenerPacientesRecurrentes);

/**
 * @swagger
 * /api/seguimiento/pacientes-inactivos:
 *   get:
 *     summary: Obtiene pacientes inactivos
 *     tags: [Seguimiento]
 *     description: Devuelve lista de pacientes que no han tenido visitas en los últimos N días
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Días sin visita para considerar a un paciente como inactivo
 *     responses:
 *       200:
 *         description: Lista de pacientes inactivos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 diasSinVisita:
 *                   type: integer
 *                 pacientes:
 *                   type: array
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/pacientes-inactivos', seguimientoController.obtenerPacientesInactivos);

/**
 * @swagger
 * /api/seguimiento/cliente/{id}/patron-visitas:
 *   get:
 *     summary: Analiza el patrón de visitas de un cliente
 *     tags: [Seguimiento]
 *     description: Devuelve un análisis detallado del patrón de visitas de un cliente específico
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
 *         description: Análisis del patrón de visitas
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/cliente/:id/patron-visitas', seguimientoController.analizarPatronVisitas);

/**
 * @swagger
 * /api/seguimiento/cliente/{id}/recomendaciones:
 *   get:
 *     summary: Genera recomendaciones para un cliente
 *     tags: [Seguimiento]
 *     description: Genera recomendaciones personalizadas para un cliente basado en su historial
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
 *         description: Recomendaciones para el cliente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/cliente/:id/recomendaciones', seguimientoController.generarRecomendaciones);

module.exports = router;

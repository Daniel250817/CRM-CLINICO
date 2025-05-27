const express = require('express');
const userSettingsController = require('../controllers/userSettingsController');
const { protegerRuta } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { userSettingsSchemas } = require('../utils/validaciones');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Obtiene la configuración del usuario actual
 *     tags: [Settings]
 *     description: Obtiene la configuración personalizada del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSettings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', userSettingsController.obtenerSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Actualiza la configuración del usuario
 *     tags: [Settings]
 *     description: Actualiza la configuración personalizada del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *               language:
 *                 type: string
 *               notificationEmail:
 *                 type: boolean
 *               notificationApp:
 *                 type: boolean
 *               notificationSMS:
 *                 type: boolean
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSettings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/', validarDatos(userSettingsSchemas.actualizarSettings), userSettingsController.actualizarSettings);

module.exports = router; 
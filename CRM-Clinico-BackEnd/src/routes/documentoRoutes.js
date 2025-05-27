const express = require('express');
const documentoController = require('../controllers/documentoController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { uploadDocument } = require('../middlewares/fileUpload');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

/**
 * @swagger
 * /api/clientes/{clienteId}/documentos:
 *   get:
 *     summary: Obtiene todos los documentos de un cliente
 *     tags: [Documentos]
 *     description: Devuelve una lista de todos los documentos asociados a un cliente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Lista de documentos
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:clienteId/documentos', documentoController.obtenerDocumentosCliente);

/**
 * @swagger
 * /api/clientes/{clienteId}/documentos:
 *   post:
 *     summary: Sube un nuevo documento para un cliente
 *     tags: [Documentos]
 *     description: Sube un nuevo documento y lo asocia a un cliente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Documento creado correctamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:clienteId/documentos', uploadDocument.single('file'), documentoController.subirDocumento);

/**
 * @swagger
 * /api/documentos/{documentoId}:
 *   delete:
 *     summary: Elimina un documento
 *     tags: [Documentos]
 *     description: Elimina un documento específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento eliminado correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:documentoId', documentoController.eliminarDocumento);

module.exports = router; 
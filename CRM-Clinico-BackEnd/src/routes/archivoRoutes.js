const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');
const { uploadMedicalRecord, uploadXray, handleMulterError } = require('../middlewares/fileUpload');
const { protegerRuta, restringirA } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(protegerRuta);

/**
 * @swagger
 * /api/archivos/medical-records/{clienteId}:
 *   post:
 *     summary: Sube un historial médico para un cliente
 *     tags: [Archivos]
 *     description: Sube un archivo de historial médico para un cliente específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: integer
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
 *                 description: Archivo de historial médico (PDF, DOC, DOCX, TXT, JPG, PNG)
 *     responses:
 *       200:
 *         description: Historial médico subido correctamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/medical-records/:clienteId',
  restringirA('admin', 'dentista'),
  uploadMedicalRecord.single('file'),
  handleMulterError,
  archivoController.uploadMedicalRecord
);

/**
 * @swagger
 * /api/archivos/medical-records/{clienteId}:
 *   get:
 *     summary: Obtiene el historial médico de un cliente
 *     tags: [Archivos]
 *     description: Devuelve el archivo de historial médico de un cliente específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Archivo de historial médico
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/medical-records/:clienteId',
  restringirA('admin', 'dentista'),
  archivoController.getMedicalRecord
);

/**
 * @swagger
 * /api/archivos/xrays/{citaId}:
 *   post:
 *     summary: Sube una radiografía para una cita
 *     tags: [Archivos]
 *     description: Sube un archivo de radiografía para una cita específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cita
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
 *                 description: Archivo de radiografía (JPG, PNG, DICOM)
 *     responses:
 *       200:
 *         description: Radiografía subida correctamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/xrays/:citaId',
  restringirA('admin', 'dentista'),
  uploadXray.single('file'),
  handleMulterError,
  archivoController.uploadXray
);

/**
 * @swagger
 * /api/archivos/xrays/{citaId}:
 *   get:
 *     summary: Obtiene la radiografía de una cita
 *     tags: [Archivos]
 *     description: Devuelve el archivo de radiografía de una cita específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: citaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Archivo de radiografía
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/xrays/:citaId',
  restringirA('admin', 'dentista'),
  archivoController.getXray
);

module.exports = router;

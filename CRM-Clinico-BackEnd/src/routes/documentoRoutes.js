const express = require('express');
const documentoController = require('../controllers/documentoController');
const { protegerRuta } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Eliminar documento por id
router.delete('/:documentoId', documentoController.eliminarDocumento);

// Actualizar documento (nombre y/o archivo)
const { uploadDocument, handleMulterError } = require('../middlewares/fileUpload');
router.patch('/:documentoId', uploadDocument.single('archivo'), handleMulterError, documentoController.actualizarDocumento);

module.exports = router;

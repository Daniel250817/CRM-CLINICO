const express = require('express');
const servicioController = require('../controllers/servicioController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { servicioSchemas } = require('../utils/validaciones');
const { uploadServiceImage, handleMulterError } = require('../middlewares/fileUpload');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas para obtener servicios (cualquier usuario autenticado)
router.get('/', servicioController.obtenerServicios);
router.get('/categorias', servicioController.obtenerCategorias);
router.get('/:id', servicioController.obtenerServicioPorId);

// Rutas para administrar servicios (solo admin)
router.post('/', 
  restringirA('admin'), 
  uploadServiceImage.single('imagen'),
  handleMulterError,
  validarDatos(servicioSchemas.crearServicio), 
  servicioController.crearServicio
);

router.patch('/:id', 
  restringirA('admin'), 
  uploadServiceImage.single('imagen'),
  handleMulterError,
  validarDatos(servicioSchemas.actualizarServicio), 
  servicioController.actualizarServicio
);

router.delete('/:id', 
  restringirA('admin'), 
  servicioController.eliminarServicio
);

module.exports = router;

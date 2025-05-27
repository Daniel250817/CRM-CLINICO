const express = require('express');
const servicioController = require('../controllers/servicioController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { servicioSchemas } = require('../utils/validaciones');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configurar multer para la subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/servicios';
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `servicio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y GIF'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas para obtener servicios (cualquier usuario autenticado)
router.get('/', servicioController.obtenerServicios);
router.get('/categorias', servicioController.obtenerCategorias);
router.get('/:id', servicioController.obtenerServicioPorId);

// Rutas para administrar servicios (solo admin)
router.post('/', 
  restringirA('admin'), 
  upload.single('imagen'),
  validarDatos(servicioSchemas.crearServicio), 
  servicioController.crearServicio
);

router.patch('/:id', 
  restringirA('admin'), 
  upload.single('imagen'),
  validarDatos(servicioSchemas.actualizarServicio), 
  servicioController.actualizarServicio
);

router.delete('/:id', 
  restringirA('admin'), 
  servicioController.eliminarServicio
);

module.exports = router;

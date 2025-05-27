const express = require('express');
const citaController = require('../controllers/citaController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { citaSchemas } = require('../utils/validaciones');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas para crear y obtener citas (accesibles para todos los roles)
router.post('/', validarDatos(citaSchemas.crearCita), citaController.crearCita);
router.get('/', citaController.obtenerCitas);

// Obtener disponibilidad de un dentista (accesible para todos)
router.get('/dentista/:id/disponibilidad', citaController.obtenerDisponibilidadDentista);

// Obtener una cita específica (accesible para todos)
router.get('/:id', citaController.obtenerCitaPorId);

// Actualizar estado de cita (accesible para todos los roles autenticados)
router.patch('/:id/estado', validarDatos(citaSchemas.actualizarEstado), citaController.actualizarEstadoCita);

module.exports = router;

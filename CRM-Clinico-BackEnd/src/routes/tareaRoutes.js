const express = require('express');
const tareaController = require('../controllers/tareaController');
const { protegerRuta } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { tareaSchemas } = require('../utils/validaciones');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas para gestionar tareas
router.post('/', validarDatos(tareaSchemas.crearTarea), tareaController.crearTarea);
router.get('/', tareaController.obtenerTareas);
router.get('/resumen', tareaController.obtenerResumenTareas);
router.get('/:id', tareaController.obtenerTareaPorId);
router.patch('/:id', validarDatos(tareaSchemas.crearTarea), tareaController.actualizarTarea);
router.delete('/:id', tareaController.eliminarTarea);
router.patch('/:id/estado', validarDatos(tareaSchemas.actualizarEstado), tareaController.actualizarEstadoTarea);

module.exports = router; 
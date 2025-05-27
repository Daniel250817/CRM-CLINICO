const express = require('express');
const clienteController = require('../controllers/clienteController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos, validarId } = require('../middlewares/validacion');
const { clienteSchemas } = require('../utils/validaciones');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Ruta para obtener todos los clientes (admin y dentistas)
router.get('/', clienteController.obtenerTodosLosClientes);

// Ruta para buscar clientes
router.get('/buscar', clienteController.buscarClientes);

// Ruta para crear nuevo cliente
router.post('/', validarDatos(clienteSchemas.crearCliente), clienteController.crearCliente);

// Ruta para obtener perfil de cliente específico
router.get('/:id', validarId, clienteController.obtenerPerfil);

// Ruta para actualizar cliente específico
router.patch('/:id', validarId, validarDatos(clienteSchemas.crearCliente), clienteController.actualizarCliente);

// Ruta para obtener citas de un cliente específico
router.get('/:id/citas', validarId, clienteController.obtenerCitasCliente);

module.exports = router;

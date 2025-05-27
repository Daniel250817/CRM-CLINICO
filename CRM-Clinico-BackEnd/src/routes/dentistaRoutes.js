const express = require('express');
const dentistaController = require('../controllers/dentistaController');
const { protegerRuta, restringirA } = require('../middlewares/auth');
const { validarDatos } = require('../middlewares/validacion');
const { dentistaSchemas } = require('../utils/validaciones');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas públicas (para cualquier usuario autenticado)
router.get('/', dentistaController.obtenerTodosLosDentistas);
router.get('/especialidades', dentistaController.obtenerEspecialidades);
router.get('/:id/disponibilidad', dentistaController.obtenerDisponibilidad);
router.get('/:id', dentistaController.obtenerPerfil);

// Rutas solo para dentistas (perfil propio) y admin
router.get('/perfil', restringirA('dentista'), dentistaController.obtenerPerfil);
router.patch('/perfil', restringirA('dentista'), validarDatos(dentistaSchemas.crearDentista), dentistaController.actualizarDentista);

// Rutas solo para admin
router.post('/', restringirA('admin'), validarDatos(dentistaSchemas.crearDentista), dentistaController.crearDentista);
router.patch('/:id', restringirA('admin'), validarDatos(dentistaSchemas.crearDentista), dentistaController.actualizarDentista);

module.exports = router;

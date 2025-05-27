const express = require('express');
const notificacionController = require('../controllers/notificacionController');
const { protegerRuta } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Obtener notificaciones del usuario actual
router.get('/', notificacionController.obtenerNotificaciones);
router.get('/no-leidas', notificacionController.contarNoLeidas);

// Marcar notificaciones como leídas
router.patch('/:id/marcar-leida', notificacionController.marcarComoLeida);
router.patch('/marcar-todas-leidas', notificacionController.marcarTodasComoLeidas);

// Eliminar notificación
router.delete('/:id', notificacionController.eliminarNotificacion);

module.exports = router;

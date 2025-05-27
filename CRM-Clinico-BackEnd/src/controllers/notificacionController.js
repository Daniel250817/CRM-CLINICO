const db = require('../models');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');
const NotificacionService = require('../services/notificacionService');

class NotificacionController {
  /**
   * Obtener notificaciones del usuario actual
   */
  static async obtenerNotificaciones(req, res, next) {
    try {
      const { leidas, limite, pagina } = req.query;
      
      // Configurar paginación
      const limit = parseInt(limite) || 10;
      const offset = (parseInt(pagina) || 0) * limit;
      
      // Filtrar por condición de leídas/no leídas
      const where = { usuarioId: req.usuario.id };
      if (leidas === 'true' || leidas === 'false') {
        where.leida = leidas === 'true';
      }
      
      const { count, rows: notificaciones } = await db.Notificacion.findAndCountAll({
        where,
        order: [['fecha', 'DESC']],
        limit,
        offset
      });
      
      res.status(200).json({
        status: 'success',
        results: notificaciones.length,
        total: count,
        pagina: parseInt(pagina) || 0,
        paginasTotales: Math.ceil(count / limit),
        data: notificaciones
      });
    } catch (error) {
      logger.error(`Error al obtener notificaciones: ${error}`);
      next(error);
    }
  }

  /**
   * Marcar notificación como leída
   */
  static async marcarComoLeida(req, res, next) {
    try {
      const { id } = req.params;
      
      const notificacion = await db.Notificacion.findByPk(id);
      
      if (!notificacion) {
        return next(new NotFoundError(`No existe una notificación con ID: ${id}`));
      }
      
      // Verificar que la notificación pertenece al usuario actual
      if (notificacion.usuarioId !== req.usuario.id) {
        return next(new ForbiddenError('No tienes permiso para acceder a esta notificación'));
      }
      
      // Si ya está marcada como leída, no hacer nada
      if (notificacion.leida) {
        return res.status(200).json({
          status: 'success',
          message: 'La notificación ya está marcada como leída',
          data: notificacion
        });
      }
      
      // Marcar como leída
      notificacion.leida = true;
      await notificacion.save();
      
      res.status(200).json({
        status: 'success',
        message: 'Notificación marcada como leída',
        data: notificacion
      });
    } catch (error) {
      logger.error(`Error al marcar notificación como leída: ${error}`);
      next(error);
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  static async marcarTodasComoLeidas(req, res, next) {
    try {
      const resultado = await NotificacionService.marcarTodasComoLeidas(req.usuario.id);
      
      res.status(200).json({
        status: 'success',
        message: `${resultado} notificaciones marcadas como leídas`
      });
    } catch (error) {
      logger.error(`Error al marcar todas las notificaciones como leídas: ${error}`);
      next(error);
    }
  }

  /**
   * Eliminar una notificación
   */
  static async eliminarNotificacion(req, res, next) {
    try {
      const { id } = req.params;
      
      const notificacion = await db.Notificacion.findByPk(id);
      
      if (!notificacion) {
        return next(new NotFoundError(`No existe una notificación con ID: ${id}`));
      }
      
      // Verificar que la notificación pertenece al usuario actual
      if (notificacion.usuarioId !== req.usuario.id) {
        return next(new ForbiddenError('No tienes permiso para eliminar esta notificación'));
      }
      
      await notificacion.destroy();
      
      res.status(200).json({
        status: 'success',
        message: 'Notificación eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar notificación: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener número de notificaciones no leídas
   */
  static async contarNoLeidas(req, res, next) {
    try {
      const count = await db.Notificacion.count({
        where: {
          usuarioId: req.usuario.id,
          leida: false
        }
      });
      
      res.status(200).json({
        status: 'success',
        data: { total: count }
      });
    } catch (error) {
      logger.error(`Error al contar notificaciones no leídas: ${error}`);
      next(error);
    }
  }
}

module.exports = NotificacionController;

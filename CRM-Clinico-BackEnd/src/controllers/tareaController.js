const db = require('../models');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const NotificacionService = require('../services/notificacionService');

class TareaController {
  /**
   * Crear una nueva tarea
   */
  static async crearTarea(req, res, next) {
    try {
      const { titulo, descripcion, asignadoA, fechaLimite, prioridad = 'media' } = req.body;

      // Verificar que el usuario asignado existe
      const usuarioAsignado = await db.Usuario.findByPk(asignadoA);
      if (!usuarioAsignado) {
        return next(new NotFoundError(`No existe un usuario con ID: ${asignadoA}`));
      }

      // Crear la tarea
      const nuevaTarea = await db.Tarea.create({
        titulo,
        descripcion,
        asignadoA,
        creadoPor: req.usuario.id,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        prioridad,
        estado: 'pendiente'
      });

      // Enviar notificación al usuario asignado
      await NotificacionService.notificarTarea(nuevaTarea, 'crear');

      res.status(201).json({
        status: 'success',
        data: nuevaTarea
      });
    } catch (error) {
      logger.error(`Error al crear tarea: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener todas las tareas (filtradas)
   */
  static async obtenerTareas(req, res, next) {
    try {
      const { asignado, creador, estado, prioridad } = req.query;

      // Construir opciones de consulta
      const where = {};

      // Filtrar según rol y parámetros
      if (req.usuario.rol === 'admin') {
        // Los administradores pueden ver todas las tareas o filtrar
        if (asignado) where.asignadoA = asignado;
        if (creador) where.creadoPor = creador;
      } else {
        // Los demás usuarios solo ven tareas asignadas a ellos o creadas por ellos
        where[db.Sequelize.Op.or] = [
          { asignadoA: req.usuario.id },
          { creadoPor: req.usuario.id }
        ];
      }

      // Filtros adicionales
      if (estado) where.estado = estado;
      if (prioridad) where.prioridad = prioridad;

      const tareas = await db.Tarea.findAll({
        where,
        include: [
          { model: db.Usuario, as: 'responsable', attributes: ['id', 'nombre', 'email'] },
          { model: db.Usuario, as: 'creador', attributes: ['id', 'nombre', 'email'] }
        ],
        order: [
          ['estado', 'ASC'],
          ['prioridad', 'DESC'],
          ['fechaLimite', 'ASC']
        ]
      });

      res.status(200).json({
        status: 'success',
        results: tareas.length,
        data: tareas
      });
    } catch (error) {
      logger.error(`Error al obtener tareas: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener una tarea por ID
   */
  static async obtenerTareaPorId(req, res, next) {
    try {
      const { id } = req.params;

      const tarea = await db.Tarea.findByPk(id, {
        include: [
          { model: db.Usuario, as: 'responsable', attributes: ['id', 'nombre', 'email', 'telefono'] },
          { model: db.Usuario, as: 'creador', attributes: ['id', 'nombre', 'email'] }
        ]
      });

      if (!tarea) {
        return next(new NotFoundError(`No existe una tarea con ID: ${id}`));
      }

      // Verificar permisos según rol
      if (req.usuario.rol !== 'admin' && req.usuario.id !== tarea.asignadoA && req.usuario.id !== tarea.creadoPor) {
        return next(new ForbiddenError('No tienes permiso para ver esta tarea'));
      }

      res.status(200).json({
        status: 'success',
        data: tarea
      });
    } catch (error) {
      logger.error(`Error al obtener tarea por ID: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar una tarea
   */
  static async actualizarTarea(req, res, next) {
    try {
      const { id } = req.params;
      const { titulo, descripcion, asignadoA, fechaLimite, prioridad, estado } = req.body;

      const tarea = await db.Tarea.findByPk(id);

      if (!tarea) {
        return next(new NotFoundError(`No existe una tarea con ID: ${id}`));
      }

      // Verificar permisos según rol
      if (req.usuario.rol !== 'admin' && req.usuario.id !== tarea.creadoPor) {
        return next(new ForbiddenError('No tienes permiso para modificar esta tarea'));
      }

      // Si se cambia el usuario asignado, verificar que existe
      if (asignadoA && asignadoA !== tarea.asignadoA) {
        const usuarioAsignado = await db.Usuario.findByPk(asignadoA);
        if (!usuarioAsignado) {
          return next(new NotFoundError(`No existe un usuario con ID: ${asignadoA}`));
        }
      }

      // Actualizar campos
      const camposCambiados = {};
      
      if (titulo !== undefined && titulo !== tarea.titulo) {
        tarea.titulo = titulo;
        camposCambiados.titulo = true;
      }
      if (descripcion !== undefined && descripcion !== tarea.descripcion) {
        tarea.descripcion = descripcion;
        camposCambiados.descripcion = true;
      }
      if (asignadoA !== undefined && asignadoA !== tarea.asignadoA) {
        tarea.asignadoA = asignadoA;
        camposCambiados.asignadoA = true;
      }
      if (fechaLimite !== undefined) {
        const nuevaFecha = fechaLimite ? new Date(fechaLimite) : null;
        if (nuevaFecha?.getTime() !== tarea.fechaLimite?.getTime()) {
          tarea.fechaLimite = nuevaFecha;
          camposCambiados.fechaLimite = true;
        }
      }
      if (prioridad !== undefined && prioridad !== tarea.prioridad) {
        tarea.prioridad = prioridad;
        camposCambiados.prioridad = true;
      }
      if (estado !== undefined && estado !== tarea.estado) {
        // Si se marca como completada, registrar la fecha
        if (estado === 'completada' && tarea.estado !== 'completada') {
          tarea.completadoEn = new Date();
        } else if (estado !== 'completada') {
          tarea.completadoEn = null;
        }
        tarea.estado = estado;
        camposCambiados.estado = true;
      }

      await tarea.save();

      // Enviar notificación si hubo cambios significativos
      if (Object.keys(camposCambiados).length > 0) {
        if (camposCambiados.estado && tarea.estado === 'completada') {
          await NotificacionService.notificarTarea(tarea, 'completar');
        } else {
          await NotificacionService.notificarTarea(tarea, 'actualizar');
        }
      }

      res.status(200).json({
        status: 'success',
        data: tarea
      });
    } catch (error) {
      logger.error(`Error al actualizar tarea: ${error}`);
      next(error);
    }
  }

  /**
   * Eliminar una tarea
   */
  static async eliminarTarea(req, res, next) {
    try {
      const { id } = req.params;

      const tarea = await db.Tarea.findByPk(id);

      if (!tarea) {
        return next(new NotFoundError(`No existe una tarea con ID: ${id}`));
      }

      // Verificar permisos según rol
      if (req.usuario.rol !== 'admin' && req.usuario.id !== tarea.creadoPor) {
        return next(new ForbiddenError('No tienes permiso para eliminar esta tarea'));
      }

      await tarea.destroy();

      res.status(200).json({
        status: 'success',
        message: 'Tarea eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar tarea: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener resumen de tareas por estado
   */
  static async obtenerResumenTareas(req, res, next) {
    try {
      // Construir condición donde según el rol
      const where = {};
      
      if (req.usuario.rol !== 'admin') {
        where[db.Sequelize.Op.or] = [
          { asignadoA: req.usuario.id },
          { creadoPor: req.usuario.id }
        ];
      }

      // Contar tareas por estado
      const resumen = await db.Tarea.findAll({
        attributes: [
          'estado',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']
        ],
        where,
        group: ['estado'],
        raw: true
      });

      // Formatear respuesta como objeto
      const resultado = {
        pendiente: 0,
        'en progreso': 0,
        completada: 0,
        cancelada: 0
      };

      resumen.forEach(item => {
        resultado[item.estado] = parseInt(item.total);
      });

      // Contar tareas con fecha límite pasada
      const tareasVencidas = await db.Tarea.count({
        where: {
          ...where,
          fechaLimite: {
            [db.Sequelize.Op.lt]: new Date()
          },
          estado: {
            [db.Sequelize.Op.notIn]: ['completada', 'cancelada']
          }
        }
      });

      resultado.vencidas = tareasVencidas;

      res.status(200).json({
        status: 'success',
        data: resultado
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de tareas: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar estado de una tarea
   */
  static async actualizarEstadoTarea(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const tarea = await db.Tarea.findByPk(id);

      if (!tarea) {
        return next(new NotFoundError(`No existe una tarea con ID: ${id}`));
      }

      // Verificar permisos según rol
      if (req.usuario.rol !== 'admin' && 
          req.usuario.id !== tarea.asignadoA && 
          req.usuario.id !== tarea.creadoPor) {
        return next(new ForbiddenError('No tienes permiso para modificar esta tarea'));
      }

      // Si se marca como completada, registrar la fecha
      if (estado === 'completada' && tarea.estado !== 'completada') {
        tarea.completadoEn = new Date();
      } else if (estado !== 'completada') {
        tarea.completadoEn = null;
      }

      tarea.estado = estado;
      await tarea.save();

      // Enviar notificación
      if (estado === 'completada') {
        await NotificacionService.notificarTarea(tarea, 'completar');
      } else {
        await NotificacionService.notificarTarea(tarea, 'actualizar');
      }

      res.status(200).json({
        status: 'success',
        data: tarea
      });
    } catch (error) {
      logger.error(`Error al actualizar estado de tarea: ${error}`);
      next(error);
    }
  }
}

module.exports = TareaController;

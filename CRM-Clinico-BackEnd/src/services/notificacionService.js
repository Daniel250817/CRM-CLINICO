const db = require('../models');
const logger = require('../utils/logger');

/**
 * Servicio para gestionar notificaciones
 */
class NotificacionService {
  /**
   * Crear una nueva notificación
   * @param {Object} notificacionData - Datos de la notificación
   * @returns {Object} - Notificación creada
   */
  static async crearNotificacion(notificacionData) {
    try {
      const notificacion = await db.Notificacion.create(notificacionData);
      return notificacion;
    } catch (error) {
      logger.error(`Error al crear notificación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar notificación para una cita (nueva, modificada, cancelada)
   * @param {Object} cita - Cita relacionada con la notificación
   * @param {String} accion - Tipo de acción ('crear', 'actualizar', 'cancelar')
   */
  static async notificarCita(cita, accion) {
    try {
      // Obtener los datos relacionados
      const citaCompleta = await db.Cita.findByPk(cita.id, {
        include: [
          { model: db.Cliente, as: 'cliente', include: { model: db.Usuario, as: 'usuario' } },
          { model: db.Dentista, as: 'dentista', include: { model: db.Usuario, as: 'usuario' } },
          { model: db.Servicio, as: 'servicio' }
        ]
      });

      if (!citaCompleta) {
        throw new Error(`Cita con ID ${cita.id} no encontrada`);
      }

      const clienteId = citaCompleta.cliente.usuario.id;
      const dentistaId = citaCompleta.dentista.usuario.id;
      
      // Formatear la fecha para mostrarla en el mensaje
      const fechaFormateada = new Date(citaCompleta.fechaHora).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let mensajeCliente, mensajeDentista, tipo;
      
      switch (accion) {
        case 'crear':
          mensajeCliente = `Nueva cita: ${citaCompleta.servicio.nombre} con Dr. ${citaCompleta.dentista.usuario.nombre} el ${fechaFormateada}`;
          mensajeDentista = `Nueva cita: ${citaCompleta.servicio.nombre} con ${citaCompleta.cliente.usuario.nombre} el ${fechaFormateada}`;
          tipo = 'info';
          break;
          
        case 'actualizar':
          mensajeCliente = `Cita modificada: ${citaCompleta.servicio.nombre} ahora ${citaCompleta.estado} el ${fechaFormateada}`;
          mensajeDentista = `Cita modificada: ${citaCompleta.servicio.nombre} con ${citaCompleta.cliente.usuario.nombre} ahora ${citaCompleta.estado} el ${fechaFormateada}`;
          tipo = 'info';
          break;
          
        case 'cancelar':
          mensajeCliente = `Cita cancelada: ${citaCompleta.servicio.nombre} del ${fechaFormateada}`;
          mensajeDentista = `Cita cancelada: ${citaCompleta.servicio.nombre} con ${citaCompleta.cliente.usuario.nombre} del ${fechaFormateada}`;
          tipo = 'alerta';
          break;
          
        default:
          mensajeCliente = `Actualización de cita: ${citaCompleta.servicio.nombre} el ${fechaFormateada}`;
          mensajeDentista = `Actualización de cita: ${citaCompleta.servicio.nombre} con ${citaCompleta.cliente.usuario.nombre} el ${fechaFormateada}`;
          tipo = 'info';
      }

      // Crear notificaciones para cliente y dentista
      await Promise.all([
        this.crearNotificacion({
          usuarioId: clienteId,
          mensaje: mensajeCliente,
          tipo,
          entidadTipo: 'cita',
          entidadId: cita.id,
          accion
        }),
        this.crearNotificacion({
          usuarioId: dentistaId,
          mensaje: mensajeDentista,
          tipo,
          entidadTipo: 'cita',
          entidadId: cita.id,
          accion
        })
      ]);

      logger.info(`Notificaciones de cita enviadas para cita ID: ${cita.id}`);

    } catch (error) {
      logger.error(`Error al notificar cita: ${error.message}`);
      // No propagamos el error para evitar que falle la operación principal
    }
  }

  /**
   * Enviar notificación para una tarea (asignada, modificada)
   * @param {Object} tarea - Tarea relacionada con la notificación
   * @param {String} accion - Tipo de acción ('crear', 'actualizar', 'completar')
   */
  static async notificarTarea(tarea, accion) {
    try {
      const tareaCompleta = await db.Tarea.findByPk(tarea.id, {
        include: [
          { model: db.Usuario, as: 'responsable' },
          { model: db.Usuario, as: 'creador' }
        ]
      });

      if (!tareaCompleta) {
        throw new Error(`Tarea con ID ${tarea.id} no encontrada`);
      }

      const asignadoA = tareaCompleta.responsable.id;
      
      // Formatear la fecha límite si existe
      let fechaLimiteMsg = '';
      if (tareaCompleta.fechaLimite) {
        const fechaLimite = new Date(tareaCompleta.fechaLimite).toLocaleDateString('es-ES');
        fechaLimiteMsg = ` (Fecha límite: ${fechaLimite})`;
      }

      let mensaje, tipo;
      
      switch (accion) {
        case 'crear':
          mensaje = `Nueva tarea asignada: ${tareaCompleta.titulo}${fechaLimiteMsg}`;
          tipo = tareaCompleta.prioridad === 'urgente' ? 'alerta' : 'info';
          break;
          
        case 'actualizar':
          mensaje = `Tarea modificada: ${tareaCompleta.titulo}${fechaLimiteMsg}`;
          tipo = 'info';
          break;
          
        case 'completar':
          mensaje = `Tarea marcada como completada: ${tareaCompleta.titulo}`;
          tipo = 'info';
          break;
          
        default:
          mensaje = `Actualización de tarea: ${tareaCompleta.titulo}`;
          tipo = 'info';
      }

      // Crear notificación para el usuario asignado
      await this.crearNotificacion({
        usuarioId: asignadoA,
        mensaje,
        tipo,
        entidadTipo: 'tarea',
        entidadId: tarea.id,
        accion
      });

      logger.info(`Notificación de tarea enviada para tarea ID: ${tarea.id}`);

    } catch (error) {
      logger.error(`Error al notificar tarea: ${error.message}`);
      // No propagamos el error para evitar que falle la operación principal
    }
  }

  /**
   * Marcar notificación como leída
   * @param {Number} id - ID de la notificación
   * @param {Number} usuarioId - ID del usuario propietario
   * @returns {Boolean} - Resultado de la operación
   */
  static async marcarComoLeida(id, usuarioId) {
    try {
      const notificacion = await db.Notificacion.findOne({
        where: { id, usuarioId }
      });

      if (!notificacion) return false;

      notificacion.leida = true;
      await notificacion.save();
      return true;
    } catch (error) {
      logger.error(`Error al marcar notificación como leída: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   * @param {Number} usuarioId - ID del usuario propietario
   * @returns {Number} - Cantidad de notificaciones actualizadas
   */
  static async marcarTodasComoLeidas(usuarioId) {
    try {
      const result = await db.Notificacion.update(
        { leida: true },
        { where: { usuarioId, leida: false } }
      );
      return result[0]; // Número de filas afectadas
    } catch (error) {
      logger.error(`Error al marcar todas las notificaciones como leídas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = NotificacionService;

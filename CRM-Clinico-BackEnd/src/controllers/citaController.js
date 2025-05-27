const db = require('../models');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');
const NotificacionService = require('../services/notificacionService');

class CitaController {
  /**
   * Crear una nueva cita
   */
  static async crearCita(req, res, next) {
    try {
      const { clienteId, dentistaId, servicioId, fechaHora, notas } = req.body;

      // Verificar que el cliente existe
      const cliente = await db.Cliente.findByPk(clienteId);
      if (!cliente) {
        return next(new NotFoundError(`No existe un cliente con ID: ${clienteId}`));
      }

      // Verificar que el dentista existe
      const dentista = await db.Dentista.findByPk(dentistaId);
      if (!dentista) {
        return next(new NotFoundError(`No existe un dentista con ID: ${dentistaId}`));
      }
      
      // Verificar que el dentista esté activo
      if (dentista.status !== 'activo') {
        return next(new BadRequestError(`El dentista seleccionado no está disponible actualmente`));
      }

      // Verificar que el servicio existe
      const servicio = await db.Servicio.findByPk(servicioId);
      if (!servicio) {
        return next(new NotFoundError(`No existe un servicio con ID: ${servicioId}`));
      }

      // Verificar disponibilidad del dentista (horario)
      const fechaCita = new Date(fechaHora);
      const horaInicio = fechaCita.getHours() + (fechaCita.getMinutes() / 60);
      
      // Obtener el día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
      const diaSemana = fechaCita.getDay();
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaTexto = diasSemana[diaSemana];
      
      // Validar horario de trabajo del dentista
      if (dentista.horarioTrabajo && dentista.horarioTrabajo[diaTexto]) {
        const disponible = dentista.horarioTrabajo[diaTexto].some(rango => {
          const inicio = parseFloat(rango.inicio);
          const fin = parseFloat(rango.fin);
          return horaInicio >= inicio && horaInicio < fin;
        });
        
        if (!disponible) {
          return next(new BadRequestError(`El dentista no está disponible en el horario seleccionado`));
        }
      } else {
        // Si no hay horario definido para ese día, el dentista no trabaja
        return next(new BadRequestError(`El dentista no trabaja los ${diaTexto}`));
      }

      // Verificar conflictos con otras citas
      const duracionServicio = servicio.duracion || 60; // en minutos
      const fechaFinCita = new Date(fechaCita.getTime() + duracionServicio * 60000);
      
      const citasConflicto = await db.Cita.findOne({
        where: {
          dentistaId,
          [db.Sequelize.Op.or]: [
            // Nueva cita comienza durante una existente
            {
              fechaHora: {
                [db.Sequelize.Op.lt]: fechaFinCita
              },
              [db.Sequelize.Op.and]: [
                db.Sequelize.literal(`DATE_ADD(fechaHora, INTERVAL duracion MINUTE) > '${fechaCita.toISOString()}'`)
              ]
            },
            // Nueva cita termina durante una existente
            {
              fechaHora: {
                [db.Sequelize.Op.gt]: fechaCita,
                [db.Sequelize.Op.lt]: fechaFinCita
              }
            }
          ],
          estado: {
            [db.Sequelize.Op.notIn]: ['cancelada']
          }
        }
      });
      
      if (citasConflicto) {
        return next(new ValidationError(`Ya existe una cita programada en ese horario`));
      }

      // Crear la cita usando una transacción
      const nuevaCita = await db.sequelize.transaction(async (t) => {
        const cita = await db.Cita.create({
          clienteId,
          dentistaId,
          servicioId,
          fechaHora,
          estado: 'pendiente',
          notas,
          duracion: duracionServicio
        }, { transaction: t });
        
        // Obtener la cita con todas sus relaciones
        const citaConRelaciones = await db.Cita.findByPk(cita.id, {
          include: [
            { 
              model: db.Cliente, 
              as: 'cliente',
              include: { model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'telefono'] }
            },
            { 
              model: db.Dentista, 
              as: 'dentista',
              include: { model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'telefono'] }
            },
            { model: db.Servicio, as: 'servicio' }
          ],
          transaction: t
        });
        
        return citaConRelaciones;
      });

      // Enviar notificación
      await NotificacionService.notificarCita(nuevaCita, 'crear');

      res.status(201).json({
        status: 'success',
        data: nuevaCita
      });
    } catch (error) {
      logger.error(`Error al crear cita: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener todas las citas (filtradas)
   */
  static async obtenerCitas(req, res, next) {
    try {
      const { dentista, cliente, fecha, estado, desde, hasta } = req.query;
      
      // Construir opciones de consulta
      const where = {};
      
      if (dentista) where.dentistaId = dentista;
      if (cliente) where.clienteId = cliente;
      if (estado) where.estado = estado;
      
      // Filtro por fecha
      if (fecha) {
        // Filtrar por día específico
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaInicio.getDate() + 1); // Hasta el siguiente día
        
        where.fechaHora = {
          [db.Sequelize.Op.gte]: fechaInicio,
          [db.Sequelize.Op.lt]: fechaFin
        };
      } else if (desde || hasta) {
        // Rango de fechas personalizado
        where.fechaHora = {};
        
        if (desde) {
          where.fechaHora[db.Sequelize.Op.gte] = new Date(desde);
        }
        
        if (hasta) {
          where.fechaHora[db.Sequelize.Op.lte] = new Date(hasta);
        }
      }
      
      // Restricciones según el rol
      if (req.usuario.rol === 'cliente') {
        // Los clientes solo pueden ver sus propias citas
        const cliente = await db.Cliente.findOne({ where: { userId: req.usuario.id } });
        if (!cliente) {
          return next(new NotFoundError('No se encontró el perfil de cliente asociado'));
        }
        where.clienteId = cliente.id;
      } else if (req.usuario.rol === 'dentista') {
        // Los dentistas solo pueden ver sus propias citas
        const dentista = await db.Dentista.findOne({ where: { userId: req.usuario.id } });
        if (!dentista) {
          return next(new NotFoundError('No se encontró el perfil de dentista asociado'));
        }
        where.dentistaId = dentista.id;
      }
      
      const citas = await db.Cita.findAll({
        where,
        include: [
          { 
            model: db.Cliente, 
            as: 'cliente',
            include: { model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'telefono'] }
          },
          { 
            model: db.Dentista, 
            as: 'dentista',
            include: { model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'telefono'] }
          },
          { model: db.Servicio, as: 'servicio' }
        ],
        order: [['fechaHora', 'ASC']]
      });
      
      res.status(200).json({
        status: 'success',
        results: citas.length,
        data: citas
      });
    } catch (error) {
      logger.error(`Error al obtener citas: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener una cita por ID
   */
  static async obtenerCitaPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      const cita = await db.Cita.findByPk(id, {
        include: [
          { 
            model: db.Cliente, 
            as: 'cliente',
            include: { model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'telefono'] }
          },
          { 
            model: db.Dentista, 
            as: 'dentista',
            include: { model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'telefono'] }
          },
          { model: db.Servicio, as: 'servicio' }
        ]
      });
      
      if (!cita) {
        return next(new NotFoundError(`No existe una cita con ID: ${id}`));
      }
      
      // Verificar permisos según rol
      if (req.usuario.rol === 'cliente') {
        const cliente = await db.Cliente.findOne({ where: { userId: req.usuario.id } });
        if (!cliente || cita.clienteId !== cliente.id) {
          return next(new ForbiddenError('No tienes permiso para ver esta cita'));
        }
      } else if (req.usuario.rol === 'dentista') {
        const dentista = await db.Dentista.findOne({ where: { userId: req.usuario.id } });
        if (!dentista || cita.dentistaId !== dentista.id) {
          return next(new ForbiddenError('No tienes permiso para ver esta cita'));
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: cita
      });
    } catch (error) {
      logger.error(`Error al obtener cita por ID: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar estado de una cita
   */
  static async actualizarEstadoCita(req, res, next) {
    try {
      const { id } = req.params;
      const { estado, motivoCancelacion } = req.body;
      
      const cita = await db.Cita.findByPk(id);
      
      if (!cita) {
        return next(new NotFoundError(`No existe una cita con ID: ${id}`));
      }
      
      // Verificar permisos según rol
      if (req.usuario.rol === 'cliente') {
        const cliente = await db.Cliente.findOne({ where: { userId: req.usuario.id } });
        if (!cliente || cita.clienteId !== cliente.id) {
          return next(new ForbiddenError('No tienes permiso para modificar esta cita'));
        }
        
        // Clientes solo pueden cancelar sus citas
        if (estado !== 'cancelada') {
          return next(new ForbiddenError('Los clientes solo pueden cancelar citas'));
        }
      } else if (req.usuario.rol === 'dentista') {
        const dentista = await db.Dentista.findOne({ where: { userId: req.usuario.id } });
        if (!dentista || cita.dentistaId !== dentista.id) {
          return next(new ForbiddenError('No tienes permiso para modificar esta cita'));
        }
      }
      
      // Validar transiciones de estado
      const estadosValidos = {
        'pendiente': ['confirmada', 'cancelada'],
        'confirmada': ['completada', 'no asistió', 'cancelada'],
        'completada': [],
        'cancelada': [],
        'no asistió': []
      };
      
      if (!estadosValidos[cita.estado].includes(estado)) {
        return next(new ValidationError(`No se puede cambiar el estado de ${cita.estado} a ${estado}`));
      }
      
      // Actualizar el estado
      cita.estado = estado;
      
      // Si se cancela, registrar motivo
      if (estado === 'cancelada' && motivoCancelacion) {
        cita.motivoCancelacion = motivoCancelacion;
      }
      
      await cita.save();
      
      // Enviar notificación
      await NotificacionService.notificarCita(cita, estado === 'cancelada' ? 'cancelar' : 'actualizar');
      
      res.status(200).json({
        status: 'success',
        data: cita
      });
    } catch (error) {
      logger.error(`Error al actualizar estado de cita: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener disponibilidad de dentista por fecha
   */
  static async obtenerDisponibilidadDentista(req, res, next) {
    try {
      const { id } = req.params;
      const { fecha } = req.query;
      
      if (!fecha) {
        return next(new BadRequestError('Debe proporcionar una fecha'));
      }
      
      const dentista = await db.Dentista.findByPk(id);
      if (!dentista) {
        return next(new NotFoundError(`No existe un dentista con ID: ${id}`));
      }
      
      // Obtener fecha en formato adecuado
      const fechaConsulta = new Date(fecha);
      const diaSemana = fechaConsulta.getDay();
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaTexto = diasSemana[diaSemana];
      
      // Verificar si el dentista trabaja ese día
      let horarioDisponible = [];
      if (dentista.horarioTrabajo && dentista.horarioTrabajo[diaTexto]) {
        horarioDisponible = dentista.horarioTrabajo[diaTexto];
      } else {
        return res.status(200).json({
          status: 'success',
          message: `El dentista no trabaja los ${diaTexto}`,
          data: []
        });
      }
      
      // Obtener citas del dentista para ese día
      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaInicio.getDate() + 1); // Hasta el siguiente día
      
      const citas = await db.Cita.findAll({
        where: {
          dentistaId: id,
          fechaHora: {
            [db.Sequelize.Op.gte]: fechaInicio,
            [db.Sequelize.Op.lt]: fechaFin
          },
          estado: {
            [db.Sequelize.Op.notIn]: ['cancelada']
          }
        },
        include: [{ model: db.Servicio, as: 'servicio' }],
        order: [['fechaHora', 'ASC']]
      });
      
      // Generar slots de tiempo disponibles
      const slotsDisponibles = [];
      
      // Para cada rango de horario del dentista
      horarioDisponible.forEach(rango => {
        const horaInicioRango = parseInt(rango.inicio);
        const minInicioRango = Math.round((parseFloat(rango.inicio) - horaInicioRango) * 60);
        const horaFinRango = parseInt(rango.fin);
        const minFinRango = Math.round((parseFloat(rango.fin) - horaFinRango) * 60);
        
        // Crear fecha con la hora de inicio y fin del rango
        const inicioRango = new Date(fechaConsulta);
        inicioRango.setHours(horaInicioRango, minInicioRango, 0, 0);
        
        const finRango = new Date(fechaConsulta);
        finRango.setHours(horaFinRango, minFinRango, 0, 0);
        
        // Crear slots de 30 minutos
        const duracionSlot = 30; // minutos
        let slotInicio = new Date(inicioRango);
        
        while (slotInicio < finRango) {
          const slotFin = new Date(slotInicio.getTime() + duracionSlot * 60000);
          
          // Verificar si el slot está ocupado por alguna cita
          const slotOcupado = citas.some(cita => {
            const citaInicio = new Date(cita.fechaHora);
            const citaFin = new Date(citaInicio.getTime() + cita.duracion * 60000);
            
            // Hay conflicto si:
            // - El inicio del slot está dentro de una cita
            // - El fin del slot está dentro de una cita
            // - El slot contiene completamente una cita
            return (slotInicio >= citaInicio && slotInicio < citaFin) ||
                   (slotFin > citaInicio && slotFin <= citaFin) ||
                   (slotInicio <= citaInicio && slotFin >= citaFin);
          });
          
          if (!slotOcupado) {
            slotsDisponibles.push({
              inicio: slotInicio.toISOString(),
              fin: slotFin.toISOString()
            });
          }
          
          // Avanzar al siguiente slot
          slotInicio = slotFin;
        }
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          fecha,
          horarioTrabajo: horarioDisponible,
          slotsDisponibles
        }
      });
    } catch (error) {
      logger.error(`Error al obtener disponibilidad: ${error}`);
      next(error);
    }
  }
}

module.exports = CitaController;

const db = require('../models');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class DentistaController {
  /**
   * Obtener perfil de dentista
   */
  static async obtenerPerfil(req, res, next) {
    try {
      let dentistaId;
      
      // Si es el propio dentista quien hace la solicitud
      if (req.usuario.rol === 'dentista') {
        const dentista = await db.Dentista.findOne({ 
          where: { userId: req.usuario.id } 
        });
        
        if (!dentista) {
          return next(new NotFoundError('No se encontró el perfil de dentista asociado'));
        }
        
        dentistaId = dentista.id;
      } else {
        // Si es otro rol quien solicita un dentista específico
        dentistaId = req.params.id;
      }
      
      const dentista = await db.Dentista.findByPk(dentistaId, {
        include: {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'telefono', 'createdAt']
        }
      });
      
      if (!dentista) {
        return next(new NotFoundError(`No existe un dentista con ID: ${dentistaId}`));
      }
      
      res.status(200).json({
        status: 'success',
        data: dentista
      });
    } catch (error) {
      logger.error(`Error al obtener perfil de dentista: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar información de dentista
   */
  static async actualizarDentista(req, res, next) {
    try {
      let dentistaId;
      
      // Si es el propio dentista quien hace la actualización
      if (req.usuario.rol === 'dentista') {
        const dentista = await db.Dentista.findOne({ 
          where: { userId: req.usuario.id } 
        });
        
        if (!dentista) {
          return next(new NotFoundError('No se encontró el perfil de dentista asociado'));
        }
        
        dentistaId = dentista.id;
      } else {
        // Si es admin quien actualiza un dentista específico
        if (req.usuario.rol !== 'admin') {
          return next(new ForbiddenError('No tienes permiso para modificar este dentista'));
        }
        dentistaId = req.params.id;
      }
      
      const dentista = await db.Dentista.findByPk(dentistaId, {
        include: [{
          model: db.Usuario,
          as: 'usuario'
        }]
      });
      
      if (!dentista) {
        return next(new NotFoundError(`No existe un dentista con ID: ${dentistaId}`));
      }
      
      // Extraer campos a actualizar
      const { 
        especialidad,
        horarioTrabajo,
        status,
        titulo,
        numeroColegiado,
        añosExperiencia,
        biografia,
        usuario
      } = req.body;
      
      // Actualizar datos del usuario si se proporcionan
      if (usuario && dentista.usuario) {
        const { nombre, apellidos, email, telefono } = usuario;

        // Verificar si el email ya existe (solo si se está cambiando)
        if (email && email !== dentista.usuario.email) {
          const existeEmail = await db.Usuario.findOne({
            where: {
              email,
              id: { [db.Sequelize.Op.ne]: dentista.usuario.id }
            }
          });

          if (existeEmail) {
            return next(new ValidationError('El email ya está registrado por otro usuario'));
          }
        }

        // Actualizar datos del usuario
        await dentista.usuario.update({
          nombre: nombre || dentista.usuario.nombre,
          apellidos: apellidos || dentista.usuario.apellidos,
          email: email || dentista.usuario.email,
          telefono: telefono || dentista.usuario.telefono
        });
      }      // Actualizar campos del dentista
      if (especialidad !== undefined) dentista.especialidad = especialidad || '';
      if (horarioTrabajo !== undefined) {
        // Asegurar que horarioTrabajo sea un objeto JSON válido
        if (typeof horarioTrabajo === 'string') {
          try {
            dentista.horarioTrabajo = JSON.parse(horarioTrabajo);
          } catch (e) {
            logger.error('Error al parsear horarioTrabajo:', e);
            return next(new ValidationError('El formato del horario de trabajo es inválido'));
          }
        } else {
          dentista.horarioTrabajo = horarioTrabajo;
        }
      }
      if (status !== undefined) dentista.status = status || 'activo';
      if (titulo !== undefined) dentista.titulo = titulo || '';
      
      if (numeroColegiado !== undefined) {
        // Verificar si el número ya está en uso por otro dentista
        if (numeroColegiado !== dentista.numeroColegiado) {
          const existeNumero = await db.Dentista.findOne({ 
            where: { 
              numeroColegiado,
              id: { [db.Sequelize.Op.ne]: dentistaId }
            } 
          });
          
          if (existeNumero) {
            return next(new ValidationError('El número de colegiado ya está registrado'));
          }
        }
        dentista.numeroColegiado = numeroColegiado;      }
      if (añosExperiencia !== undefined) {
        dentista.añosExperiencia = añosExperiencia !== null && añosExperiencia !== '' ? 
          parseInt(añosExperiencia, 10) : null;
      }
      if (biografia !== undefined) dentista.biografia = biografia || '';
      
      await dentista.save();
      
      // Recargar el dentista con sus relaciones
      await dentista.reload({
        include: [{
          model: db.Usuario,
          as: 'usuario'
        }]
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Información de dentista actualizada correctamente',
        data: dentista
      });
    } catch (error) {
      logger.error(`Error al actualizar dentista: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener disponibilidad de un dentista
   */
  static async obtenerDisponibilidad(req, res, next) {
    try {
      const { id } = req.params;
      const { fecha } = req.query;
      
      if (!fecha) {
        return next(new ValidationError('Debe proporcionar una fecha'));
      }
      
      const dentista = await db.Dentista.findByPk(id);
      
      if (!dentista) {
        return next(new NotFoundError(`No existe un dentista con ID: ${id}`));
      }
      
      // Verificar que el dentista esté activo
      if (dentista.status !== 'activo') {
        return res.status(200).json({
          status: 'success',
          message: `El dentista no está disponible actualmente (${dentista.status})`,
          disponible: false,
          data: {
            horarioTrabajo: {},
            citas: []
          }
        });
      }
      
      // Obtener fecha en formato adecuado
      const fechaConsulta = new Date(fecha);
      const diaSemana = fechaConsulta.getDay();
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaTexto = diasSemana[diaSemana];
      
      // Obtener citas del dentista para ese día
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      
      const citas = await db.Cita.findAll({
        where: {
          dentistaId: id,
          fechaHora: {
            [db.Sequelize.Op.between]: [fechaInicio, fechaFin]
          },
          estado: {
            [db.Sequelize.Op.notIn]: ['cancelada']
          }
        },
        include: [
          { model: db.Servicio, as: 'servicio' }
        ],
        order: [['fechaHora', 'ASC']]
      });
      
      // Transformar citas para proteger datos de clientes
      const citasFormateadas = citas.map(cita => ({
        id: cita.id,
        fechaHora: cita.fechaHora,
        duracion: cita.duracion,
        servicio: cita.servicio.nombre,
        estado: cita.estado
      }));
      
      // Devolver todos los horarios del dentista
      res.status(200).json({
        status: 'success',
        disponible: true,
        horarioTrabajo: dentista.horarioTrabajo || {},
        citas: citasFormateadas
      });
    } catch (error) {
      logger.error(`Error al obtener disponibilidad: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener todos los dentistas
   */
  static async obtenerTodosLosDentistas(req, res, next) {
    try {
      const { status, especialidad } = req.query;
      
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (especialidad) {
        where.especialidad = especialidad;
      }
      
      const dentistas = await db.Dentista.findAll({
        where,
        attributes: ['id', 'userId', 'especialidad', 'status', 'horarioTrabajo'],
        include: {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        order: [[{ model: db.Usuario, as: 'usuario' }, 'nombre', 'ASC']]
      });
      
      res.status(200).json({
        status: 'success',
        results: dentistas.length,
        data: dentistas
      });
    } catch (error) {
      logger.error(`Error al obtener todos los dentistas: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener las especialidades únicas
   */
  static async obtenerEspecialidades(req, res, next) {
    try {
      const especialidades = await db.Dentista.findAll({
        attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('especialidad')), 'especialidad']],
        where: {
          especialidad: {
            [db.Sequelize.Op.not]: null
          }
        },
        raw: true
      });
      
      const listaEspecialidades = especialidades
        .map(esp => esp.especialidad)
        .filter(Boolean);
      
      res.status(200).json({
        status: 'success',
        data: listaEspecialidades
      });
    } catch (error) {
      logger.error(`Error al obtener especialidades: ${error}`);
      next(error);
    }
  }

  /**
   * Crear un nuevo dentista
   */
  static async crearDentista(req, res, next) {
    try {
      // Agregar log para depuración
      console.log('Datos recibidos para crear dentista:', JSON.stringify(req.body, null, 2));

      const { 
        userId,
        especialidad,
        horarioTrabajo,
        status = 'activo',
        titulo,
        numeroColegiado,
        añosExperiencia,
        biografia
      } = req.body;

      // Verificar que el usuario existe
      const usuario = await db.Usuario.findByPk(userId);
      if (!usuario) {
        return next(new NotFoundError(`No existe un usuario con ID: ${userId}`));
      }

      // Verificar que el usuario no sea ya un dentista
      const dentistaPrevio = await db.Dentista.findOne({ where: { userId } });
      if (dentistaPrevio) {
        return next(new ValidationError('Este usuario ya está registrado como dentista'));
      }

      // Validar formato del horario
      if (horarioTrabajo) {
        const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        // Verificar que todas las keys sean días válidos
        Object.keys(horarioTrabajo).forEach(dia => {
          if (!diasSemana.includes(dia)) {
            return next(new ValidationError(`Día inválido en horario: ${dia}`));
          }
          
          // Verificar que los rangos de hora sean válidos
          const rangos = horarioTrabajo[dia];
          if (!Array.isArray(rangos)) {
            return next(new ValidationError(`El formato de horario para ${dia} debe ser un array`));
          }
          
          rangos.forEach(rango => {
            if (!rango.inicio || !rango.fin) {
              return next(new ValidationError(`Cada rango debe tener inicio y fin`));
            }
          });
        });
      }

    // Verificar número de colegiado único si se proporciona
      if (numeroColegiado) {
        const existeNumero = await db.Dentista.findOne({ where: { numeroColegiado } });
        if (existeNumero) {
          return next(new ValidationError('El número de colegiado ya está registrado'));
        }
      }

      // Asegurar que horarioTrabajo sea un objeto JSON válido
      let horarioTrabajoFinal = horarioTrabajo;
      if (typeof horarioTrabajo === 'string') {
        try {
          horarioTrabajoFinal = JSON.parse(horarioTrabajo);
        } catch (e) {
          logger.error('Error al parsear horarioTrabajo:', e);
          return next(new ValidationError('El formato del horario de trabajo es inválido'));
        }
      }

      // Crear el dentista
      console.log('Creando dentista con datos:', {
        userId,
        especialidad,
        horarioTrabajo: JSON.stringify(horarioTrabajoFinal),
        status,
        titulo,
        numeroColegiado,
        añosExperiencia: añosExperiencia ? parseInt(añosExperiencia, 10) : null,
        biografia
      });

      const dentista = await db.Dentista.create({
        userId: parseInt(userId, 10),
        especialidad: especialidad || '',
        horarioTrabajo: horarioTrabajoFinal,
        status: status || 'activo',
        titulo: titulo || '',
        numeroColegiado: numeroColegiado || null,
        añosExperiencia: añosExperiencia ? parseInt(añosExperiencia, 10) : null,
        biografia: biografia || ''
      });

      // Obtener el dentista con la información del usuario
      const dentistaConUsuario = await db.Dentista.findByPk(dentista.id, {
        include: {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'telefono']
        }
      });

      res.status(201).json({
        status: 'success',
        message: 'Dentista creado correctamente',
        data: dentistaConUsuario
      });
    } catch (error) {
      logger.error(`Error al crear dentista: ${error}`);
      next(error);
    }
  }
}

module.exports = DentistaController;

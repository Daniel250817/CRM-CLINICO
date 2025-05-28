const db = require('../models');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class ClienteController {
  /**
   * Obtener perfil de cliente
   */
  static async obtenerPerfil(req, res, next) {
    try {
      const clienteId = req.params.id;

      // Validación más robusta del ID
      if (!clienteId || clienteId === 'undefined' || clienteId === 'null') {
        return next(new ValidationError('Se requiere un ID de cliente válido'));
      }

      // Verificar que el ID sea un número válido
      if (isNaN(clienteId)) {
        return next(new ValidationError('El ID del cliente debe ser un número válido'));
      }

      // Buscar el cliente
      const cliente = await db.Cliente.findOne({
        where: { id: clienteId },
        raw: true // Obtener datos planos en lugar de instancia de Sequelize
      });
      
      if (!cliente) {
        return next(new NotFoundError(`No existe un cliente con ID: ${clienteId}`));
      }

      // Parsear campos JSON si existen y son strings
      let historialMedicoParseado = null;
      let contactoEmergenciaParseado = null;

      try {
        if (cliente.historialMedico) {
          historialMedicoParseado = typeof cliente.historialMedico === 'string' 
            ? JSON.parse(cliente.historialMedico)
            : cliente.historialMedico;
        }
      } catch (error) {
        logger.error(`Error al parsear historialMedico: ${error}`);
      }

      try {
        if (cliente.contactoEmergencia) {
          contactoEmergenciaParseado = typeof cliente.contactoEmergencia === 'string'
            ? JSON.parse(cliente.contactoEmergencia)
            : cliente.contactoEmergencia;
          
          // Agregar logging para debug del contacto de emergencia
          logger.info(`Contacto de emergencia original: ${JSON.stringify(cliente.contactoEmergencia)}`);
          logger.info(`Contacto de emergencia parseado: ${JSON.stringify(contactoEmergenciaParseado)}`);
        } else {
          logger.info('No se encontró información de contacto de emergencia');
        }
      } catch (error) {
        logger.error(`Error al parsear contactoEmergencia: ${error}`);
        logger.error(`Valor que causó el error: ${cliente.contactoEmergencia}`);
      }

      // Asegurarse de que el contacto de emergencia siempre tenga una estructura válida
      const contactoEmergenciaFormateado = {
        nombre: contactoEmergenciaParseado?.nombre || '',
        telefono: contactoEmergenciaParseado?.telefono || '',
        relacion: contactoEmergenciaParseado?.relacion || ''
      };

      // Agregar logging del resultado final
      logger.info(`Contacto de emergencia formateado: ${JSON.stringify(contactoEmergenciaFormateado)}`);

      // Formatear los datos según la estructura esperada por el frontend
      const clienteFormateado = {
        id: cliente.id,
        direccion: cliente.direccion,
        ciudad: cliente.ciudad,
        codigoPostal: cliente.codigoPostal,
        ocupacion: cliente.ocupacion,
        estadoCivil: cliente.estadoCivil,
        historialMedico: historialMedicoParseado,
        contactoEmergencia: contactoEmergenciaFormateado,
        telefonoEmergencia: cliente.telefonoEmergencia,
        ultimaVisita: cliente.ultimaVisita,
        notas: cliente.notas,
        usuario: {
          nombre: cliente.nombre,
          apellidos: cliente.apellidos,
          email: cliente.email,
          telefono: cliente.telefono,
          fechaNacimiento: cliente.fechaNacimiento,
          genero: cliente.genero
        }
      };

      // Agregar logging para debug
      logger.info(`Datos del cliente formateados: ${JSON.stringify(clienteFormateado)}`);
      
      res.status(200).json({
        status: 'success',
        data: clienteFormateado
      });
    } catch (error) {
      logger.error(`Error al obtener perfil de cliente: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar información de cliente
   */
  static async actualizarCliente(req, res, next) {
    try {
      let clienteId;
      
      // Si es el propio cliente quien hace la actualización
      if (req.usuario.rol === 'cliente') {
        const cliente = await db.Cliente.findOne({ 
          where: { userId: req.usuario.id } 
        });
        
        if (!cliente) {
          return next(new NotFoundError('No se encontró el perfil de cliente asociado'));
        }
        
        clienteId = cliente.id;
      } else {
        // Si es admin quien actualiza un cliente específico
        if (req.usuario.rol !== 'admin') {
          return next(new ForbiddenError('No tienes permiso para modificar este cliente'));
        }
        clienteId = req.params.id;
      }
      
      // Buscar el cliente con su usuario asociado
      const cliente = await db.Cliente.findByPk(clienteId, {
        include: [{
          model: db.Usuario,
          as: 'usuario'
        }]
      });
      
      if (!cliente) {
        return next(new NotFoundError(`No existe un cliente con ID: ${clienteId}`));
      }
      
      // Extraer datos del request
      const { 
        usuario,
        direccion,
        ciudad,
        codigoPostal,
        ocupacion,
        estadoCivil,
        contactoEmergencia,
        historialMedico
      } = req.body;
      
      // Actualizar datos del usuario si se proporcionan
      if (usuario) {
        if (!cliente.usuario) {
          return next(new ValidationError('El cliente no tiene un usuario asociado'));
        }

        const { nombre, apellidos, email, telefono, fechaNacimiento, genero } = usuario;

        // Verificar si el email ya existe (solo si se está cambiando)
        if (email && email !== cliente.usuario.email) {
          const existeEmail = await db.Usuario.findOne({
            where: {
              email,
              id: { [db.Sequelize.Op.ne]: cliente.usuario.id }
            }
          });

          if (existeEmail && existeEmail.id !== cliente.usuario.id) {
            throw new ValidationError('El email ya está registrado por otro usuario', {
              errors: [{
                field: 'email',
                message: 'Este email ya está siendo utilizado por otro usuario. Por favor, use un email diferente.'
              }]
            });
          }
        }

        // Actualizar datos del usuario
        await cliente.usuario.update({
          nombre: nombre || cliente.usuario.nombre,
          apellidos: apellidos || cliente.usuario.apellidos,
          email: email || cliente.usuario.email,
          telefono: telefono || cliente.usuario.telefono,
          fechaNacimiento: fechaNacimiento || cliente.usuario.fechaNacimiento,
          genero: genero || cliente.usuario.genero
        });
      }

      // Actualizar datos del cliente
      await cliente.update({
        direccion: direccion !== undefined ? direccion : cliente.direccion,
        ciudad: ciudad !== undefined ? ciudad : cliente.ciudad,
        codigoPostal: codigoPostal !== undefined ? codigoPostal : cliente.codigoPostal,
        ocupacion: ocupacion !== undefined ? ocupacion : cliente.ocupacion,
        estadoCivil: estadoCivil !== undefined ? estadoCivil : cliente.estadoCivil,
        contactoEmergencia: contactoEmergencia !== undefined ? 
          (typeof contactoEmergencia === 'string' ? contactoEmergencia : JSON.stringify(contactoEmergencia)) 
          : cliente.contactoEmergencia,
        historialMedico: historialMedico !== undefined ? 
          (typeof historialMedico === 'string' ? historialMedico : JSON.stringify(historialMedico)) 
          : cliente.historialMedico
      });

      // Recargar el cliente con sus relaciones para obtener los datos actualizados
      await cliente.reload({
        include: [{
          model: db.Usuario,
          as: 'usuario'
        }]
      });

      // Formatear la respuesta
      const clienteFormateado = {
        id: cliente.id,
        direccion: cliente.direccion,
        ciudad: cliente.ciudad,
        codigoPostal: cliente.codigoPostal,
        ocupacion: cliente.ocupacion,
        estadoCivil: cliente.estadoCivil,
        historialMedico: cliente.historialMedico ? 
          (typeof cliente.historialMedico === 'string' ? JSON.parse(cliente.historialMedico) : cliente.historialMedico) 
          : null,
        contactoEmergencia: cliente.contactoEmergencia ? 
          (typeof cliente.contactoEmergencia === 'string' ? JSON.parse(cliente.contactoEmergencia) : cliente.contactoEmergencia) 
          : null,
        usuario: cliente.usuario ? {
          nombre: cliente.usuario.nombre,
          apellidos: cliente.usuario.apellidos,
          email: cliente.usuario.email,
          telefono: cliente.usuario.telefono,
          fechaNacimiento: cliente.usuario.fechaNacimiento,
          genero: cliente.usuario.genero
        } : null
      };
      
      res.status(200).json({
        status: 'success',
        message: 'Información de cliente actualizada correctamente',
        data: clienteFormateado
      });
    } catch (error) {
      logger.error(`Error al actualizar cliente: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener todas las citas del cliente
   */
  static async obtenerCitasCliente(req, res, next) {
    try {
      let clienteId;
      
      // Si es el propio cliente quien solicita sus citas
      if (req.usuario.rol === 'cliente') {
        const cliente = await db.Cliente.findOne({ 
          where: { userId: req.usuario.id } 
        });
        
        if (!cliente) {
          return next(new NotFoundError('No se encontró el perfil de cliente asociado'));
        }
        
        clienteId = cliente.id;
      } else {
        // Si es otro rol (admin o dentista) quien solicita citas de un cliente específico
        clienteId = req.params.id;
        
        // Verificar que el cliente existe
        const clienteExiste = await db.Cliente.findByPk(clienteId);
        if (!clienteExiste) {
          return next(new NotFoundError(`No existe un cliente con ID: ${clienteId}`));
        }
      }
      
      // Opciones para filtrar citas
      const where = { clienteId };
      
      // Filtrar por estado si se proporciona
      if (req.query.estado) {
        where.estado = req.query.estado;
      }
      
      // Filtrar por fecha (pasadas o futuras)
      if (req.query.tipo === 'futuras') {
        where.fechaHora = {
          [db.Sequelize.Op.gt]: new Date()
        };
      } else if (req.query.tipo === 'pasadas') {
        where.fechaHora = {
          [db.Sequelize.Op.lt]: new Date()
        };
      }
      
      const citas = await db.Cita.findAll({
        where,
        include: [
          { 
            model: db.Dentista, 
            as: 'dentista',
            include: { model: db.Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'telefono'] }
          },
          { model: db.Servicio, as: 'servicio' }
        ],
        order: [['fechaHora', 'DESC']]
      });
      
      res.status(200).json({
        status: 'success',
        results: citas.length,
        data: citas
      });
    } catch (error) {
      logger.error(`Error al obtener citas del cliente: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener todos los clientes (solo para admin)
   */
  static async obtenerTodosLosClientes(req, res, next) {
    try {
      // Solo admins pueden ver todos los clientes
      if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'dentista') {
        return next(new ForbiddenError('No tienes permiso para ver todos los clientes'));
      }
      
      const clientes = await db.Cliente.findAll({
        raw: true // Obtener datos planos en lugar de instancias de Sequelize
      });

      // Transformar los datos para el frontend
      const clientesFormateados = clientes.map(cliente => {
        // Parsear campos JSON si existen y son strings
        let historialMedicoParseado = null;
        let contactoEmergenciaParseado = null;

        try {
          if (cliente.historialMedico) {
            historialMedicoParseado = typeof cliente.historialMedico === 'string' 
              ? JSON.parse(cliente.historialMedico)
              : cliente.historialMedico;
          }
        } catch (error) {
          logger.error(`Error al parsear historialMedico: ${error}`);
        }

        try {
          if (cliente.contactoEmergencia) {
            contactoEmergenciaParseado = typeof cliente.contactoEmergencia === 'string'
              ? JSON.parse(cliente.contactoEmergencia)
              : cliente.contactoEmergencia;
          }
        } catch (error) {
          logger.error(`Error al parsear contactoEmergencia: ${error}`);
        }

        // Asegurarse de que el contacto de emergencia tenga la estructura correcta
        const contactoEmergenciaFormateado = contactoEmergenciaParseado ? {
          nombre: contactoEmergenciaParseado.nombre || '',
          telefono: contactoEmergenciaParseado.telefono || '',
          relacion: contactoEmergenciaParseado.relacion || ''
        } : null;

        // Formatear los datos según la estructura esperada por el frontend
        return {
          id: cliente.id,
          direccion: cliente.direccion,
          ciudad: cliente.ciudad,
          codigoPostal: cliente.codigoPostal,
          ocupacion: cliente.ocupacion,
          estadoCivil: cliente.estadoCivil,
          historialMedico: historialMedicoParseado,
          contactoEmergencia: contactoEmergenciaFormateado,
          telefonoEmergencia: cliente.telefonoEmergencia,
          ultimaVisita: cliente.ultimaVisita,
          notas: cliente.notas,
          usuario: {
            nombre: cliente.nombre,
            apellidos: cliente.apellidos,
            email: cliente.email,
            telefono: cliente.telefono,
            fechaNacimiento: cliente.fechaNacimiento,
            genero: cliente.genero
          }
        };
      });

      // Agregar logging para debug
      logger.info(`Número de clientes encontrados: ${clientesFormateados.length}`);
      logger.info(`Primer cliente formateado: ${JSON.stringify(clientesFormateados[0])}`);
      
      res.status(200).json({
        status: 'success',
        results: clientesFormateados.length,
        data: clientesFormateados
      });
    } catch (error) {
      logger.error(`Error al obtener todos los clientes: ${error}`);
      next(error);
    }
  }

  /**
   * Buscar clientes (para dentistas y admins)
   */
  static async buscarClientes(req, res, next) {
    try {
      // Solo admins y dentistas pueden buscar clientes
      if (req.usuario.rol === 'cliente') {
        return next(new ForbiddenError('No tienes permiso para buscar clientes'));
      }
      
      const { q } = req.query;
      
      if (!q || q.length < 3) {
        return next(new ValidationError('La búsqueda debe tener al menos 3 caracteres'));
      }
      
      const clientes = await db.Cliente.findAll({
        include: {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'telefono', 'activo'],
          where: {
            [db.Sequelize.Op.or]: [
              { nombre: { [db.Sequelize.Op.like]: `%${q}%` } },
              { email: { [db.Sequelize.Op.like]: `%${q}%` } },
              { telefono: { [db.Sequelize.Op.like]: `%${q}%` } }
            ]
          }
        },
        limit: 20
      });
      
      res.status(200).json({
        status: 'success',
        results: clientes.length,
        data: clientes
      });
    } catch (error) {
      logger.error(`Error al buscar clientes: ${error}`);
      next(error);
    }
  }

  /**
   * Crear nuevo cliente
   */
  static async crearCliente(req, res, next) {
    try {
      const {
        usuario,
        direccion,
        ciudad,
        codigoPostal,
        ocupacion,
        estadoCivil,
        contactoEmergencia,
        historialMedico
      } = req.body;

      // Validar que los campos requeridos existan
      if (!usuario || !usuario.nombre || !usuario.apellidos || !usuario.email || !usuario.telefono) {
        return next(new ValidationError('Faltan campos obligatorios del cliente'));
      }

      // Validar el género
      const generosValidos = ['masculino', 'femenino', 'otro', 'prefiero no decir', 'no_especificado'];
      const generoValidado = usuario.genero && generosValidos.includes(usuario.genero) ? usuario.genero : 'no_especificado';

      // Crear el cliente usando una transacción
      const nuevoCliente = await db.sequelize.transaction(async (t) => {
        // Primero crear el usuario
        const nuevoUsuario = await db.Usuario.create({
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: 'cliente',
          password: crypto.randomBytes(10).toString('hex'), // Generar contraseña temporal
          activo: true
        }, { transaction: t });

        // Luego crear el cliente asociado
        const cliente = await db.Cliente.create({
          userId: nuevoUsuario.id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        telefono: usuario.telefono,
        fechaNacimiento: usuario.fechaNacimiento || null,
        genero: generoValidado,
        direccion: direccion || null,
        ciudad: ciudad || null,
        codigoPostal: codigoPostal || null,
        ocupacion: ocupacion || null,
        estadoCivil: estadoCivil || null,
        contactoEmergencia: contactoEmergencia ? JSON.stringify(contactoEmergencia) : null,
        historialMedico: historialMedico ? JSON.stringify(historialMedico) : null,
        fechaRegistro: new Date()
        }, { transaction: t });

        return {
          id: cliente.id,
          usuario: {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            apellidos: nuevoUsuario.apellidos,
            email: nuevoUsuario.email,
            telefono: nuevoUsuario.telefono
          },
          direccion: cliente.direccion,
          ciudad: cliente.ciudad,
          codigoPostal: cliente.codigoPostal,
          ocupacion: cliente.ocupacion,
          estadoCivil: cliente.estadoCivil,
          contactoEmergencia: cliente.contactoEmergencia ? JSON.parse(cliente.contactoEmergencia) : null,
          historialMedico: cliente.historialMedico ? JSON.parse(cliente.historialMedico) : null,
          fechaRegistro: cliente.fechaRegistro
        };
      });

      res.status(201).json({
        status: 'success',
        message: 'Cliente creado exitosamente',
        data: nuevoCliente
      });
    } catch (error) {
      logger.error(`Error al crear cliente: ${error}`);
      // Si es un error de validación de Sequelize, enviamos un mensaje más amigable
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        return next(new ValidationError('Error de validación: ' + error.message));
      }
      next(error);
    }
  }
}

module.exports = ClienteController;

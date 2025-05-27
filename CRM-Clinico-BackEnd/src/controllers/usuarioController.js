const db = require('../models');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class UsuarioController {
  /**
   * Obtener todos los usuarios (solo admin)
   */
  static async obtenerTodos(req, res, next) {
    try {
      // Opciones para la consulta
      const opciones = {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
      };
      
      // Si hay filtros query, aplicarlos
      if (req.query.rol) {
        opciones.where = { rol: req.query.rol };
      }

      const usuarios = await db.Usuario.findAll(opciones);
      
      res.status(200).json({
        status: 'success',
        results: usuarios.length,
        data: usuarios
      });
    } catch (error) {
      logger.error(`Error al obtener usuarios: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener perfil del usuario actual 
   */
  static async obtenerPerfil(req, res, next) {
    try {
      // Excluir campos sensibles
      const usuarioSinCamposSensibles = {
        id: req.usuario.id,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol,
        telefono: req.usuario.telefono,
        ultimoLogin: req.usuario.ultimoLogin,
        createdAt: req.usuario.createdAt,
        updatedAt: req.usuario.updatedAt
      };
      
      // Obtener información adicional según el rol
      let datosAdicionales = {};
      
      if (req.usuario.rol === 'cliente') {
        const cliente = await db.Cliente.findOne({ where: { userId: req.usuario.id } });
        if (cliente) datosAdicionales = { cliente };
      } else if (req.usuario.rol === 'dentista') {
        const dentista = await db.Dentista.findOne({ where: { userId: req.usuario.id } });
        if (dentista) datosAdicionales = { dentista };
      }

      // Obtener settings del usuario
      let settings = await db.UserSettings.findOne({ where: { userId: req.usuario.id } });
      
      // Si no existen settings, crear con valores por defecto
      if (!settings) {
        settings = await db.UserSettings.create({
          userId: req.usuario.id,
          theme: 'light',
          language: 'es',
          notificationEmail: true,
          notificationApp: true,
          notificationSMS: false
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          usuario: {
            ...usuarioSinCamposSensibles,
            ...datosAdicionales
          },
          settings
        }
      });
    } catch (error) {
      logger.error(`Error al obtener perfil: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener un usuario por ID (admin o mismo usuario)
   */
  static async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verificar permisos: debe ser admin o el mismo usuario
      if (req.usuario.rol !== 'admin' && req.usuario.id !== parseInt(id)) {
        return next(new ForbiddenError('No tienes permiso para ver este usuario'));
      }
      
      const usuario = await db.Usuario.findByPk(id, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
      });
      
      if (!usuario) {
        return next(new NotFoundError(`No existe un usuario con ID: ${id}`));
      }
      
      // Obtener información adicional según el rol
      let datosAdicionales = {};
      
      if (usuario.rol === 'cliente') {
        const cliente = await db.Cliente.findOne({ where: { userId: usuario.id } });
        if (cliente) datosAdicionales = { cliente };
      } else if (usuario.rol === 'dentista') {
        const dentista = await db.Dentista.findOne({ where: { userId: usuario.id } });
        if (dentista) datosAdicionales = { dentista };
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          usuario,
          ...datosAdicionales
        }
      });
    } catch (error) {
      logger.error(`Error al obtener usuario por ID: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar información del usuario
   */
  static async actualizarUsuario(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, telefono, email } = req.body;
      
      // Verificar permisos: debe ser admin o el mismo usuario
      if (req.usuario.rol !== 'admin' && req.usuario.id !== parseInt(id)) {
        return next(new ForbiddenError('No tienes permiso para modificar este usuario'));
      }
      
      const usuario = await db.Usuario.findByPk(id);
      
      if (!usuario) {
        return next(new NotFoundError(`No existe un usuario con ID: ${id}`));
      }
      
      // Actualizar solo los campos proporcionados
      if (nombre) usuario.nombre = nombre;
      if (telefono) usuario.telefono = telefono;
      
      // Si se actualiza el email, verificar que no exista
      if (email && email !== usuario.email) {
        const existeEmail = await db.Usuario.findOne({ where: { email } });
        if (existeEmail) {
          return next(new ValidationError('El email ya está registrado por otro usuario'));
        }
        usuario.email = email;
      }
      
      await usuario.save();
      
      // Respuesta sin campos sensibles
      const usuarioActualizado = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
        updatedAt: usuario.updatedAt
      };
      
      res.status(200).json({
        status: 'success',
        data: usuarioActualizado
      });
    } catch (error) {
      logger.error(`Error al actualizar usuario: ${error}`);
      next(error);
    }
  }

  /**
   * Cambiar estado de activación del usuario (solo admin)
   */
  static async cambiarEstadoUsuario(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      
      const usuario = await db.Usuario.findByPk(id);
      
      if (!usuario) {
        return next(new NotFoundError(`No existe un usuario con ID: ${id}`));
      }
      
      // No permitir desactivar al propio administrador
      if (usuario.id === req.usuario.id) {
        return next(new ForbiddenError('No puedes cambiar el estado de tu propia cuenta'));
      }
      
      usuario.activo = activo;
      await usuario.save();
      
      res.status(200).json({
        status: 'success',
        message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
        data: {
          id: usuario.id,
          nombre: usuario.nombre,
          activo: usuario.activo
        }
      });
    } catch (error) {
      logger.error(`Error al cambiar estado de usuario: ${error}`);
      next(error);
    }
  }

  /**
   * Eliminar usuario (solo admin)
   */
  static async eliminarUsuario(req, res, next) {
    try {
      const { id } = req.params;
      
      // No permitir eliminar al propio administrador
      if (parseInt(id) === req.usuario.id) {
        return next(new ForbiddenError('No puedes eliminar tu propia cuenta'));
      }
      
      const resultado = await db.Usuario.destroy({ where: { id } });
      
      if (!resultado) {
        return next(new NotFoundError(`No existe un usuario con ID: ${id}`));
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Usuario eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar usuario: ${error}`);
      next(error);
    }
  }
}

module.exports = UsuarioController;

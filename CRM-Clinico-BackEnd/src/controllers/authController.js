const { UnauthorizedError, NotFoundError } = require('../utils/errors');
const { generarJWT, generarTokenResetPassword } = require('../utils/jwt');
const db = require('../models');
const logger = require('../utils/logger');
const { authSchemas } = require('../utils/validaciones');

class AuthController {
  /**
   * Registrar un nuevo usuario
   */
  static async registro(req, res, next) {
    try {
      const { nombre, email, password, rol, telefono } = req.body;
      
      // Verificar si el email ya existe
      const usuarioExistente = await db.Usuario.findOne({ where: { email } });
      if (usuarioExistente) {
        return next(new UnauthorizedError('Este correo electrónico ya está registrado'));
      }

      // Crear el usuario usando una transacción
      const resultado = await db.sequelize.transaction(async (t) => {
        // 1. Crear usuario
        const nuevoUsuario = await db.Usuario.create({
          nombre,
          email,
          password,
          rol,
          telefono
        }, { transaction: t });

        // 2. Si es cliente, crear registro de cliente
        if (rol === 'cliente') {
          await db.Cliente.create({
            userId: nuevoUsuario.id,
            fechaRegistro: new Date()
          }, { transaction: t });
        }
        
        // 3. Si es dentista, crear registro de dentista
        else if (rol === 'dentista') {
          await db.Dentista.create({
            userId: nuevoUsuario.id,
            status: 'activo'
          }, { transaction: t });
        }

        return nuevoUsuario;
      });

      // Generar JWT
      const token = await generarJWT(resultado.id);

      res.status(201).json({
        status: 'success',
        token,
        data: {
          id: resultado.id,
          nombre: resultado.nombre,
          email: resultado.email,
          rol: resultado.rol
        }
      });
    } catch (error) {
      logger.error(`Error en registro: ${error}`);
      next(error);
    }
  }

  /**
   * Login de usuario
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1) Verificar si el usuario existe
      const usuario = await db.Usuario.findOne({ where: { email } });
      if (!usuario) {
        return next(new UnauthorizedError('Email o contraseña incorrectos'));
      }

      // 2) Verificar si la contraseña es correcta
      const passwordCorrecta = await usuario.validarPassword(password);
      if (!passwordCorrecta) {
        return next(new UnauthorizedError('Email o contraseña incorrectos'));
      }

      // 3) Actualizar último login
      usuario.ultimoLogin = new Date();
      await usuario.save();

      // 4) Generar JWT
      const token = await generarJWT(usuario.id);

      // Respuesta
      res.status(200).json({
        status: 'success',
        token,
        data: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    } catch (error) {
      logger.error(`Error en login: ${error}`);
      next(error);
    }
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  static async olvidoPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      const usuario = await db.Usuario.findOne({ where: { email } });
      if (!usuario) {
        return next(new NotFoundError('No existe un usuario con ese correo electrónico'));
      }

      // Generar token de reset y establecer expiración
      const resetToken = generarTokenResetPassword();
      usuario.resetPasswordToken = resetToken;
      usuario.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
      await usuario.save();

      // En una implementación real, aquí enviaríamos un email con el token
      // Para fines de desarrollo, se devuelve el token en la respuesta
      logger.info(`Token de restablecimiento para ${email}: ${resetToken}`);

      res.status(200).json({
        status: 'success',
        message: 'Token de restablecimiento enviado al correo (simulado)',
        devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      logger.error(`Error en olvidoPassword: ${error}`);
      next(error);
    }
  }

  /**
   * Restablecer contraseña
   */
  static async restablecerPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Buscar usuario con el token y que no haya expirado
      const usuario = await db.Usuario.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [db.Sequelize.Op.gt]: Date.now() }
        }
      });

      if (!usuario) {
        return next(new UnauthorizedError('Token inválido o expirado'));
      }

      // Actualizar contraseña
      usuario.password = password;
      usuario.resetPasswordToken = null;
      usuario.resetPasswordExpires = null;
      await usuario.save();

      // Generar nuevo JWT
      const newToken = await generarJWT(usuario.id);

      res.status(200).json({
        status: 'success',
        token: newToken,
        message: 'Contraseña restablecida correctamente'
      });
    } catch (error) {
      logger.error(`Error en restablecerPassword: ${error}`);
      next(error);
    }
  }

  /**
   * Verificar token de usuario actual
   */
  static async verificarToken(req, res) {
    // Obtener información adicional del usuario según su rol
    let userData = {
      id: req.usuario.id,
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
      telefono: req.usuario.telefono,
      estado: req.usuario.estado || 'activo',
      ultimo_acceso: req.usuario.ultimoLogin,
      createdAt: req.usuario.createdAt,
      updatedAt: req.usuario.updatedAt
    };

    // Si el usuario es un cliente o dentista, obtener información adicional
    try {
      if (req.usuario.rol === 'cliente') {
        const cliente = await db.Cliente.findOne({ where: { userId: req.usuario.id } });
        if (cliente) {
          userData = { ...userData, cliente };
        }
      } else if (req.usuario.rol === 'dentista') {
        const dentista = await db.Dentista.findOne({ where: { userId: req.usuario.id } });
        if (dentista) {
          userData = { ...userData, dentista };
        }
      }
    } catch (error) {
      logger.error(`Error al obtener información adicional del usuario: ${error}`);
    }

    res.status(200).json({
      status: 'success',
      data: userData
    });
  }

  /**
   * Cambiar contraseña del usuario logueado
   */
  static async cambiarPassword(req, res, next) {
    try {
      const { passwordActual, passwordNueva, passwordConfirm } = req.body;

      if (passwordNueva !== passwordConfirm) {
        return next(new UnauthorizedError('Las contraseñas nuevas no coinciden'));
      }

      // Verificar contraseña actual
      const usuario = await db.Usuario.findByPk(req.usuario.id);
      const passwordCorrecta = await usuario.validarPassword(passwordActual);
      
      if (!passwordCorrecta) {
        return next(new UnauthorizedError('La contraseña actual es incorrecta'));
      }

      // Actualizar contraseña
      usuario.password = passwordNueva;
      await usuario.save();

      res.status(200).json({
        status: 'success',
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error en cambiarPassword: ${error}`);
      next(error);
    }
  }
}

module.exports = AuthController;

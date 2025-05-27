const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const config = require('../config');
const db = require('../models');

/**
 * Middleware para proteger rutas que requieren autenticación
 */
exports.protegerRuta = async (req, res, next) => {
  try {
    console.log('Iniciando verificación de autenticación');
    console.log('Headers:', req.headers);

    if (!req || !req.headers) {
      console.error('Request inválido:', { req: !!req, headers: !!req?.headers });
      return next(new UnauthorizedError('Solicitud inválida'));
    }

    // 1) Obtener token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token encontrado en headers');
    }

    if (!token) {
      console.error('Token no proporcionado');
      return next(new UnauthorizedError('No estás autenticado. Por favor, inicia sesión para acceder.'));
    }

    // 2) Verificar token
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, config.jwtSecret);
      console.log('Token decodificado exitosamente:', { userId: decoded.id, rol: decoded.rol });
    } catch (error) {
      console.error('Error al verificar token:', error);
      return next(new UnauthorizedError('Token inválido o expirado. Por favor, inicia sesión nuevamente.'));
    }

    // 3) Verificar si el usuario aún existe y obtener su información actualizada
    const usuarioActual = await db.Usuario.findByPk(decoded.id);
    if (!usuarioActual) {
      console.error('Usuario no encontrado:', decoded.id);
      return next(new UnauthorizedError('El usuario que pertenece a este token ya no existe.'));
    }

    console.log('Usuario encontrado:', {
      id: usuarioActual.id,
      rol: usuarioActual.rol,
      nombre: usuarioActual.nombre
    });

    // 4) Verificar si el rol coincide con el del token (más permisivo)
    if (decoded.rol && decoded.rol !== usuarioActual.rol) {
      console.warn('Rol no coincide, pero permitiendo acceso:', { 
        tokenRol: decoded.rol, 
        usuarioRol: usuarioActual.rol 
      });
    }

    // 5) Comprobar si el usuario cambió la contraseña después de que se emitió el token
    if (usuarioActual.cambioPaswordDespues && decoded.iat < usuarioActual.cambioPaswordDespues) {
      console.error('Contraseña cambiada después de emitir el token');
      return next(new UnauthorizedError('Usuario cambió recientemente su contraseña. Por favor, inicia sesión nuevamente.'));
    }

    // Añadir usuario a req para usarlo en las rutas protegidas
    req.usuario = usuarioActual;
    console.log('Usuario autenticado exitosamente');
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return next(new UnauthorizedError('Error de autenticación. Por favor, inicia sesión nuevamente.'));
  }
};

/**
 * Middleware para restringir acceso según roles
 * @param  {...String} roles Array de roles permitidos
 */
exports.restringirA = (...roles) => {
  return (req, res, next) => {
    console.log('Verificando rol para ruta restringida:', { 
      ruta: req.originalUrl,
      metodo: req.method,
      userRole: req.usuario.rol, 
      allowedRoles: roles 
    });

    if (!roles.includes(req.usuario.rol)) {
      console.error('Acceso denegado por rol:', { 
        ruta: req.originalUrl,
        userRole: req.usuario.rol, 
        allowedRoles: roles 
      });
      return next(new ForbiddenError('No tienes permiso para realizar esta acción'));
    }
    
    console.log('Acceso permitido por rol');
    next();
  };
};

/**
 * Middleware para verificar propiedad del recurso o rol admin
 * @param {Function} getResourceUserId Función que extrae el ID del usuario propietario del recurso
 */
exports.verificarPropietarioOAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (req.usuario.rol === 'admin') return next();
    
    const resourceUserId = await getResourceUserId(req);
    
    if (req.usuario.id !== resourceUserId) {
      return next(new ForbiddenError('No tienes permiso para acceder a este recurso'));
    }
    
    next();
  };
};

/**
 * Middleware para fines de logging de acceso
 */
exports.registrarAcceso = async (req, res, next) => {
  if (req.usuario) {
    // Actualizar último login (considerar hacer esto sólo en el login)
    req.usuario.ultimoLogin = Date.now();
    await req.usuario.save();
  }
  next();
};

const logger = require('../utils/logger');
const { AppError, ValidationError: CustomValidationError } = require('../utils/errors');
const { ValidationError: SequelizeValidationError } = require('sequelize');

/**
 * Controlador de errores de desarrollo - muestra detalles completos
 */
const sendErrorDev = (err, res) => {
  logger.error(`ERROR 💥: ${err.message}`);
  logger.debug(err.stack);
  
  // Si es un error de validación personalizado
  if (err instanceof CustomValidationError) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  
  // Para otros tipos de errores, mantener el comportamiento actual
  const errorResponse = {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: err.path || 'unknown',
    type: err.type || 'unknown'
  };

  if (err.errors) {
    errorResponse.validationErrors = err.errors;
  }
  
  res.status(err.statusCode).json(errorResponse);
};

/**
 * Controlador de errores de producción - muestra información limitada
 */
const sendErrorProd = (err, res) => {
  // Si es un error de validación personalizado
  if (err instanceof CustomValidationError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Error operacional, de confianza: enviar mensaje al cliente
  if (err.isOperational) {
    logger.error(`ERROR 💥: ${err.message}`);
    
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code || 'UNKNOWN_ERROR'
    });
  }
  
  // Error de programación o desconocido: no filtrar detalles
  logger.error('ERROR 💥: Unexpected error', {
    message: err.message,
    name: err.name,
    stack: err.stack
  });
  
  // Enviar mensaje genérico
  return res.status(500).json({
    status: 'error',
    message: 'Ha ocurrido un error interno. Por favor, inténtalo de nuevo más tarde.',
    code: 'INTERNAL_SERVER_ERROR'
  });
};

/**
 * Error handler para errores de JWT
 */
const handleJWTError = () => 
  new AppError('Token inválido. Por favor, inicia sesión nuevamente.', 401);

/**
 * Error handler para errores de expiración de JWT
 */
const handleJWTExpiredError = () => 
  new AppError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 401);

/**
 * Error handler para errores de Sequelize de validación
 */
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map((error) => ({
    field: error.path,
    message: error.message
  }));
  
  return new CustomValidationError('Error de validación', { errors });
};

/**
 * Error handler para errores de Sequelize de base de datos
 */
const handleSequelizeDatabaseError = (err) => {
  logger.error('Database Error:', err);
  return new AppError('Error en la base de datos. Por favor, inténtalo de nuevo.', 500);
};

/**
 * Error handler para errores de sintaxis JSON
 */
const handleJSONSyntaxError = (err) => {
  return new AppError('JSON inválido en la solicitud', 400);
};

/**
 * Middleware para manejo global de errores
 */
module.exports = (err, req, res, next) => {
  // Asegurar que req y res existan
  if (!req || !res) {
    logger.error('Error crítico: req o res undefined en el manejador de errores');
    return;
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Agregar información de la ruta al error
  err.path = req.path;
  err.method = req.method;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    
    // Manejar errores específicos
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'SequelizeValidationError') error = handleSequelizeValidationError(error);
    if (error.name === 'SequelizeDatabaseError') error = handleSequelizeDatabaseError(error);
    if (error.name === 'SyntaxError' && error.type === 'entity.parse.failed') error = handleJSONSyntaxError(error);
    
    sendErrorProd(error, res);
  }
};

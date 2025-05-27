const rateLimit = require('express-rate-limit');
const config = require('../config');
const { BadRequestError } = require('../utils/errors');

/**
 * Middleware para limitar el número de solicitudes
 * Solo se aplica en producción
 */
const limiter = (req, res, next) => {
  // Si estamos en desarrollo, no aplicamos el rate limit
  if (config.environment === 'development') {
    return next();
  }

  // Configuración del rate limit para producción
  const productionLimiter = rateLimit({
    windowMs: config.rateLimitWindow * 60 * 1000, // convertir minutos a ms
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new BadRequestError(`Demasiadas solicitudes desde esta IP, por favor intenta de nuevo después de ${config.rateLimitWindow} minutos`));
    }
  });

  return productionLimiter(req, res, next);
};

module.exports = limiter;

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { BadRequestError } = require('../utils/errors');

// Crear el limiter una sola vez para evitar recrearlo por request.
const productionLimiter = rateLimit({
  windowMs: config.rateLimitWindow * 60 * 1000,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new BadRequestError(`Demasiadas solicitudes desde esta IP, por favor intenta de nuevo después de ${config.rateLimitWindow} minutos`));
  }
});

/**
 * Middleware para limitar el número de solicitudes
 * Solo se aplica en producción
 */
const limiter = (req, res, next) => {
  // Solo aplicar rate limit en producción.
  if (config.environment !== 'production') {
    return next();
  }

  return productionLimiter(req, res, next);
};

module.exports = limiter;

const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Middleware para validar datos de entrada usando esquemas Zod
 * @param {Object} schema - Esquema Zod para validación
 */
const validarDatos = (schema) => {
  return (req, res, next) => {
    try {
      logger.debug('Datos recibidos para validación:', req.body);
      schema.parse(req.body);
      next();
    } catch (error) {
      logger.error('Error de validación:', error.errors);
      next(new ValidationError(error.errors));
    }
  };
};

const validarId = (req, res, next) => {
  const id = req.params.id;
  
  if (!id || id === 'undefined' || id === 'null') {
    return next(new ValidationError('Se requiere un ID válido'));
  }

  if (isNaN(id)) {
    return next(new ValidationError('El ID debe ser un número válido'));
  }

  // Convertir el ID a número
  req.params.id = Number(id);
  next();
};

module.exports = {
  validarDatos,
  validarId
};

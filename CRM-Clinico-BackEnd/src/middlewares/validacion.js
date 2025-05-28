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
      const resultado = schema.safeParse(req.body);
      
      if (!resultado.success) {
        const errores = resultado.error.errors.map(err => ({
          campo: err.path.join('.'),
          mensaje: err.message,
          codigo: err.code
        }));
        
        logger.error('Errores de validación:', errores);
        
        return res.status(422).json({
          status: 'error',
          message: 'Error de validación',
          errors: errores
        });
      }

      // Si la validación es exitosa, actualizar el body con los datos transformados
      req.body = resultado.data;
      next();
    } catch (error) {
      logger.error('Error inesperado en validación:', error);
      next(new ValidationError('Error al validar los datos'));
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

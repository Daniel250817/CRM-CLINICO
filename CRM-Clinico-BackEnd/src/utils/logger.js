const winston = require('winston');
const config = require('../config');

// Define niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colores para cada nivel de log
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Agregar colores a Winston
winston.addColors(colors);

// Configuración de formato para los logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Definir transports (destinos) para los logs
const transports = [
  // Escribir todos los logs en archivo combined.log
  new winston.transports.File({
    filename: 'logs/combined.log',
  }),
  // Escribir logs de error en archivo error.log
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // Mostrar logs en consola en desarrollo
  new winston.transports.Console(),
];

// Crear instancia de logger
const logger = winston.createLogger({
  level: config.environment === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

module.exports = logger;

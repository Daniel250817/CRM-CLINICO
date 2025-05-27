require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '7355bf975c5edac3b3ae6af52f2c50666bcc2120e6c7c23fff864bfb729c700b9e4de45376d8777129216270c464d93502fdc73a0824f036d0877fd78aa5d7c7',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // en minutos
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100 // máximo de solicitudes por ventana
};

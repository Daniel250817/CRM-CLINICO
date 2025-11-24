require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '7355bf975c5edac3b3ae6af52f2c50666bcc2120e6c7c23fff864bfb729c700b9e4de45376d8777129216270c464d93502fdc73a0824f036d0877fd78aa5d7c7',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m', // Tokens de acceso más cortos
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'b8f7c9e3a2d4f6h8j9k1m3n5p7q9r2s4t6u8v0w2x4y6z8a0b2c4d6e8f0g2h4j6k8l0m2n4o6p8q0r2s4t6u8v0w2x4y6z8',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Refresh tokens de larga duración
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // en minutos
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100 // máximo de solicitudes por ventana
};

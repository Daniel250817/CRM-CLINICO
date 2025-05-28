require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./models');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimit');
const { swaggerDocs } = require('./config/swagger');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const dentistaRoutes = require('./routes/dentistaRoutes');
const citaRoutes = require('./routes/citaRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const tareaRoutes = require('./routes/tareaRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const seguimientoRoutes = require('./routes/seguimientoRoutes');
const userSettingsRoutes = require('./routes/userSettingsRoutes');

// Inicializar la aplicación
const app = express();

// Configure router settings
app.set('strict routing', true);
app.set('case sensitive routing', true);

// Middleware para logs
// Crear directorio de logs si no existe
const logDirectory = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Configurar middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Configuración de seguridad
app.use(helmet({
  crossOriginResourcePolicy: {
    policy: "cross-origin"
  }
}));

app.use(morgan('combined', { stream: { write: message => logger.http(message.trim()) } }));
app.use(rateLimiter);

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/dentistas', dentistaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/settings', userSettingsRoutes);

// Servir archivos estáticos con las cabeceras correctas
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

// Ruta de estado para verificar que el servidor está corriendo
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API funcionando correctamente',
    environment: config.environment,
    timestamp: new Date().toISOString()
  });
});

// Inicializar documentación Swagger
const PORT = config.port || 3000;
try {
  swaggerDocs(app, PORT);
  logger.info(`Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
} catch (error) {
  logger.error(`Error al inicializar Swagger: ${error.message}`);
}

// Manejo de rutas no encontradas
app.all('*', (req, res, next) => {
  const err = new Error(`No se encontró la ruta ${req.originalUrl} en este servidor`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

// Middleware de manejo de errores
app.use(errorHandler);

const server = app.listen(PORT, async () => {
  logger.info(`Servidor corriendo en el puerto ${PORT} en modo ${config.environment}`);
  
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente');
    
    // Sincronizar modelos en desarrollo (solo para desarrollo)
    if (config.environment === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Base de datos lista');
    }
  } catch (error) {
    logger.error(`Error al conectar con la base de datos: ${error.message}`);
  }
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  logger.error('¡EXCEPCIÓN NO CAPTURADA! Cerrando servidor...');
  logger.error(err.name, err.message);
  console.error('ERROR STACK:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('¡PROMESA RECHAZADA NO CAPTURADA! Cerrando servidor...');
  logger.error(err.name, err.message);
  console.error('ERROR STACK:', err.stack); // <--- Agrega esta línea
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Clínica Dental',
      version: '1.0.0',
      description: 'API para gestión de clínica dental',
      contact: {
        name: 'Administrador',
        email: 'admin@clinicadental.com'
      },
    },    
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Servidor de desarrollo',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../models/*.js'),
    path.join(__dirname, '../docs/*.js')
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app, port) => {
  try {
    // Ruta para la documentación JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Configurar la UI de Swagger
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    console.log(`Documentación Swagger disponible en http://localhost:${port}/api-docs`);
    return true;
  } catch (error) {
    console.error(`Error initializing Swagger: ${error.message}`);
    return false;
  }
};

module.exports = { swaggerDocs };

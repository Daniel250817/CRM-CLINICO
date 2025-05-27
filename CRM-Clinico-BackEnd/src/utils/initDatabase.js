const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * Script para inicializar la base de datos
 * Crea un usuario administrador si no existe ninguno
 */
const initDatabase = async () => {
  try {
    // Comprobar si hay algún administrador
    const { Usuario } = sequelize.models;
    const adminExists = await Usuario.findOne({
      where: { rol: 'admin' }
    });

    if (!adminExists) {
      // Crear usuario administrador por defecto
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('admin123', salt);
      
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@crmclinico.com',
        password,
        rol: 'admin',
        telefono: '5555555555',
        activo: true
      });
      
      logger.info('Usuario administrador creado exitosamente');
    } else {
      logger.info('Ya existe un usuario administrador');
    }

    // Comprobar si hay servicios
    const { Servicio } = sequelize.models;
    const serviciosCount = await Servicio.count();
    
    if (serviciosCount === 0) {
      // Crear servicios de muestra
      await Servicio.bulkCreate([
        {
          nombre: 'Limpieza dental',
          descripcion: 'Limpieza profesional para remover placa y sarro',
          precio: 50.00,
          duracion: 60,
          categoria: 'Higiene',
          activo: true
        },
        {
          nombre: 'Extracción dental simple',
          descripcion: 'Extracción de dientes con anestesia local',
          precio: 70.00,
          duracion: 45,
          categoria: 'Extracción',
          activo: true
        },
        {
          nombre: 'Ortodoncia - Consulta inicial',
          descripcion: 'Evaluación para tratamiento de ortodoncia',
          precio: 80.00,
          duracion: 60,
          categoria: 'Ortodoncia',
          activo: true
        },
        {
          nombre: 'Blanqueamiento dental',
          descripcion: 'Tratamiento para aclarar el color de los dientes',
          precio: 150.00,
          duracion: 90,
          categoria: 'Estética',
          activo: true
        },
        {
          nombre: 'Empaste dental',
          descripcion: 'Relleno de cavidades con material compuesto',
          precio: 60.00,
          duracion: 45,
          categoria: 'Restauración',
          activo: true
        }
      ]);
      
      logger.info('Servicios de muestra creados exitosamente');
    } else {
      logger.info(`Existen ${serviciosCount} servicios en la base de datos`);
    }

    logger.info('Inicialización de la base de datos completada');
  } catch (error) {
    logger.error(`Error al inicializar la base de datos: ${error.message}`);
    throw error;
  }
};

module.exports = initDatabase;

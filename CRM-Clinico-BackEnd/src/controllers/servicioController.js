const db = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class ServicioController {
  /**
   * Crear un nuevo servicio
   */
  static async crearServicio(req, res, next) {
    try {
      const { nombre, descripcion, precio, duracion, categoria, codigoServicio, activo } = req.body;
      let imagen = null;      // Manejar la imagen si se subió una
      if (req.file) {
        imagen = `/uploads/servicios/${req.file.filename}`;
      }

      // Verificar si ya existe un servicio con el mismo código
      if (codigoServicio) {
        const servicioExistente = await db.Servicio.findOne({
          where: { codigoServicio }
        });

        if (servicioExistente) {
          // Si hay una imagen subida, eliminarla
          if (req.file) {
            await fs.unlink(req.file.path);
          }
          return next(new ValidationError(`Ya existe un servicio con el código: ${codigoServicio}`));
        }
      }

      const nuevoServicio = await db.Servicio.create({
        nombre,
        descripcion,
        precio,
        duracion,
        imagen,
        categoria,
        codigoServicio,
        activo: activo !== undefined ? activo : true
      });

      res.status(201).json({
        status: 'success',
        data: nuevoServicio
      });
    } catch (error) {
      // Si hay un error y se subió una imagen, eliminarla
      if (req.file) {
        await fs.unlink(req.file.path).catch(err => 
          logger.error(`Error al eliminar archivo temporal: ${err}`)
        );
      }
      logger.error(`Error al crear servicio: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener todos los servicios
   */
  static async obtenerServicios(req, res, next) {
    try {
      const { activo, categoria } = req.query;
      
      // Filtrar por activo si se proporciona
      const where = {};
      
      if (activo === 'true' || activo === 'false') {
        where.activo = activo === 'true';
      }
      
      if (categoria) {
        where.categoria = categoria;
      }
      
      const servicios = await db.Servicio.findAll({
        where,
        order: [['nombre', 'ASC']]
      });
      
      res.status(200).json({
        status: 'success',
        results: servicios.length,
        data: servicios
      });
    } catch (error) {
      logger.error(`Error al obtener servicios: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener un servicio por ID
   */
  static async obtenerServicioPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      const servicio = await db.Servicio.findByPk(id);
      
      if (!servicio) {
        return next(new NotFoundError(`No existe un servicio con ID: ${id}`));
      }
      
      res.status(200).json({
        status: 'success',
        data: servicio
      });
    } catch (error) {
      logger.error(`Error al obtener servicio por ID: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar un servicio
   */
  static async actualizarServicio(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, duracion, categoria, codigoServicio, activo } = req.body;
      
      const servicio = await db.Servicio.findByPk(id);
      
      if (!servicio) {
        if (req.file) {
          await fs.unlink(req.file.path);
        }
        return next(new NotFoundError(`No existe un servicio con ID: ${id}`));
      }
      
      // Verificar si ya existe otro servicio con el mismo código (solo si cambió)
      if (codigoServicio && codigoServicio !== servicio.codigoServicio) {
        const servicioExistente = await db.Servicio.findOne({
          where: { codigoServicio }
        });

        if (servicioExistente) {
          if (req.file) {
            await fs.unlink(req.file.path);
          }
          return next(new ValidationError(`Ya existe un servicio con el código: ${codigoServicio}`));
        }
      }
        // Manejar la imagen
      let imagen = servicio.imagen;
      if (req.file) {
        // Si hay una imagen anterior, eliminarla
        if (servicio.imagen) {
          const imagenAnterior = path.join(__dirname, '../../uploads/servicios', path.basename(servicio.imagen));
          await fs.unlink(imagenAnterior).catch(err => 
            logger.error(`Error al eliminar imagen anterior: ${err}`)
          );
        }
        imagen = `/uploads/servicios/${req.file.filename}`;
      }
      
      // Actualizar campos
      if (nombre !== undefined) servicio.nombre = nombre;
      if (descripcion !== undefined) servicio.descripcion = descripcion;
      if (precio !== undefined) servicio.precio = precio;
      if (duracion !== undefined) servicio.duracion = duracion;
      if (imagen !== undefined) servicio.imagen = imagen;
      if (categoria !== undefined) servicio.categoria = categoria;
      if (codigoServicio !== undefined) servicio.codigoServicio = codigoServicio;
      if (activo !== undefined) servicio.activo = activo;
      
      await servicio.save();
      
      res.status(200).json({
        status: 'success',
        data: servicio
      });
    } catch (error) {
      // Si hay un error y se subió una imagen, eliminarla
      if (req.file) {
        await fs.unlink(req.file.path).catch(err => 
          logger.error(`Error al eliminar archivo temporal: ${err}`)
        );
      }
      logger.error(`Error al actualizar servicio: ${error}`);
      next(error);
    }
  }

  /**
   * Eliminar un servicio
   */
  static async eliminarServicio(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verificar si hay citas programadas con este servicio
      const citasConServicio = await db.Cita.count({
        where: {
          servicioId: id,
          estado: {
            [db.Sequelize.Op.notIn]: ['cancelada', 'completada']
          }
        }
      });
      
      if (citasConServicio > 0) {
        return next(new ValidationError(`No se puede eliminar el servicio porque hay ${citasConServicio} citas programadas`));
      }
      
      const resultado = await db.Servicio.destroy({ where: { id } });
      
      if (!resultado) {
        return next(new NotFoundError(`No existe un servicio con ID: ${id}`));
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Servicio eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar servicio: ${error}`);
      next(error);
    }
  }

  /**
   * Obtener categorías únicas de servicios
   */
  static async obtenerCategorias(req, res, next) {
    try {
      const categorias = await db.Servicio.findAll({
        attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('categoria')), 'categoria']],
        where: {
          categoria: {
            [db.Sequelize.Op.not]: null
          }
        },
        raw: true
      });
      
      const listaCategorias = categorias.map(cat => cat.categoria).filter(Boolean);
      
      res.status(200).json({
        status: 'success',
        data: listaCategorias
      });
    } catch (error) {
      logger.error(`Error al obtener categorías: ${error}`);
      next(error);
    }
  }
}

module.exports = ServicioController;

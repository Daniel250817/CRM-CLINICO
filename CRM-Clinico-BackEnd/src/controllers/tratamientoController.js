const { AppError } = require('../utils/errors');
const { Cliente, Tratamiento, Dentista } = require('../models');
const { logger } = require('../utils/logger');

class TratamientoController {
  /**
   * Obtener todos los tratamientos de un cliente
   */
  async obtenerTratamientosCliente(req, res, next) {
    try {
      const { clienteId } = req.params;
      
      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(clienteId);
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }

      // Obtener tratamientos con información del dentista
      const tratamientos = await Tratamiento.findAll({
        where: { clienteId },
        include: [{
          model: Dentista,
          as: 'dentista',
          attributes: ['id', 'nombre']
        }]
      });

      res.status(200).json({
        status: 'success',
        data: tratamientos.map(t => ({
          id: t.id,
          clienteId: t.clienteId,
          nombre: t.nombre,
          descripcion: t.descripcion,
          fechaInicio: t.fechaInicio,
          fechaFin: t.fechaFin,
          estado: t.estado,
          progreso: t.progreso,
          dentistaId: t.dentistaId,
          dentistaNombre: t.dentista?.nombre,
          sesionesTotales: t.sesionesTotales,
          sesionesCompletadas: t.sesionesCompletadas,
          notas: t.notas
        }))
      });
    } catch (error) {
      logger.error(`Error al obtener tratamientos: ${error.message}`);
      next(error);
    }
  }

  /**
   * Crear un nuevo tratamiento
   */
  async crearTratamiento(req, res, next) {
    try {
      const { clienteId } = req.params;
      const { 
        nombre, 
        descripcion, 
        fechaInicio, 
        dentistaId, 
        sesionesTotales,
        notas 
      } = req.body;

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(clienteId);
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }

      // Verificar que el dentista existe
      const dentista = await Dentista.findByPk(dentistaId);
      if (!dentista) {
        throw new AppError('Dentista no encontrado', 404);
      }

      // Crear el tratamiento
      const tratamiento = await Tratamiento.create({
        clienteId,
        dentistaId,
        nombre,
        descripcion,
        fechaInicio,
        sesionesTotales,
        notas
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: tratamiento.id,
          clienteId: tratamiento.clienteId,
          nombre: tratamiento.nombre,
          descripcion: tratamiento.descripcion,
          fechaInicio: tratamiento.fechaInicio,
          estado: tratamiento.estado,
          progreso: tratamiento.progreso,
          dentistaId: tratamiento.dentistaId,
          sesionesTotales: tratamiento.sesionesTotales,
          sesionesCompletadas: tratamiento.sesionesCompletadas,
          notas: tratamiento.notas
        }
      });
    } catch (error) {
      logger.error(`Error al crear tratamiento: ${error.message}`);
      next(error);
    }
  }

  /**
   * Actualizar un tratamiento
   */
  async actualizarTratamiento(req, res, next) {
    try {
      const { tratamientoId } = req.params;
      const { 
        progreso, 
        sesionesCompletadas, 
        estado, 
        notas,
        fechaFin 
      } = req.body;

      // Buscar el tratamiento
      const tratamiento = await Tratamiento.findByPk(tratamientoId);
      if (!tratamiento) {
        throw new AppError('Tratamiento no encontrado', 404);
      }

      // Actualizar el tratamiento
      await tratamiento.update({
        progreso,
        sesionesCompletadas,
        estado,
        notas,
        fechaFin
      });

      res.status(200).json({
        status: 'success',
        data: {
          id: tratamiento.id,
          clienteId: tratamiento.clienteId,
          nombre: tratamiento.nombre,
          descripcion: tratamiento.descripcion,
          fechaInicio: tratamiento.fechaInicio,
          fechaFin: tratamiento.fechaFin,
          estado: tratamiento.estado,
          progreso: tratamiento.progreso,
          dentistaId: tratamiento.dentistaId,
          sesionesTotales: tratamiento.sesionesTotales,
          sesionesCompletadas: tratamiento.sesionesCompletadas,
          notas: tratamiento.notas
        }
      });
    } catch (error) {
      logger.error(`Error al actualizar tratamiento: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new TratamientoController(); 
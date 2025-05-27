const path = require('path');
const fs = require('fs');
const { Cliente } = require('../models/Cliente');
const { Cita } = require('../models/Cita');
const { AppError } = require('../utils/errors');

/**
 * Controller for handling file uploads and management 
 */
class ArchivoController {
  /**
   * Upload a medical record for a client
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async uploadMedicalRecord(req, res, next) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        throw new AppError('No se ha proporcionado ningún archivo', 400);
      }

      const { clienteId } = req.params;
      
      // Check if client exists
      const cliente = await Cliente.findByPk(clienteId);
      if (!cliente) {
        // Delete the uploaded file if client doesn't exist
        fs.unlinkSync(req.file.path);
        throw new AppError('Cliente no encontrado', 404);
      }

      // Create record in database or update existing one
      // For simplicity, we're just updating the cliente record
      // In a real app, you might want to create a separate model for medical records
      await cliente.update({
        historial_medico: req.file.path
      });

      res.status(200).json({
        status: 'success',
        message: 'Historial médico subido correctamente',
        data: {
          filename: req.file.filename,
          path: req.file.path
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload an X-ray image for an appointment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async uploadXray(req, res, next) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        throw new AppError('No se ha proporcionado ningún archivo', 400);
      }

      const { citaId } = req.params;
      
      // Check if appointment exists
      const cita = await Cita.findByPk(citaId);
      if (!cita) {
        // Delete the uploaded file if appointment doesn't exist
        fs.unlinkSync(req.file.path);
        throw new AppError('Cita no encontrada', 404);
      }

      // Update appointment with the X-ray file path
      // In a real application, you might want to store multiple X-rays
      // using a separate model with a relation to the appointment
      await cita.update({
        notas: JSON.stringify({
          ...JSON.parse(cita.notas || '{}'),
          xray: req.file.path
        })
      });

      res.status(200).json({
        status: 'success',
        message: 'Radiografía subida correctamente',
        data: {
          filename: req.file.filename,
          path: req.file.path
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a medical record file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getMedicalRecord(req, res, next) {
    try {
      const { clienteId } = req.params;
      
      // Check if client exists
      const cliente = await Cliente.findByPk(clienteId);
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }

      // Check if client has a medical record
      if (!cliente.historial_medico) {
        throw new AppError('El cliente no tiene un historial médico registrado', 404);
      }

      // Serve the file
      res.sendFile(cliente.historial_medico);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get an X-ray image
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getXray(req, res, next) {
    try {
      const { citaId } = req.params;
      
      // Check if appointment exists
      const cita = await Cita.findByPk(citaId);
      if (!cita) {
        throw new AppError('Cita no encontrada', 404);
      }

      // Check if appointment has an X-ray
      const notas = JSON.parse(cita.notas || '{}');
      if (!notas.xray) {
        throw new AppError('La cita no tiene una radiografía registrada', 404);
      }

      // Serve the file
      res.sendFile(notas.xray);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ArchivoController();

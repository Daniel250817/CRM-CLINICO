const { AppError } = require('../utils/errors');
const { Cliente } = require('../models');
const { logger } = require('../utils/logger');
const path = require('path');

class DocumentoController {
  /**
   * Obtener todos los documentos de un cliente
   */
  async obtenerDocumentosCliente(req, res, next) {
    try {
      const { clienteId } = req.params;
      
      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(clienteId);
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }

      // Obtener documentos del cliente desde la base de datos
      const documentos = await cliente.getDocumentos();

      res.status(200).json({
        status: 'success',
        data: documentos.map(doc => ({
          id: doc.id,
          clienteId: doc.clienteId,
          nombre: doc.nombre,
          tipo: doc.tipo,
          fechaCreacion: doc.createdAt,
          tamano: doc.tamano,
          ruta: doc.ruta
        }))
      });
    } catch (error) {
      logger.error(`Error al obtener documentos del cliente: ${error}`);
      next(error);
    }
  }

  /**
   * Subir un nuevo documento para un cliente
   */
  async subirDocumento(req, res, next) {
    try {
      const { clienteId } = req.params;
      const { file } = req;
      
      if (!file) {
        throw new AppError('No se ha proporcionado ningún archivo', 400);
      }

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(clienteId);
      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }

      // Crear el documento en la base de datos
      const documento = await cliente.createDocumento({
        nombre: req.body.nombre || file.originalname,
        tipo: req.body.tipo || path.extname(file.originalname).substring(1),
        tamano: file.size,
        ruta: file.path
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: documento.id,
          clienteId: documento.clienteId,
          nombre: documento.nombre,
          tipo: documento.tipo,
          fechaCreacion: documento.createdAt,
          tamano: documento.tamano,
          ruta: documento.ruta
        }
      });
    } catch (error) {
      logger.error(`Error al subir documento: ${error}`);
      next(error);
    }
  }

  /**
   * Eliminar un documento
   */
  async eliminarDocumento(req, res, next) {
    try {
      const { documentoId } = req.params;

      // Buscar y eliminar el documento
      const documento = await Documento.findByPk(documentoId);
      if (!documento) {
        throw new AppError('Documento no encontrado', 404);
      }

      await documento.destroy();

      res.status(200).json({
        status: 'success',
        message: 'Documento eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar documento: ${error}`);
      next(error);
    }
  }
}

module.exports = new DocumentoController(); 
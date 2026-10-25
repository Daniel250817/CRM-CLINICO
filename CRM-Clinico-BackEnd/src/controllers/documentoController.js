const { AppError } = require('../utils/errors');
const { Cliente, Documento } = require('../models');
const { logger } = require('../utils/logger');
const path = require('path');

class DocumentoController {
  /**
   * Obtener todos los documentos de un cliente
   */
  async obtenerDocumentosCliente(req, res, next) {
    try {
      const clienteId = req.params.clienteId || req.params.id;
      
      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(clienteId, {
        include: [{
          model: Documento,
          as: 'documentos'
        }]
      });

      if (!cliente) {
        throw new AppError('Cliente no encontrado', 404);
      }

      res.status(200).json({
        status: 'success',
        data: cliente.documentos.map(doc => ({
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
      logger.error(`Error al obtener documentos del cliente: ${error.message}`);
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Error al obtener documentos del cliente', 500));
      }
    }
  }

  /**
   * Subir un nuevo documento para un cliente
   */
  async subirDocumento(req, res, next) {
    try {
      const clienteId = req.params.clienteId || req.params.id;
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
      const publicPath = `/uploads/documents/${file.filename}`;

      const documento = await Documento.create({
        clienteId: cliente.id,
        nombre: req.body.nombre || file.originalname,
        tipo: req.body.tipo || path.extname(file.originalname).substring(1),
        tamano: file.size,
        ruta: publicPath
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
      logger.error(`Error al subir documento: ${error.message}`);
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Error al subir el documento', 500));
      }
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
      logger.error(`Error al eliminar documento: ${error.message}`);
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Error al eliminar el documento', 500));
      }
    }
  }

  /**
   * Actualizar un documento: cambiar nombre y/o reemplazar archivo
   */
  async actualizarDocumento(req, res, next) {
    try {
      const { documentoId } = req.params;

      const documento = await Documento.findByPk(documentoId);
      if (!documento) {
        throw new AppError('Documento no encontrado', 404);
      }

      // Si se proporciona un nuevo archivo, actualizar ruta y tamano
      if (req.file) {
        // Eliminar archivo anterior si existe
        try {
          if (documento.ruta) {
            const oldPath = path.join(__dirname, '../../', documento.ruta);
            const fs = require('fs');
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
        } catch (err) {
          // No bloquear en caso de fallo al eliminar el archivo antiguo
          logger.warn(`No se pudo eliminar el archivo antiguo: ${err.message}`);
        }

        const publicPath = `/uploads/documents/${req.file.filename}`;
        documento.ruta = publicPath;
        documento.tamano = req.file.size;
      }

      // Si se proporciona nombre en el body, actualizarlo
      if (req.body && req.body.nombre) {
        documento.nombre = req.body.nombre;
      }

      await documento.save();

      res.status(200).json({
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
      logger.error(`Error al actualizar documento: ${error.message}`);
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Error al actualizar el documento', 500));
      }
    }
  }
}

module.exports = new DocumentoController(); 
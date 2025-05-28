const db = require('../models');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class UserSettingsController {
  /**
   * Obtener configuración del usuario actual
   */
  static async obtenerSettings(req, res, next) {
    try {
      let settings = await db.UserSettings.findOne({
        where: { userId: req.usuario.id }
      });

      // Si no existe, crear con valores por defecto
      if (!settings) {
        settings = await db.UserSettings.create({
          userId: req.usuario.id
        });
      }

      res.status(200).json({
        status: 'success',
        data: settings
      });
    } catch (error) {
      logger.error(`Error al obtener settings: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar configuración del usuario
   */
  static async actualizarSettings(req, res, next) {
    try {
      const { theme, language, notificationEmail, notificationApp, notificationSMS, avatar } = req.body;

      let settings = await db.UserSettings.findOne({
        where: { userId: req.usuario.id }
      });

      if (!settings) {
        settings = await db.UserSettings.create({
          userId: req.usuario.id,
          theme,
          language,
          notificationEmail,
          notificationApp,
          notificationSMS,
          avatar
        });
      } else {
        await settings.update({
          theme,
          language,
          notificationEmail,
          notificationApp,
          notificationSMS,
          avatar
        });
      }

      res.status(200).json({
        status: 'success',
        data: settings
      });
    } catch (error) {
      logger.error(`Error al actualizar settings: ${error}`);
      next(error);
    }
  }

  /**
   * Actualizar avatar del usuario
   */
  static async actualizarAvatar(req, res, next) {
    try {
      if (!req.file) {
        return next(new Error('No se ha proporcionado ninguna imagen'));
      }

      // Log de información del archivo recibido
      console.log('Archivo recibido:', {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const settings = await db.UserSettings.findOne({
        where: { userId: req.usuario.id }
      });

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const fullPath = path.join(__dirname, '../../uploads/avatars', req.file.filename);

      // Verificar que el archivo existe
      try {
        await fs.access(fullPath);
        console.log('Archivo guardado correctamente en:', fullPath);
      } catch (error) {
        console.error('Error al acceder al archivo:', error);
        return next(new Error('Error al guardar el archivo'));
      }

      // Si no existe configuración, crearla
      if (!settings) {
        await db.UserSettings.create({
          userId: req.usuario.id,
          avatar: avatarUrl,
          theme: 'light',
          language: 'es',
          notificationEmail: true,
          notificationApp: true,
          notificationSMS: false
        });
      } else {
        // Si existe una imagen anterior, eliminarla
        if (settings.avatar) {
          const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(settings.avatar));
          try {
            await fs.unlink(oldAvatarPath);
            console.log('Avatar anterior eliminado:', oldAvatarPath);
          } catch (error) {
            console.error('Error al eliminar avatar anterior:', error);
          }
        }

        // Actualizar con la nueva imagen
        await settings.update({
          avatar: avatarUrl
        });
      }

      // Obtener el usuario con sus settings actualizados
      const usuario = await db.Usuario.findByPk(req.usuario.id, {
        attributes: ['id', 'nombre', 'email', 'rol', 'telefono', 'createdAt', 'updatedAt'],
        include: [{
          model: db.UserSettings,
          as: 'settings',
          attributes: ['theme', 'language', 'notificationEmail', 'notificationApp', 'notificationSMS', 'avatar']
        }]
      });

      console.log('Usuario actualizado:', usuario.toJSON());

      res.status(200).json({
        status: 'success',
        message: 'Avatar actualizado correctamente',
        data: {
          ...usuario.toJSON(),
          settings: {
            ...usuario.settings.toJSON(),
            avatar: avatarUrl
          }
        }
      });
    } catch (error) {
      // Si hay error, eliminar el archivo subido
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
          console.error('Archivo temporal eliminado debido a error:', req.file.path);
        } catch (unlinkError) {
          console.error('Error al eliminar archivo temporal:', unlinkError);
        }
      }
      console.error('Error al actualizar avatar:', error);
      next(error);
    }
  }
}

module.exports = UserSettingsController; 
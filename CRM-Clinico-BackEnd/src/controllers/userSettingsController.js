const db = require('../models');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

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
}

module.exports = UserSettingsController; 
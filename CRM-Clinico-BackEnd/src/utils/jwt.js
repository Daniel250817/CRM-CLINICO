const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../models');
const crypto = require('crypto');

/**
 * Genera un JSON Web Token para un usuario
 * @param {Number} id - ID del usuario
 * @returns {String} - Token JWT generado
 */
exports.generarJWT = async (id) => {
  try {
    // Obtener el usuario para incluir su rol
    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return jwt.sign(
      { 
        id: usuario.id,
        rol: usuario.rol 
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  } catch (error) {
    console.error('Error al generar JWT:', error);
    throw error;
  }
};

/**
 * Genera un refresh token para un usuario
 * @param {Number} id - ID del usuario
 * @returns {String} - Refresh token generado
 */
exports.generarRefreshToken = async (id) => {
  try {
    // Obtener el usuario para incluir su rol
    const usuario = await db.Usuario.findByPk(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return jwt.sign(
      { 
        id: usuario.id,
        rol: usuario.rol,
        type: 'refresh'
      },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn }
    );
  } catch (error) {
    console.error('Error al generar refresh token:', error);
    throw error;
  }
};

/**
 * Verifica un token JWT
 * @param {String} token - Token JWT a verificar
 * @returns {Object} - Objeto decodificado del token o null si es inválido
 */
exports.verificarJWT = async (token) => {
  try {
    const decoded = await jwt.verify(token, config.jwtSecret);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verifica un refresh token
 * @param {String} token - Refresh token a verificar
 * @returns {Object} - Objeto decodificado del token o null si es inválido
 */
exports.verificarRefreshToken = async (token) => {
  try {
    const decoded = await jwt.verify(token, config.jwtRefreshSecret);
    
    // Verificar que sea un refresh token
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Genera un nuevo access token usando un refresh token válido
 * @param {String} refreshToken - Refresh token válido
 * @returns {Object} - Objeto con nuevo access token y opcionalmente nuevo refresh token
 */
exports.refrescarToken = async (refreshToken) => {
  try {
    // Verificar el refresh token
    const decoded = await exports.verificarRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Refresh token inválido');
    }

    // Verificar que el usuario aún exista
    const usuario = await db.Usuario.findByPk(decoded.id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el refresh token esté almacenado en la base de datos
    if (usuario.refreshToken !== refreshToken) {
      throw new Error('Refresh token no coincide');
    }

    // Generar nuevo access token
    const nuevoAccessToken = await exports.generarJWT(usuario.id);
    
    // Generar nuevo refresh token (rotación de tokens)
    const nuevoRefreshToken = await exports.generarRefreshToken(usuario.id);
    
    // Actualizar el refresh token en la base de datos
    await usuario.update({ refreshToken: nuevoRefreshToken });

    return {
      accessToken: nuevoAccessToken,
      refreshToken: nuevoRefreshToken
    };
  } catch (error) {
    console.error('Error al refrescar token:', error);
    throw error;
  }
};

/**
 * Invalida un refresh token
 * @param {Number} userId - ID del usuario
 */
exports.invalidarRefreshToken = async (userId) => {
  try {
    const usuario = await db.Usuario.findByPk(userId);
    if (usuario) {
      await usuario.update({ refreshToken: null });
    }
  } catch (error) {
    console.error('Error al invalidar refresh token:', error);
    throw error;
  }
};

/**
 * Genera un token para restablecer contraseña
 * @returns {String} - Token aleatorio
 */
exports.generarTokenResetPassword = () => {
  // Generar un número aleatorio y convertirlo a base 36 (incluye letras y números)
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  
  return resetToken;
};

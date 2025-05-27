const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../models');

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
 * Genera un token para restablecer contraseña
 * @returns {String} - Token aleatorio
 */
exports.generarTokenResetPassword = () => {
  // Generar un número aleatorio y convertirlo a base 36 (incluye letras y números)
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  
  return resetToken;
};

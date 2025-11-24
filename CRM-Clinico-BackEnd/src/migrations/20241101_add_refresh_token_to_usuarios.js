'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usuarios', 'refreshToken', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Token de actualización para renovar tokens de acceso'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('usuarios', 'refreshToken');
  }
};

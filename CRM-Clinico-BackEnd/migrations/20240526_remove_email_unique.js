'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Eliminar cualquier índice único en el campo email
    await queryInterface.removeConstraint('clientes', 'clientes_email_unique');
    await queryInterface.removeIndex('clientes', 'clientes_email_unique');
  },

  down: async (queryInterface, Sequelize) => {
    // Si necesitas revertir, puedes volver a agregar la restricción única
    await queryInterface.addConstraint('clientes', {
      fields: ['email'],
      type: 'unique',
      name: 'clientes_email_unique'
    });
  }
}; 